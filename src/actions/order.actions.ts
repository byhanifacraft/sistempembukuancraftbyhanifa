"use server";

import prisma from "@/lib/prisma";
import { offlineOrderSchema } from "@/lib/validations";
import {
  ItemType,
  MutationType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductionMode,
  SalesChannel,
} from "@prisma/client";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/serialize";
import { getCurrentUserId, requireOwnerRole } from "@/lib/auth";
import { formatErrorMessage } from "@/lib/utils";

export async function getOrders(params?: {
  channel?: SalesChannel;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (params?.channel) {
      where.channel = params.channel;
    }

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.startDate || params?.endDate) {
      where.orderDate = {};
      if (params.startDate) {
        where.orderDate.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.orderDate.lte = end;
      }
    }

    if (params?.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: "insensitive" } },
        { externalOrderSn: { contains: params.search, mode: "insensitive" } },
        { customerName: { contains: params.search, mode: "insensitive" } },
        { orderItems: { some: { productName: { contains: params.search, mode: "insensitive" } } } },
      ];
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: {
                select: { id: true, name: true, productionMode: true, imageUrl: true },
              },
            },
          },
          importLog: {
            select: { id: true, fileName: true, createdAt: true },
          },
        },
        orderBy: { orderDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: serializePrisma(orders),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Gagal memuat riwayat transaksi penjualan.");
  }
}

export async function getOrderById(id: string) {
  try {
    const order = await prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
                bomItems: {
                  include: {
                    rawMaterial: { include: { unit: true } },
                  },
                },
              },
            },
          },
        },
        importLog: true,
      },
    });

    return serializePrisma(order);
  } catch (error) {
    console.error("Error fetching order detail:", error);
    throw new Error("Gagal memuat rincian pesanan.");
  }
}

/**
 * Create Offline / Direct Sales Order
 * Atomic Prisma Transaction with Row Locking (FOR UPDATE)
 */
export async function createOfflineOrder(formData: unknown, userId?: string) {
  try {
    const validated = offlineOrderSchema.parse(formData);
    const validUserId = await getCurrentUserId(userId);

    const {
      customerName,
      customerPhone,
      customerAddress,
      orderDate,
      paymentMethod,
      paymentStatus,
      status,
      discountAmount,
      shippingFee,
      notes,
      items,
    } = validated;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate Order Number with atomic random suffix to avoid concurrency collision
      const countToday = await tx.order.count();
      const dateStr = format(orderDate || new Date(), "yyyyMMdd");
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const orderNumber = `CBH-${dateStr}-${String(countToday + 1).padStart(4, "0")}-${randomSuffix}`;

      // 2. Process Order Items & Stock Deductions
      const processedItems: {
        productId?: string | null;
        productName: string;
        productSku?: string | null;
        variantName?: string | null;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        unitHpp: number;
        customNote?: string | null;
      }[] = [];

      let totalOrderHpp = 0;
      let subtotalAmount = 0;

      for (const item of items) {
        const itemSubtotal = item.quantity * item.unitPrice;
        subtotalAmount += itemSubtotal;

        let snapshotUnitHpp = 0;

        if (item.productId) {
          // Lock the product row
          const lockedProductRows: any[] = await tx.$queryRaw`
            SELECT id, name, sku, current_stock, cost_price, production_mode 
            FROM products 
            WHERE id = ${item.productId}::uuid AND deleted_at IS NULL 
            FOR UPDATE
          `;

          if (!lockedProductRows || lockedProductRows.length === 0) {
            throw new Error(`Produk "${item.productName}" tidak ditemukan.`);
          }

          const product = lockedProductRows[0];

          if (product.production_mode === ProductionMode.STOCK_BASED) {
            // STOCK_BASED: HPP is the snapshot of latest costPrice
            snapshotUnitHpp = Number(product.cost_price);

            // Deduct finished goods stock with stock sufficiency check
            const prevStock = Number(product.current_stock);
            if (prevStock < item.quantity) {
              throw new Error(
                `Stok produk "${product.name}" tidak mencukupi untuk pesanan. Butuh ${item.quantity} pcs, tetapi stok tersedia hanya ${prevStock} pcs.`
              );
            }
            const newStock = prevStock - item.quantity;

            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: newStock },
            });

            await tx.stockMutation.create({
              data: {
                itemType: ItemType.FINISHED_PRODUCT,
                productId: item.productId,
                mutationType: MutationType.SALE_OUT,
                quantity: item.quantity,
                previousStock: prevStock,
                newStock: newStock,
                referenceType: "ORDER",
                notes: `Penjualan offline faktur ${orderNumber}`,
                createdById: validUserId,
              },
            });
          } else {
            // MADE_TO_ORDER: Calculate snapshot HPP from BOM & deduct raw materials directly
            const bomItems = await tx.billOfMaterial.findMany({
              where: { productId: item.productId },
              include: { rawMaterial: { include: { unit: true } } },
            });

            if (bomItems.length > 0) {
              const materialIds = bomItems.map((b) => b.rawMaterialId);

              // Row lock raw materials
              const lockedMaterials: any[] = await tx.$queryRaw`
                SELECT id, name, current_stock, avg_cost_per_unit, unit_id 
                FROM raw_materials 
                WHERE id = ANY(${materialIds}::uuid[]) AND deleted_at IS NULL 
                FOR UPDATE
              `;

              const materialMap = new Map(lockedMaterials.map((m) => [m.id, m]));
              let itemBOMCost = 0;
              const shortages: string[] = [];

              for (const bom of bomItems) {
                const material = materialMap.get(bom.rawMaterialId);
                if (!material) continue;

                const qtyNeededTotal = Number(bom.quantityNeeded) * item.quantity;
                const availableStock = Number(material.current_stock);

                if (availableStock < qtyNeededTotal) {
                  shortages.push(
                    `• ${material.name}: Butuh ${qtyNeededTotal} ${bom.rawMaterial.unit.symbol}, tersedia ${availableStock} ${bom.rawMaterial.unit.symbol}`
                  );
                }

                const unitCost = Number(material.avg_cost_per_unit);
                itemBOMCost += Number(bom.quantityNeeded) * unitCost;
              }

              if (shortages.length > 0) {
                throw new Error(
                  `Stok bahan baku tidak cukup untuk membuat pesanan kustom "${item.productName}" (Qty: ${item.quantity}):\n\n` +
                    shortages.join("\n")
                );
              }

              // Deduct raw materials
              for (const bom of bomItems) {
                const material = materialMap.get(bom.rawMaterialId)!;
                const qtyNeededTotal = Number(bom.quantityNeeded) * item.quantity;
                const prevStock = Number(material.current_stock);
                const newStock = prevStock - qtyNeededTotal;

                await tx.rawMaterial.update({
                  where: { id: bom.rawMaterialId },
                  data: { currentStock: newStock },
                });

                await tx.stockMutation.create({
                  data: {
                    itemType: ItemType.RAW_MATERIAL,
                    rawMaterialId: bom.rawMaterialId,
                    mutationType: MutationType.PRODUCTION_OUT,
                    quantity: qtyNeededTotal,
                    previousStock: prevStock,
                    newStock: newStock,
                    referenceType: "ORDER",
                    notes: `Bahan untuk pesanan kustom ${orderNumber} (${item.productName})`,
                    createdById: validUserId,
                  },
                });
              }

              snapshotUnitHpp = Math.round(itemBOMCost);
            }
          }
        }

        totalOrderHpp += snapshotUnitHpp * item.quantity;

        processedItems.push({
          productId: item.productId || null,
          productName: item.productName,
          productSku: item.productSku || null,
          variantName: item.variantName || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: itemSubtotal,
          unitHpp: snapshotUnitHpp,
          customNote: item.customNote || null,
        });
      }

      const totalAmount = subtotalAmount - (discountAmount || 0) + (shippingFee || 0);
      const roundedTotalHpp = Math.round(totalOrderHpp);
      const netMarginAmount = totalAmount - roundedTotalHpp;

      // 3. Save Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          channel: SalesChannel.OFFLINE,
          customerName: customerName?.trim() || "Pelanggan Offline",
          customerPhone: customerPhone?.trim() || null,
          customerAddress: customerAddress?.trim() || null,
          orderDate: orderDate || new Date(),
          status: status || OrderStatus.COMPLETED,
          paymentStatus: paymentStatus || PaymentStatus.PAID,
          paymentMethod: paymentMethod || PaymentMethod.CASH,
          subtotalAmount,
          discountAmount: discountAmount || 0,
          shippingFee: shippingFee || 0,
          platformFee: 0,
          totalAmount,
          totalHppAmount: roundedTotalHpp,
          netMarginAmount,
          notes: notes?.trim() || null,
          orderItems: {
            create: processedItems.map((pi) => ({
              productId: pi.productId,
              productName: pi.productName,
              productSku: pi.productSku,
              variantName: pi.variantName,
              quantity: pi.quantity,
              unitPrice: pi.unitPrice,
              subtotal: pi.subtotal,
              unitHpp: pi.unitHpp,
              customNote: pi.customNote,
            })),
          },
        },
        include: {
          orderItems: true,
        },
      });

      return order;
    }, { maxWait: 5000, timeout: 10000 });

    try {
      revalidatePath("/transaksi");
      revalidatePath("/produk");
      revalidatePath("/bahan-baku");
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: serializePrisma(result) };
  } catch (error: any) {
    console.error("Error creating offline order:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal mencatat transaksi penjualan."),
    };
  }
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  try {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    try {
      revalidatePath("/transaksi");
      revalidatePath(`/transaksi/${orderId}`);
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: serializePrisma(updated) };
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal memperbarui status pesanan."),
    };
  }
}

export async function deleteOrder(orderId: string) {
  try {
    await requireOwnerRole();
    await prisma.order.update({
      where: { id: orderId },
      data: { deletedAt: new Date() },
    });

    try {
      revalidatePath("/transaksi");
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting order:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal menghapus transaksi."),
    };
  }
}
