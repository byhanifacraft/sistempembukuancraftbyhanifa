"use server";

import prisma from "@/lib/prisma";
import { productSchema } from "@/lib/validations";
import { ItemType, MutationType, ProductionMode } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/serialize";
import { getCurrentUserId, requireOwnerRole } from "@/lib/auth";
import { formatErrorMessage } from "@/lib/utils";

export async function getProducts(params?: {
  search?: string;
  categoryId?: string;
  productionMode?: ProductionMode;
  isActive?: boolean;
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

    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params?.productionMode) {
      where.productionMode = params.productionMode;
    }

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
        bomItems: {
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return serializePrisma(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Gagal memuat katalog produk.");
  }
}

export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        bomItems: {
          include: {
            rawMaterial: {
              include: { unit: true },
            },
          },
        },
        productionRuns: {
          orderBy: { productionDate: "desc" },
          take: 10,
          include: { createdBy: true },
        },
        stockMutations: {
          where: { itemType: ItemType.FINISHED_PRODUCT },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { createdBy: true },
        },
      },
    });

    return serializePrisma(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    throw new Error("Gagal memuat data produk.");
  }
}

/**
 * Calculate HPP from BOM items and current raw material avg cost
 */
export async function calculateBOMHpp(
  bomItems: { rawMaterialId: string; quantityNeeded: number }[]
): Promise<number> {
  if (!bomItems || bomItems.length === 0) return 0;

  const rawMaterialIds = bomItems.map((b) => b.rawMaterialId);
  const materials = await prisma.rawMaterial.findMany({
    where: { id: { in: rawMaterialIds } },
    select: { id: true, avgCostPerUnit: true },
  });

  const costMap = new Map(materials.map((m) => [m.id, m.avgCostPerUnit]));

  let totalCost = 0;
  for (const item of bomItems) {
    const unitCost = costMap.get(item.rawMaterialId) || 0;
    totalCost += Number(item.quantityNeeded) * unitCost;
  }

  // Consistent Rupiah integer rounding
  return Math.round(totalCost);
}

export async function createProduct(formData: unknown, userId?: string) {
  try {
    const validated = productSchema.parse(formData);
    const validUserId = await getCurrentUserId(userId);

    // Calculate initial HPP from BOM if present
    const calculatedHpp = await calculateBOMHpp(validated.bomItems);
    const initialCostPrice = validated.costPrice > 0 ? validated.costPrice : calculatedHpp;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Product
      const product = await tx.product.create({
        data: {
          name: validated.name.trim(),
          sku: validated.sku?.trim() || null,
          categoryId: validated.categoryId,
          productionMode: validated.productionMode,
          sellingPrice: validated.sellingPrice,
          costPrice: initialCostPrice,
          currentStock:
            validated.productionMode === ProductionMode.STOCK_BASED
              ? validated.currentStock
              : 0,
          minStockAlert: validated.minStockAlert,
          isActive: validated.isActive,
          imageUrl: validated.imageUrl?.trim() || null,
          description: validated.description?.trim() || null,
        },
      });

      // 2. Create BOM Recipe items
      if (validated.bomItems && validated.bomItems.length > 0) {
        for (const item of validated.bomItems) {
          await tx.billOfMaterial.create({
            data: {
              productId: product.id,
              rawMaterialId: item.rawMaterialId,
              quantityNeeded: item.quantityNeeded,
              notes: item.notes?.trim() || null,
            },
          });
        }
      }

      // 3. Initial stock mutation if STOCK_BASED and currentStock > 0
      if (
        validated.productionMode === ProductionMode.STOCK_BASED &&
        validated.currentStock > 0
      ) {
        await tx.stockMutation.create({
          data: {
            itemType: ItemType.FINISHED_PRODUCT,
            productId: product.id,
            mutationType: MutationType.ADJUSTMENT_IN,
            quantity: validated.currentStock,
            previousStock: 0,
            newStock: validated.currentStock,
            referenceType: "INITIAL_SETUP",
            notes: "Saldo awal stok produk jadi saat pendaftaran master",
            createdById: validUserId,
          },
        });
      }

      return product;
    });

    try {
      revalidatePath("/produk");
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: serializePrisma(result) };
  } catch (error: any) {
    console.error("Error creating product:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal menambahkan produk."),
    };
  }
}

export async function updateProduct(id: string, formData: unknown) {
  try {
    const validated = productSchema.parse(formData);

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { bomItems: true },
    });

    if (!existing) {
      return { success: false, error: "Produk tidak ditemukan." };
    }

    const calculatedHpp = await calculateBOMHpp(validated.bomItems);
    const updatedCostPrice =
      validated.costPrice > 0 ? validated.costPrice : calculatedHpp;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Product attributes
      const updated = await tx.product.update({
        where: { id },
        data: {
          name: validated.name.trim(),
          sku: validated.sku?.trim() || null,
          categoryId: validated.categoryId,
          productionMode: validated.productionMode,
          sellingPrice: validated.sellingPrice,
          costPrice: updatedCostPrice,
          minStockAlert: validated.minStockAlert,
          isActive: validated.isActive,
          imageUrl: validated.imageUrl?.trim() || null,
          description: validated.description?.trim() || null,
        },
      });

      // 2. Replace BOM items
      await tx.billOfMaterial.deleteMany({
        where: { productId: id },
      });

      if (validated.bomItems && validated.bomItems.length > 0) {
        for (const item of validated.bomItems) {
          await tx.billOfMaterial.create({
            data: {
              productId: id,
              rawMaterialId: item.rawMaterialId,
              quantityNeeded: item.quantityNeeded,
              notes: item.notes?.trim() || null,
            },
          });
        }
      }

      return updated;
    }, { maxWait: 5000, timeout: 10000 });

    try {
      revalidatePath("/produk");
      revalidatePath(`/produk/${id}`);
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: serializePrisma(result) };
  } catch (error: any) {
    console.error("Error updating product:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal memperbarui produk."),
    };
  }
}

export async function deleteProduct(id: string) {
  try {
    await requireOwnerRole();
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    try {
      revalidatePath("/produk");
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal menghapus produk."),
    };
  }
}

/**
 * Adjust finished goods stock with pessimistic row lock (FOR UPDATE) - STOCK_BASED only
 */
export async function adjustProductStock(params: {
  productId: string;
  newStock: number;
  reason: string;
  notes?: string;
  userId?: string;
}) {
  try {
    const { productId, newStock, reason, notes, userId } = params;

    if (newStock < 0) {
      return {
        success: false,
        error: "Jumlah stok produk jadi tidak boleh bernilai negatif.",
      };
    }

    const validUserId = await getCurrentUserId(userId);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Pessimistic Row Lock
      const lockedRows: any[] = await tx.$queryRaw`
        SELECT id, current_stock, production_mode, name FROM products 
        WHERE id = ${productId}::uuid AND deleted_at IS NULL 
        FOR UPDATE
      `;

      if (!lockedRows || lockedRows.length === 0) {
        throw new Error("Produk tidak ditemukan.");
      }

      const product = lockedRows[0];
      if (product.production_mode !== ProductionMode.STOCK_BASED) {
        throw new Error(
          "Hanya produk dengan mode STOCK_BASED yang mengelola stok produk jadi."
        );
      }

      const prevStock = Number(product.current_stock);
      const diff = newStock - prevStock;

      if (diff === 0) {
        return { message: "Tidak ada perubahan jumlah stok." };
      }

      const mutationType =
        diff > 0 ? MutationType.ADJUSTMENT_IN : MutationType.ADJUSTMENT_OUT;

      // 2. Update Product Stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      // 3. Record Audit Mutation
      await tx.stockMutation.create({
        data: {
          itemType: ItemType.FINISHED_PRODUCT,
          productId,
          mutationType,
          quantity: Math.abs(diff),
          previousStock: prevStock,
          newStock: newStock,
          referenceType: "MANUAL_ADJUSTMENT",
          notes: `${reason}: ${notes || "Penyesuaian stok produk jadi"}`,
          createdById: validUserId,
        },
      });

      return updatedProduct;
    }, { maxWait: 5000, timeout: 10000 });

    try {
      revalidatePath("/produk");
      revalidatePath(`/produk/${params.productId}`);
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: serializePrisma(result) };
  } catch (error: any) {
    console.error("Error adjusting product stock:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal menyesuaikan stok produk jadi."),
    };
  }
}
