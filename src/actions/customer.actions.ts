"use server";

import prisma from "@/lib/prisma";
import { serializePrisma } from "@/lib/serialize";

export interface CustomerSummary {
  customerKey: string;
  name: string;
  phone: string | null;
  address: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  channels: string[];
}

export async function getCustomers(params?: { search?: string }): Promise<CustomerSummary[]> {
  try {
    const search = params?.search?.trim() || "";

    const where: any = {
      deletedAt: null,
      customerName: { not: null },
    };

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
        { customerAddress: { contains: search, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        channel: true,
        customerName: true,
        customerPhone: true,
        customerAddress: true,
        orderDate: true,
        totalAmount: true,
        status: true,
      },
      orderBy: { orderDate: "desc" },
    });

    const customerMap = new Map<string, CustomerSummary>();

    for (const order of orders) {
      const name = (order.customerName || "Pelanggan").trim();
      const phone = order.customerPhone ? order.customerPhone.trim() : null;
      const address = order.customerAddress ? order.customerAddress.trim() : null;

      // Grouping identity: prioritize clean phone number, fallback to normalized name
      const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";
      const customerKey =
        cleanPhone && cleanPhone.length >= 8
          ? `phone:${cleanPhone}`
          : `name:${name.toLowerCase()}`;

      const existing = customerMap.get(customerKey);
      if (!existing) {
        customerMap.set(customerKey, {
          customerKey,
          name,
          phone,
          address,
          totalOrders: 1,
          totalSpent: order.totalAmount || 0,
          lastOrderDate: order.orderDate.toISOString(),
          channels: [order.channel],
        });
      } else {
        existing.totalOrders += 1;
        existing.totalSpent += order.totalAmount || 0;
        if (!existing.phone && phone) existing.phone = phone;
        if (!existing.address && address) existing.address = address;
        if (!existing.channels.includes(order.channel)) {
          existing.channels.push(order.channel);
        }
        if (new Date(order.orderDate) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.orderDate.toISOString();
          if (address) existing.address = address;
          if (name) existing.name = name;
        }
      }
    }

    const customers = Array.from(customerMap.values()).sort(
      (a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
    );

    return serializePrisma(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Gagal memuat data pelanggan.");
  }
}
