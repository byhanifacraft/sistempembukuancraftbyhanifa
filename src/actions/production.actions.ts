"use server";

import prisma from "@/lib/prisma";
import { productionRunSchema } from "@/lib/validations";
import { ItemType, MutationType, ProductionMode } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/serialize";
import { getCurrentUserId } from "@/lib/auth";
import { formatErrorMessage } from "@/lib/utils";

export async function getProductionRuns(params?: {
  productId?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.productId) {
      where.productId = params.productId;
    }

    const [runs, totalCount] = await Promise.all([
      prisma.productionRun.findMany({
        where,
        include: {
          product: {
            include: { category: true },
          },
          createdBy: true,
        },
        orderBy: { productionDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.productionRun.count({ where }),
    ]);

    return {
      data: serializePrisma(runs),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching production runs:", error);
    throw new Error("Gagal memuat riwayat produksi.");
  }
}

/**
 * Record a Production Run for STOCK_BASED products
 * Executed in an atomic Prisma transaction with pessimistic row locking (FOR UPDATE)
 */
export async function recordProductionRun(formData: unknown, userId?: string) {
  try {
    const validated = productionRunSchema.parse(formData);
    const { productId, quantityMade, productionDate, notes } = validated;

    const validUserId = await getCurrentUserId(userId);

    // 1. Verify product and BOM
    const product = await prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
      include: {
        bomItems: {
          include: {
            rawMaterial: {
              include: { unit: true },
            },
          },
        },
      },
    });

    if (!product) {
      return { success: false, error: "Produk tidak ditemukan." };
    }

    if (product.productionMode !== ProductionMode.STOCK_BASED) {
      return {
        success: false,
        error:
          "Fitur Produksi Batch hanya diperuntukkan bagi produk dengan mode STOCK_BASED. Produk pesanan kustom (MADE_TO_ORDER) memotong bahan baku secara otomatis saat order dicatat.",
      };
    }

    if (!product.bomItems || product.bomItems.length === 0) {
      return {
        success: false,
        error:
          "Produk belum memiliki resep (Bill of Materials). Tambahkan daftar bahan baku di pengaturan produk terlebih dahulu.",
      };
    }

    // 2. Execute within interactive transaction with Row Locking
    const result = await prisma.$transaction(async (tx) => {
      const materialIds = product.bomItems.map((b) => b.rawMaterialId);

      // Pessimistic Row Lock on all required raw materials
      const lockedMaterials: any[] = await tx.$queryRaw`
        SELECT id, name, current_stock, avg_cost_per_unit, unit_id 
        FROM raw_materials 
        WHERE id = ANY(${materialIds}::uuid[]) AND deleted_at IS NULL 
        FOR UPDATE
      `;

      const materialMap = new Map(lockedMaterials.map((m) => [m.id, m]));

      // Check stock sufficiency for each material in BOM
      const shortages: string[] = [];
      let totalBatchCost = 0;

      for (const bom of product.bomItems) {
        const material = materialMap.get(bom.rawMaterialId);
        if (!material) {
          throw new Error(`Bahan baku ${bom.rawMaterial.name} tidak ditemukan.`);
        }

        const qtyNeededPerUnit = Number(bom.quantityNeeded);
        const totalNeeded = qtyNeededPerUnit * quantityMade;
        const availableStock = Number(material.current_stock);

        if (availableStock < totalNeeded) {
          const shortageAmount = totalNeeded - availableStock;
          shortages.push(
            `• ${material.name}: Butuh ${totalNeeded} ${bom.rawMaterial.unit.symbol}, tersedia ${availableStock} ${bom.rawMaterial.unit.symbol} (Kurang ${shortageAmount} ${bom.rawMaterial.unit.symbol})`
          );
        }

        const unitCost = Number(material.avg_cost_per_unit);
        totalBatchCost += totalNeeded * unitCost;
      }

      if (shortages.length > 0) {
        throw new Error(
          `Stok bahan baku tidak mencukupi untuk memproduksi ${quantityMade} unit "${product.name}":\n\n` +
            shortages.join("\n")
        );
      }

      // Consistent Rupiah integer rounding
      const roundedTotalCost = Math.round(totalBatchCost);
      const roundedUnitCost = Math.round(roundedTotalCost / quantityMade);

      // Deduct raw materials and record mutations
      for (const bom of product.bomItems) {
        const material = materialMap.get(bom.rawMaterialId)!;
        const qtyNeededPerUnit = Number(bom.quantityNeeded);
        const totalNeeded = qtyNeededPerUnit * quantityMade;
        const prevStock = Number(material.current_stock);
        const newStock = prevStock - totalNeeded;

        await tx.rawMaterial.update({
          where: { id: bom.rawMaterialId },
          data: { currentStock: newStock },
        });

        await tx.stockMutation.create({
          data: {
            itemType: ItemType.RAW_MATERIAL,
            rawMaterialId: bom.rawMaterialId,
            mutationType: MutationType.PRODUCTION_OUT,
            quantity: totalNeeded,
            previousStock: prevStock,
            newStock: newStock,
            referenceType: "PRODUCTION",
            notes: `Pemakaian bahan untuk produksi batch ${quantityMade} pcs "${product.name}"`,
            createdById: validUserId,
          },
        });
      }

      // Pessimistic Row Lock on Product
      const lockedProductRows: any[] = await tx.$queryRaw`
        SELECT id, current_stock FROM products 
        WHERE id = ${productId}::uuid AND deleted_at IS NULL 
        FOR UPDATE
      `;

      const prevProductStock = Number(lockedProductRows[0].current_stock);
      const newProductStock = prevProductStock + quantityMade;

      // Update Product finished goods stock and update costPrice with newest unitCost
      await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: newProductStock,
          costPrice: roundedUnitCost,
        },
      });

      // Record Product Mutation
      await tx.stockMutation.create({
        data: {
          itemType: ItemType.FINISHED_PRODUCT,
          productId: productId,
          mutationType: MutationType.PRODUCTION_IN,
          quantity: quantityMade,
          previousStock: prevProductStock,
          newStock: newProductStock,
          referenceType: "PRODUCTION",
          notes: `Hasil produksi batch selesai (${quantityMade} unit @ Rp ${roundedUnitCost.toLocaleString("id-ID")})`,
          createdById: validUserId,
        },
      });

      // Create ProductionRun audit record
      const productionRun = await tx.productionRun.create({
        data: {
          productId,
          quantityMade,
          totalCost: roundedTotalCost,
          unitCost: roundedUnitCost,
          productionDate: productionDate || new Date(),
          notes: notes?.trim() || null,
          createdById: validUserId,
        },
      });

      return {
        productionRun,
        productName: product.name,
        quantityMade,
        unitCost: roundedUnitCost,
        totalCost: roundedTotalCost,
      };
    }, { maxWait: 5000, timeout: 10000 });

    try {
      revalidatePath("/produksi");
      revalidatePath("/produk");
      revalidatePath("/bahan-baku");
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: serializePrisma(result) };
  } catch (error: any) {
    console.error("Error recording production run:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal mencatat aktivitas produksi."),
    };
  }
}
