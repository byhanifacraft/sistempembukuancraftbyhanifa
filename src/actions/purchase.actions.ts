"use server";

import prisma from "@/lib/prisma";
import { purchaseSchema } from "@/lib/validations";
import { ItemType, MutationType, PaymentMethod, PaymentStatus } from "@prisma/client";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/serialize";
import { getCurrentUserId } from "@/lib/auth";
import { formatErrorMessage } from "@/lib/utils";

export async function getPurchases(params?: {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (params?.startDate || params?.endDate) {
      where.purchaseDate = {};
      if (params.startDate) where.purchaseDate.gte = new Date(params.startDate);
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.purchaseDate.lte = end;
      }
    }

    const [purchases, totalCount] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          purchaseItems: {
            include: {
              rawMaterial: { include: { unit: true } },
            },
          },
          createdBy: true,
        },
        orderBy: { purchaseDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.purchase.count({ where }),
    ]);

    return {
      data: serializePrisma(purchases),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching purchases:", error);
    throw new Error("Gagal memuat riwayat pembelian bahan baku.");
  }
}

/**
 * Record Purchase of Raw Materials
 * Atomic Prisma Transaction with Moving Weighted Average & Row Locking (FOR UPDATE)
 */
export async function createPurchase(formData: unknown, userId?: string) {
  try {
    const validated = purchaseSchema.parse(formData);
    const { supplierName, purchaseDate, paymentMethod, paymentStatus, notes, items } = validated;

    const validUserId = await getCurrentUserId(userId);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate Purchase Number with atomic random suffix
      const countTotal = await tx.purchase.count();
      const dateStr = format(purchaseDate || new Date(), "yyyyMMdd");
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const purchaseNumber = `PB-${dateStr}-${String(countTotal + 1).padStart(4, "0")}-${randomSuffix}`;

      let totalPurchaseAmount = 0;

      const processedItems: {
        rawMaterialId: string;
        quantity: number;
        unitCost: number;
        subtotal: number;
      }[] = [];

      for (const item of items) {
        const itemSubtotal = Math.round(item.quantity * item.unitCost);
        totalPurchaseAmount += itemSubtotal;

        // Row lock raw material
        const lockedRows: any[] = await tx.$queryRaw`
          SELECT id, name, current_stock, avg_cost_per_unit, last_cost_per_unit 
          FROM raw_materials 
          WHERE id = ${item.rawMaterialId}::uuid AND deleted_at IS NULL 
          FOR UPDATE
        `;

        if (!lockedRows || lockedRows.length === 0) {
          throw new Error("Bahan baku tidak ditemukan.");
        }

        const material = lockedRows[0];
        const currentStock = Number(material.current_stock);
        const currentAvgCost = Number(material.avg_cost_per_unit);
        const purchaseQty = Number(item.quantity);
        const purchaseUnitCost = Number(item.unitCost);

        // Calculate Moving Weighted Average:
        // newAvgCost = ((currentStock * currentAvgCost) + (purchaseQty * purchaseUnitCost)) / (currentStock + purchaseQty)
        const totalValue = currentStock * currentAvgCost + purchaseQty * purchaseUnitCost;
        const totalQty = currentStock + purchaseQty;
        const newAvgCost = totalQty > 0 ? Math.round(totalValue / totalQty) : purchaseUnitCost;
        const newStock = currentStock + purchaseQty;

        // Update raw material stock & costs
        await tx.rawMaterial.update({
          where: { id: item.rawMaterialId },
          data: {
            currentStock: newStock,
            avgCostPerUnit: newAvgCost,
            lastCostPerUnit: purchaseUnitCost,
          },
        });

        // Record stock mutation
        await tx.stockMutation.create({
          data: {
            itemType: ItemType.RAW_MATERIAL,
            rawMaterialId: item.rawMaterialId,
            mutationType: MutationType.PURCHASE_IN,
            quantity: purchaseQty,
            previousStock: currentStock,
            newStock: newStock,
            referenceType: "PURCHASE",
            notes: `Pembelian bahan baku no ${purchaseNumber} dari ${supplierName || "Supplier"}`,
            createdById: validUserId,
          },
        });

        processedItems.push({
          rawMaterialId: item.rawMaterialId,
          quantity: purchaseQty,
          unitCost: purchaseUnitCost,
          subtotal: itemSubtotal,
        });
      }

      // Create Purchase record
      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierName: supplierName?.trim() || null,
          purchaseDate: purchaseDate || new Date(),
          totalAmount: totalPurchaseAmount,
          paymentMethod: paymentMethod || PaymentMethod.BANK_TRANSFER,
          paymentStatus: paymentStatus === "UNPAID" ? PaymentStatus.UNPAID : PaymentStatus.PAID,
          notes: notes?.trim() || null,
          createdById: validUserId,
          purchaseItems: {
            create: processedItems.map((pi) => ({
              rawMaterialId: pi.rawMaterialId,
              quantity: pi.quantity,
              unitCost: pi.unitCost,
              subtotal: pi.subtotal,
            })),
          },
        },
        include: { purchaseItems: true },
      });

      return purchase;
    }, { maxWait: 5000, timeout: 10000 });

    try {
      revalidatePath("/pengeluaran");
      revalidatePath("/pengeluaran/beli-bahan");
      revalidatePath("/bahan-baku");
      revalidatePath("/produk");
      revalidatePath("/laporan/arus-kas");
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: serializePrisma(result) };
  } catch (error: any) {
    console.error("Error recording purchase:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal mencatat pembelian bahan baku."),
    };
  }
}

export async function deletePurchase(id: string) {
  try {
    await prisma.purchase.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    try {
      revalidatePath("/pengeluaran");
      revalidatePath("/pengeluaran/beli-bahan");
      revalidatePath("/laporan/arus-kas");
      revalidatePath("/");
    } catch {}
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting purchase:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal menghapus riwayat pembelian."),
    };
  }
}
