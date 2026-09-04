"use server";

import prisma from "@/lib/prisma";
import { OrderStatus, ProductionMode, SalesChannel } from "@prisma/client";
import { endOfMonth, format, startOfMonth, subDays } from "date-fns";
import { serializePrisma } from "@/lib/serialize";

export async function getDashboardSummary() {
  try {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOf7DaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    // Run ALL independent queries in PARALLEL via a single Promise.all batch
    const [
      validOrdersMonth,
      monthExpenses,
      lowRawMaterials,
      lowProducts,
      recentOrders,
      last7DaysOrders,
    ] = await Promise.all([
      // 1. Valid orders this month with lightweight selected fields
      prisma.order.findMany({
        where: {
          orderDate: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.RETURNED] },
          deletedAt: null,
        },
        select: {
          id: true,
          totalAmount: true,
          totalHppAmount: true,
          channel: true,
          orderDate: true,
          orderItems: {
            select: {
              productId: true,
              productName: true,
              quantity: true,
              subtotal: true,
            },
          },
        },
      }),

      // 2. Operating expenses this month
      prisma.expense.findMany({
        where: {
          expenseDate: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
          deletedAt: null,
        },
        select: {
          amount: true,
        },
      }),

      // 3. Raw materials for stock alerts (only needed fields)
      prisma.rawMaterial.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          currentStock: true,
          minimumStock: true,
          unit: { select: { symbol: true } },
        },
      }),

      // 4. Products for stock alerts (only needed fields)
      prisma.product.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          productionMode: ProductionMode.STOCK_BASED,
        },
        select: {
          id: true,
          name: true,
          currentStock: true,
          minStockAlert: true,
        },
      }),

      // 5. Recent 5 orders with items
      prisma.order.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          orderNumber: true,
          channel: true,
          totalAmount: true,
          orderDate: true,
          customerName: true,
          orderItems: {
            select: {
              id: true,
              productName: true,
              variantName: true,
              quantity: true,
              customNote: true,
            },
          },
        },
        orderBy: { orderDate: "desc" },
        take: 5,
      }),

      // 6. Single query for 7-Day Revenue Trend (replaces 7 sequential loop queries)
      prisma.order.findMany({
        where: {
          orderDate: { gte: startOf7DaysAgo, lte: endOfToday },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.RETURNED] },
          deletedAt: null,
        },
        select: {
          orderDate: true,
          totalAmount: true,
        },
      }),
    ]);

    // Fast in-memory aggregations
    const monthRevenue = validOrdersMonth.reduce((sum, o) => sum + o.totalAmount, 0);
    const monthHpp = validOrdersMonth.reduce((sum, o) => sum + o.totalHppAmount, 0);
    const monthGrossProfit = monthRevenue - monthHpp;

    const todayOrders = validOrdersMonth.filter(
      (o) => o.orderDate >= startOfToday && o.orderDate <= endOfToday
    );
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const todayCount = todayOrders.length;

    const totalMonthExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthNetProfit = monthGrossProfit - totalMonthExpenses;

    const channelStats = {
      shopee: { revenue: 0, count: 0 },
      offline: { revenue: 0, count: 0 },
      whatsapp: { revenue: 0, count: 0 },
      other: { revenue: 0, count: 0 },
    };

    for (const o of validOrdersMonth) {
      if (o.channel === SalesChannel.SHOPEE) {
        channelStats.shopee.revenue += o.totalAmount;
        channelStats.shopee.count++;
      } else if (o.channel === SalesChannel.OFFLINE) {
        channelStats.offline.revenue += o.totalAmount;
        channelStats.offline.count++;
      } else if (o.channel === SalesChannel.WHATSAPP) {
        channelStats.whatsapp.revenue += o.totalAmount;
        channelStats.whatsapp.count++;
      } else {
        channelStats.other.revenue += o.totalAmount;
        channelStats.other.count++;
      }
    }

    const lowStockRawMaterials = lowRawMaterials.filter(
      (m) => Number(m.currentStock) <= Number(m.minimumStock)
    );
    const lowStockProducts = lowProducts.filter(
      (p) => p.currentStock <= p.minStockAlert
    );

    const productSalesMap = new Map<
      string,
      { id: string; name: string; qty: number; revenue: number }
    >();

    for (const o of validOrdersMonth) {
      for (const item of o.orderItems) {
        const key = item.productId || item.productName;
        const existing = productSalesMap.get(key) || {
          id: item.productId || key,
          name: item.productName,
          qty: 0,
          revenue: 0,
        };
        existing.qty += item.quantity;
        existing.revenue += item.subtotal;
        productSalesMap.set(key, existing);
      }
    }

    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // In-memory bucketing for 7-day trend (O(N) lookup without any DB query)
    const last7Days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i);
      const startD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const endD = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

      const dayOrders = last7DaysOrders.filter((o) => {
        const time = new Date(o.orderDate).getTime();
        return time >= startD && time <= endD;
      });

      last7Days.push({
        date: format(d, "dd MMM"),
        revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        orders: dayOrders.length,
      });
    }

    return serializePrisma({
      today: {
        revenue: todayRevenue,
        orderCount: todayCount,
      },
      month: {
        revenue: monthRevenue,
        totalHpp: monthHpp,
        grossProfit: monthGrossProfit,
        operatingExpenses: totalMonthExpenses,
        netProfit: monthNetProfit,
        orderCount: validOrdersMonth.length,
      },
      channelStats,
      alerts: {
        rawMaterialCount: lowStockRawMaterials.length,
        rawMaterials: lowStockRawMaterials.slice(0, 5),
        productCount: lowStockProducts.length,
        products: lowStockProducts.slice(0, 5),
      },
      topSellingProducts,
      recentOrders,
      last7Days,
    });
  } catch (error) {
    console.error("Error generating dashboard summary:", error);
    throw new Error("Gagal memuat ringkasan dashboard.");
  }
}

export async function getProfitLossReport(params?: {
  startDate?: string;
  endDate?: string;
}) {
  try {
    const now = new Date();
    const start = params?.startDate ? new Date(params.startDate) : startOfMonth(now);
    const end = params?.endDate ? new Date(params.endDate) : endOfMonth(now);
    end.setHours(23, 59, 59, 999);

    // Parallel fetch orders and expenses with targeted selected fields
    const [orders, expenses] = await Promise.all([
      prisma.order.findMany({
        where: {
          orderDate: { gte: start, lte: end },
          deletedAt: null,
        },
        select: {
          status: true,
          channel: true,
          totalAmount: true,
          totalHppAmount: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          expenseDate: { gte: start, lte: end },
          deletedAt: null,
        },
        select: {
          amount: true,
          category: { select: { name: true } },
        },
      }),
    ]);

    const validOrders = orders.filter(
      (o) => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED
    );

    let shopeeRevenue = 0;
    let offlineRevenue = 0;
    let whatsappRevenue = 0;
    let totalHpp = 0;

    for (const o of validOrders) {
      totalHpp += o.totalHppAmount;
      if (o.channel === SalesChannel.SHOPEE) {
        shopeeRevenue += o.totalAmount;
      } else if (o.channel === SalesChannel.OFFLINE) {
        offlineRevenue += o.totalAmount;
      } else if (o.channel === SalesChannel.WHATSAPP) {
        whatsappRevenue += o.totalAmount;
      }
    }

    const totalRevenue = shopeeRevenue + offlineRevenue + whatsappRevenue;
    const grossProfit = totalRevenue - totalHpp;

    const expenseByCategoryMap = new Map<string, { name: string; amount: number }>();
    let totalExpenses = 0;

    for (const exp of expenses) {
      totalExpenses += exp.amount;
      const catName = exp.category.name;
      const existing = expenseByCategoryMap.get(catName) || { name: catName, amount: 0 };
      existing.amount += exp.amount;
      expenseByCategoryMap.set(catName, existing);
    }

    const expensesByCategory = Array.from(expenseByCategoryMap.values()).sort(
      (a, b) => b.amount - a.amount
    );

    const netProfit = grossProfit - totalExpenses;
    const netMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return serializePrisma({
      period: {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      },
      revenue: {
        shopee: shopeeRevenue,
        offline: offlineRevenue,
        whatsapp: whatsappRevenue,
        total: totalRevenue,
      },
      cogs: {
        totalHpp,
      },
      grossProfit,
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
      },
      netProfit,
      netMarginPercent: Number(netMarginPercent.toFixed(1)),
      orderCounts: {
        total: orders.length,
        valid: validOrders.length,
        cancelledOrReturned: orders.length - validOrders.length,
      },
    });
  } catch (error) {
    console.error("Error generating profit & loss report:", error);
    throw new Error("Gagal membuat laporan laba rugi.");
  }
}

export async function getCashFlowReport(params?: {
  startDate?: string;
  endDate?: string;
}) {
  try {
    const now = new Date();
    const start = params?.startDate ? new Date(params.startDate) : startOfMonth(now);
    const end = params?.endDate ? new Date(params.endDate) : endOfMonth(now);
    end.setHours(23, 59, 59, 999);

    // Parallel fetch with lean select columns
    const [paidOrders, purchases, expenses] = await Promise.all([
      prisma.order.findMany({
        where: {
          orderDate: { gte: start, lte: end },
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.RETURNED] },
          deletedAt: null,
        },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          channel: true,
          paymentMethod: true,
          orderDate: true,
        },
        orderBy: { orderDate: "desc" },
      }),
      prisma.purchase.findMany({
        where: {
          purchaseDate: { gte: start, lte: end },
          deletedAt: null,
        },
        select: {
          id: true,
          purchaseNumber: true,
          totalAmount: true,
          purchaseDate: true,
        },
        orderBy: { purchaseDate: "desc" },
      }),
      prisma.expense.findMany({
        where: {
          expenseDate: { gte: start, lte: end },
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          amount: true,
          expenseDate: true,
          category: { select: { name: true } },
        },
        orderBy: { expenseDate: "desc" },
      }),
    ]);

    let totalCashIn = 0;
    let shopeeCashIn = 0;
    let offlineCashIn = 0;
    let whatsappCashIn = 0;

    for (const o of paidOrders) {
      totalCashIn += o.totalAmount;
      if (o.channel === SalesChannel.SHOPEE) shopeeCashIn += o.totalAmount;
      else if (o.channel === SalesChannel.OFFLINE) offlineCashIn += o.totalAmount;
      else if (o.channel === SalesChannel.WHATSAPP) whatsappCashIn += o.totalAmount;
    }

    const totalPurchases = purchases.reduce((s, p) => s + p.totalAmount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalCashOut = totalPurchases + totalExpenses;
    const netCashFlow = totalCashIn - totalCashOut;

    return serializePrisma({
      period: {
        startDate: format(start, "yyyy-MM-dd"),
        endDate: format(end, "yyyy-MM-dd"),
      },
      totalCashIn,
      totalCashOut,
      netCashFlow,
      breakdown: {
        cashIn: {
          shopee: shopeeCashIn,
          offline: offlineCashIn,
          whatsapp: whatsappCashIn,
        },
        cashOut: {
          rawMaterialPurchases: totalPurchases,
          operatingExpenses: totalExpenses,
        },
      },
      recentTransactions: [
        ...paidOrders.slice(0, 5).map((o) => ({
          type: "IN",
          title: `Penjualan ${o.channel} #${o.orderNumber}`,
          amount: o.totalAmount,
          date: o.orderDate,
        })),
        ...purchases.slice(0, 5).map((p) => ({
          type: "OUT",
          title: `Beli Bahan #${p.purchaseNumber}`,
          amount: p.totalAmount,
          date: p.purchaseDate,
        })),
        ...expenses.slice(0, 5).map((e) => ({
          type: "OUT",
          title: `${e.category.name}: ${e.title}`,
          amount: e.amount,
          date: e.expenseDate,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10),
    });
  } catch (error) {
    console.error("Error generating cash flow report:", error);
    throw new Error("Gagal membuat laporan arus kas.");
  }
}
