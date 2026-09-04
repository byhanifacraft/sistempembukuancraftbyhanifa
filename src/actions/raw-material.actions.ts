"use server";

import prisma from "@/lib/prisma";
import { rawMaterialSchema } from "@/lib/validations";
import { ItemType, MutationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/serialize";
import { getCurrentUserId } from "@/lib/auth";
import { formatErrorMessage } from "@/lib/utils";

export async function getRawMaterials(params?: {
  search?: string;
  lowStockOnly?: boolean;
}) {
  try {
    const where: any = {
      deletedAt: null,
    };

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { sku: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const rawMaterials = await prisma.rawMaterial.findMany({
      where,
      include: {
        unit: true,
        _count: {
          select: { bomItems: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const serialized = serializePrisma(rawMaterials);

    if (params?.lowStockOnly) {
      return serialized.filter(
        (m) => Number(m.currentStock) <= Number(m.minimumStock)
      );
    }

    return serialized;
  } catch (error) {
    console.error("Error fetching raw materials:", error);
    throw new Error("Gagal memuat daftar bahan baku.");
  }
}

export async function getRawMaterialById(id: string) {
  try {
    const rawMaterial = await prisma.rawMaterial.findFirst({
      where: { id, deletedAt: null },
      include: {
        unit: true,
        bomItems: {
          include: {
            product: true,
          },
        },
        stockMutations: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { createdBy: true },
        },
      },
    });

    return serializePrisma(rawMaterial);
  } catch (error) {
    console.error("Error fetching raw material:", error);
    throw new Error("Gagal memuat detail bahan baku.");
  }
}

export async function createRawMaterial(formData: unknown, userId?: string) {
  try {
    const validated = rawMaterialSchema.parse(formData);
    const validUserId = await getCurrentUserId(userId);

    const result = await prisma.$transaction(async (tx) => {
      const material = await tx.rawMaterial.create({
        data: {
          name: validated.name.trim(),
          sku: validated.sku?.trim() || null,
          unitId: validated.unitId,
          currentStock: validated.currentStock,
          minimumStock: validated.minimumStock,
          avgCostPerUnit: validated.avgCostPerUnit,
          lastCostPerUnit: validated.lastCostPerUnit || validated.avgCostPerUnit,
          description: validated.description?.trim() || null,
        },
      });

      // If initial stock is greater than 0, record initial stock mutation
      if (validated.currentStock > 0) {
        await tx.stockMutation.create({
          data: {
            itemType: ItemType.RAW_MATERIAL,
            rawMaterialId: material.id,
            mutationType: MutationType.ADJUSTMENT_IN,
            quantity: validated.currentStock,
            previousStock: 0,
            newStock: validated.currentStock,
            referenceType: "INITIAL_SETUP",
            notes: "Saldo awal bahan baku saat pendaftaran master",
            createdById: validUserId,
          },
        });
      }

      return material;
    });

    try {
      revalidatePath("/bahan-baku");
      revalidatePath("/produk");
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: serializePrisma(result) };
  } catch (error: any) {
    console.error("Error creating raw material:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal menambahkan bahan baku."),
    };
  }
}

export async function updateRawMaterial(id: string, formData: unknown) {
  try {
    const validated = rawMaterialSchema.parse(formData);

    const updated = await prisma.rawMaterial.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        sku: validated.sku?.trim() || null,
        unitId: validated.unitId,
        minimumStock: validated.minimumStock,
        avgCostPerUnit: validated.avgCostPerUnit,
        lastCostPerUnit: validated.lastCostPerUnit || validated.avgCostPerUnit,
        description: validated.description?.trim() || null,
      },
    });

    try {
      revalidatePath("/bahan-baku");
      revalidatePath(`/bahan-baku/${id}`);
      revalidatePath("/produk");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: serializePrisma(updated) };
  } catch (error: any) {
    console.error("Error updating raw material:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal memperbarui bahan baku."),
    };
  }
}

export async function deleteRawMaterial(id: string) {
  try {
    // Check if used in active BOM recipes (ignore soft-deleted products)
    const bomCount = await prisma.billOfMaterial.count({
      where: {
        rawMaterialId: id,
        product: { deletedAt: null },
      },
    });

    if (bomCount > 0) {
      return {
        success: false,
        error: `Bahan baku tidak dapat dihapus karena masih digunakan dalam resep (${bomCount} produk aktif). Hapus keterkaitan resep produk terlebih dahulu.`,
      };
    }

    await prisma.rawMaterial.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    try {
      revalidatePath("/bahan-baku");
      revalidatePath("/produk");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting raw material:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal menghapus bahan baku."),
    };
  }
}

/**
 * Adjust raw material stock with pessimistic row lock (FOR UPDATE)
 */
export async function adjustRawMaterialStock(params: {
  rawMaterialId: string;
  newStock: number;
  reason: string;
  notes?: string;
  userId?: string;
}) {
  try {
    const { rawMaterialId, newStock, reason, notes, userId } = params;

    if (newStock < 0) {
      return {
        success: false,
        error: "Jumlah stok bahan baku tidak boleh bernilai negatif.",
      };
    }

    const validUserId = await getCurrentUserId(userId);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Pessimistic Row Lock
      const lockedRows: any[] = await tx.$queryRaw`
        SELECT id, current_stock FROM raw_materials 
        WHERE id = ${rawMaterialId}::uuid AND deleted_at IS NULL 
        FOR UPDATE
      `;

      if (!lockedRows || lockedRows.length === 0) {
        throw new Error("Bahan baku tidak ditemukan.");
      }

      const prevStock = Number(lockedRows[0].current_stock);
      const diff = newStock - prevStock;

      if (diff === 0) {
        return { message: "Tidak ada perubahan jumlah stok." };
      }

      const mutationType =
        diff > 0 ? MutationType.ADJUSTMENT_IN : MutationType.ADJUSTMENT_OUT;

      // 2. Update Stock
      const updatedMaterial = await tx.rawMaterial.update({
        where: { id: rawMaterialId },
        data: { currentStock: newStock },
      });

      // 3. Record Audit Mutation
      await tx.stockMutation.create({
        data: {
          itemType: ItemType.RAW_MATERIAL,
          rawMaterialId,
          mutationType,
          quantity: Math.abs(diff),
          previousStock: prevStock,
          newStock: newStock,
          referenceType: "MANUAL_ADJUSTMENT",
          notes: `${reason}: ${notes || "Penyesuaian stok manual oleh pengguna"}`,
          createdById: validUserId,
        },
      });

      return updatedMaterial;
    }, { maxWait: 5000, timeout: 10000 });

    try {
      revalidatePath("/bahan-baku");
      revalidatePath(`/bahan-baku/${params.rawMaterialId}`);
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: serializePrisma(result) };
  } catch (error: any) {
    console.error("Error adjusting stock:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal menyesuaikan stok bahan baku."),
    };
  }
}
