"use server";

import prisma from "@/lib/prisma";
import { calculateSimilarity, parseRupiahInput, roundRupiah, formatErrorMessage } from "@/lib/utils";
import {
  ImportStatus,
  ItemType,
  MutationType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductionMode,
  SalesChannel,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { serializePrisma } from "@/lib/serialize";
import { getCurrentUserId } from "@/lib/auth";

export interface ShopeeRawRow {
  [key: string]: any;
}

export interface ShopeeParsedItem {
  orderSn: string;
  orderStatus: string;
  orderDate: string;
  productName: string;
  variation: string;
  dealPrice: number;
  quantity: number;
  totalPayment: number;
  shippingFee: number;
  buyerNote: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
}

export interface ProductMappingSuggestion {
  shopeeProductName: string;
  shopeeVariation: string;
  mappedProductId: string | null;
  mappedProductName: string | null;
  confidenceScore: number;
  isConfirmed: boolean;
  status: "MATCHED" | "SUGGESTED" | "UNMAPPED";
}

/**
 * Parse Excel or CSV buffer
 */
export async function parseShopeeBuffer(
  base64Content: string,
  fileName: string
): Promise<{ headers: string[]; rows: ShopeeRawRow[] }> {
  try {
    const buffer = Buffer.from(base64Content, "base64");
    const isCsv = fileName.toLowerCase().endsWith(".csv");

    if (isCsv) {
      const csvString = buffer.toString("utf-8");
      const parsed = Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
      });
      return {
        headers: parsed.meta.fields || [],
        rows: parsed.data as ShopeeRawRow[],
      };
    } else {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const headers = json.length > 0 ? Object.keys(json[0]) : [];
      return {
        headers,
        rows: json,
      };
    }
  } catch (error) {
    console.error("Error parsing Shopee file:", error);
    throw new Error("Gagal membaca file export Shopee. Pastikan format file .xlsx atau .csv valid.");
  }
}

/**
 * Standardize columns flexibly
 */
function findColumnValue(row: ShopeeRawRow, possibleNames: string[]): any {
  for (const name of possibleNames) {
    const key = Object.keys(row).find(
      (k) => k.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (key && row[key] !== undefined && row[key] !== null) {
      return row[key];
    }
  }
  return "";
}

/**
 * Preview and match products
 */
export async function previewShopeeData(rawRows: ShopeeRawRow[]) {
  try {
    const activeProducts = await prisma.product.findMany({
      where: { deletedAt: null, isActive: true },
      include: {
        category: true,
        bomItems: {
          include: { rawMaterial: { include: { unit: true } } },
        },
      },
    });

    const existingMappings = await prisma.shopeeProductMapping.findMany({
      include: { mappedProduct: true },
    });

    const mappingLookup = new Map<string, typeof existingMappings[0]>();
    for (const m of existingMappings) {
      const key = `${m.shopeeProductName.trim().toLowerCase()}|||${(m.shopeeVariation || "").trim().toLowerCase()}`;
      mappingLookup.set(key, m);
    }

    // Standardize rows
    const standardizedItems: ShopeeParsedItem[] = [];
    const uniqueOrderSns = new Set<string>();
    const uniqueProductCombos = new Map<string, { name: string; variation: string }>();

    for (const r of rawRows) {
      const orderSn = String(
        findColumnValue(r, ["No. Pesanan", "Order ID", "No Pesanan", "Order SN", "order_sn"])
      ).trim();

      if (!orderSn) continue;

      const orderStatus = String(
        findColumnValue(r, ["Status Pesanan", "Order Status", "Status"])
      ).trim();

      const orderDate = String(
        findColumnValue(r, ["Waktu Pesanan Dibuat", "Order Creation Date", "Waktu Dibuat", "Tanggal Pesanan"])
      ).trim();

      const productName = String(
        findColumnValue(r, ["Nama Produk", "Product Name", "Nama Barang"])
      ).trim();

      const variation = String(
        findColumnValue(r, ["Nama Variasi", "Variation Name", "Variasi", "Varian"])
      ).trim();

      const dealPrice = parseRupiahInput(
        findColumnValue(r, ["Harga Setelah Diskon", "Deal Price", "Harga Produk", "Harga"])
      );

      const quantity = Math.max(
        1,
        parseInt(
          String(findColumnValue(r, ["Jumlah", "Quantity", "Qty", "Jumlah Produk"])),
          10
        ) || 1
      );

      const totalPayment = parseRupiahInput(
        findColumnValue(r, ["Total Pembayaran", "Total Amount", "Total Pesanan", "Total"])
      );

      const shippingFee = parseRupiahInput(
        findColumnValue(r, ["Perkiraan Ongkos Kirim", "Ongkos Kirim Dibayar Pembeli", "Shipping Fee", "Ongkir"])
      );

      const buyerNote = String(
        findColumnValue(r, ["Pesan dari Pembeli", "Catatan Pembeli", "Buyer Note", "Catatan"])
      ).trim();

      const customerName = String(
        findColumnValue(r, ["Nama Penerima", "Recipient Name", "Username Pembeli", "Nama Pembeli"])
      ).trim();

      const customerPhone = String(
        findColumnValue(r, ["No. Telepon", "Nomor Telepon", "Phone Number", "No Telepon", "No. HP", "No Handphone"])
      ).trim();

      const customerAddress = String(
        findColumnValue(r, ["Alamat Pengiriman", "Delivery Address", "Alamat", "Shipping Address", "Alamat Penerima", "Kota/Kabupaten"])
      ).trim();

      uniqueOrderSns.add(orderSn);
      const comboKey = `${productName.toLowerCase()}|||${variation.toLowerCase()}`;
      if (!uniqueProductCombos.has(comboKey)) {
        uniqueProductCombos.set(comboKey, { name: productName, variation });
      }

      standardizedItems.push({
        orderSn,
        orderStatus,
        orderDate,
        productName,
        variation,
        dealPrice,
        quantity,
        totalPayment,
        shippingFee,
        buyerNote,
        customerName,
        customerPhone: customerPhone || undefined,
        customerAddress: customerAddress || undefined,
      });
    }

    // Check duplicate orders already in DB
    const orderSnArray = Array.from(uniqueOrderSns);
    const existingOrders = await prisma.order.findMany({
      where: {
        externalOrderSn: { in: orderSnArray },
        deletedAt: null,
      },
      select: { externalOrderSn: true },
    });

    const duplicateOrderSnSet = new Set(
      existingOrders.map((o) => o.externalOrderSn).filter(Boolean) as string[]
    );

    // Compute suggestions for all unique product combos
    const productSuggestions: ProductMappingSuggestion[] = [];

    for (const [comboKey, { name, variation }] of uniqueProductCombos.entries()) {
      const existing = mappingLookup.get(comboKey);

      if (existing && existing.mappedProduct) {
        productSuggestions.push({
          shopeeProductName: name,
          shopeeVariation: variation || "",
          mappedProductId: existing.mappedProductId,
          mappedProductName: existing.mappedProduct.name,
          confidenceScore: 1.0,
          isConfirmed: true,
          status: "MATCHED",
        });
        continue;
      }

      // Fuzzy match
      let bestMatch: typeof activeProducts[0] | null = null;
      let highestScore = 0;

      for (const p of activeProducts) {
        const score = calculateSimilarity(name, p.name);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = p;
        }
      }

      if (bestMatch && highestScore >= 0.85) {
        productSuggestions.push({
          shopeeProductName: name,
          shopeeVariation: variation || "",
          mappedProductId: bestMatch.id,
          mappedProductName: bestMatch.name,
          confidenceScore: highestScore,
          isConfirmed: false,
          status: "SUGGESTED",
        });
      } else {
        productSuggestions.push({
          shopeeProductName: name,
          shopeeVariation: variation || "",
          mappedProductId: bestMatch?.id || null,
          mappedProductName: bestMatch?.name || null,
          confidenceScore: highestScore,
          isConfirmed: false,
          status: "UNMAPPED",
        });
      }
    }

    return serializePrisma({
      items: standardizedItems,
      totalRows: standardizedItems.length,
      totalOrders: uniqueOrderSns.size,
      duplicateOrderCount: duplicateOrderSnSet.size,
      duplicateOrderSns: Array.from(duplicateOrderSnSet),
      productSuggestions,
      activeProducts: activeProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        sellingPrice: p.sellingPrice,
        costPrice: p.costPrice,
        productionMode: p.productionMode,
        category: p.category.name,
      })),
    });
  } catch (error) {
    console.error("Error in previewShopeeData:", error);
    throw new Error("Gagal menganalisis data Shopee.");
  }
}

/**
 * Execute Shopee Import in an atomic transaction with row locking
 */
export async function executeShopeeImport(params: {
  fileName: string;
  fileSize: number;
  items: ShopeeParsedItem[];
  confirmedMappings: {
    shopeeProductName: string;
    shopeeVariation: string;
    mappedProductId: string;
  }[];
  skipDuplicates?: boolean;
  userId?: string;
}) {
  try {
    const { fileName, fileSize, items, confirmedMappings, skipDuplicates = true, userId } = params;
    const validUserId = await getCurrentUserId(userId);

    // Build confirmed mapping lookup
    const mappingMap = new Map<string, string>();
    for (const cm of confirmedMappings) {
      const key = `${cm.shopeeProductName.trim().toLowerCase()}|||${(cm.shopeeVariation || "").trim().toLowerCase()}`;
      mappingMap.set(key, cm.mappedProductId);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert ShopeeProductMapping table for future automatic recognition
      for (const cm of confirmedMappings) {
        const cleanVariation = (cm.shopeeVariation || "").trim();
        await tx.shopeeProductMapping.upsert({
          where: {
            shopeeProductName_shopeeVariation: {
              shopeeProductName: cm.shopeeProductName.trim(),
              shopeeVariation: cleanVariation,
            },
          },
          update: {
            mappedProductId: cm.mappedProductId,
            isVerified: true,
            confidenceScore: 1.0,
          },
          create: {
            shopeeProductName: cm.shopeeProductName.trim(),
            shopeeVariation: cleanVariation,
            mappedProductId: cm.mappedProductId,
            isVerified: true,
            confidenceScore: 1.0,
          },
        });
      }

      // 2. Fetch existing duplicate orders in DB
      const orderSns = Array.from(new Set(items.map((i) => i.orderSn)));
      const existingOrders = await tx.order.findMany({
        where: { externalOrderSn: { in: orderSns }, deletedAt: null },
        select: { externalOrderSn: true },
      });

      const existingSet = new Set(
        existingOrders.map((o) => o.externalOrderSn).filter(Boolean) as string[]
      );

      // Group items by orderSn
      const orderGroups = new Map<string, ShopeeParsedItem[]>();
      for (const it of items) {
        if (!orderGroups.has(it.orderSn)) {
          orderGroups.set(it.orderSn, []);
        }
        orderGroups.get(it.orderSn)!.push(it);
      }

      let importedCount = 0;
      let skippedDuplicateCount = 0;
      let failedCount = 0;

      // 3. Create Import Log Record
      const importLog = await tx.shopeeImportLog.create({
        data: {
          fileName,
          fileSize,
          totalRows: items.length,
          status: ImportStatus.SUCCESS,
          createdById: validUserId,
        },
      });

      // 4. Process each Order Group
      for (const [orderSn, groupItems] of orderGroups.entries()) {
        if (existingSet.has(orderSn)) {
          if (skipDuplicates) {
            skippedDuplicateCount++;
            continue;
          }
        }

        const first = groupItems[0];

        // Map status
        let orderStatus: OrderStatus = OrderStatus.COMPLETED;
        const rawStatus = first.orderStatus.toLowerCase();
        if (rawStatus.includes("batal") || rawStatus.includes("cancel")) {
          orderStatus = OrderStatus.CANCELLED;
        } else if (rawStatus.includes("retur") || rawStatus.includes("kembali") || rawStatus.includes("return")) {
          orderStatus = OrderStatus.RETURNED;
        } else if (rawStatus.includes("kirim") || rawStatus.includes("perjalanan") || rawStatus.includes("shipped")) {
          orderStatus = OrderStatus.SHIPPED;
        } else if (rawStatus.includes("proses") || rawStatus.includes("sedang dibuat")) {
          orderStatus = OrderStatus.PROCESSING;
        }

        const isCancelledOrReturned =
          orderStatus === OrderStatus.CANCELLED || orderStatus === OrderStatus.RETURNED;

        // Process items
        const processedItems: {
          productId: string | null;
          productName: string;
          productSku: string | null;
          variantName: string | null;
          quantity: number;
          unitPrice: number;
          subtotal: number;
          unitHpp: number;
          customNote: string | null;
        }[] = [];

        let totalOrderHpp = 0;
        let subtotalAmount = 0;

        for (const item of groupItems) {
          const comboKey = `${item.productName.trim().toLowerCase()}|||${(item.variation || "").trim().toLowerCase()}`;
          const mappedProductId = mappingMap.get(comboKey) || null;

          const itemSubtotal = item.dealPrice * item.quantity;
          subtotalAmount += itemSubtotal;

          let unitHpp = 0;
          let productSku: string | null = null;

          if (mappedProductId) {
            // Lock product row
            const lockedProductRows: any[] = await tx.$queryRaw`
              SELECT id, name, sku, current_stock, cost_price, production_mode 
              FROM products 
              WHERE id = ${mappedProductId}::uuid AND deleted_at IS NULL 
              FOR UPDATE
            `;

            if (lockedProductRows && lockedProductRows.length > 0) {
              const product = lockedProductRows[0];
              productSku = product.sku;

              if (product.production_mode === ProductionMode.STOCK_BASED) {
                // STOCK_BASED: HPP is the snapshot of latest costPrice
                unitHpp = Number(product.cost_price);

                // Deduct stock if order is valid
                if (!isCancelledOrReturned) {
                  const prevStock = Number(product.current_stock);
                  if (prevStock < item.quantity) {
                    throw new Error(
                      `Stok produk "${product.name}" tidak mencukupi untuk pesanan Shopee ${orderSn}. Butuh ${item.quantity} pcs, tetapi stok tersedia hanya ${prevStock} pcs.`
                    );
                  }
                  const newStock = prevStock - item.quantity;

                  await tx.product.update({
                    where: { id: mappedProductId },
                    data: { currentStock: newStock },
                  });

                  await tx.stockMutation.create({
                    data: {
                      itemType: ItemType.FINISHED_PRODUCT,
                      productId: mappedProductId,
                      mutationType: MutationType.SALE_OUT,
                      quantity: item.quantity,
                      previousStock: prevStock,
                      newStock: newStock,
                      referenceType: "ORDER",
                      notes: `Penjualan Shopee pesanan ${orderSn}`,
                      createdById: validUserId,
                    },
                  });
                }
              } else {
                // MADE_TO_ORDER: Calculate snapshot HPP from BOM & deduct raw materials directly
                const bomItems = await tx.billOfMaterial.findMany({
                  where: { productId: mappedProductId },
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
                    if (!material) {
                      throw new Error(`Bahan baku ${bom.rawMaterial.name} tidak ditemukan.`);
                    }

                    const qtyNeededTotal = Number(bom.quantityNeeded) * item.quantity;
                    const availableStock = Number(material.current_stock);

                    if (availableStock < qtyNeededTotal) {
                      const shortageAmount = qtyNeededTotal - availableStock;
                      shortages.push(
                        `• ${material.name}: Butuh ${qtyNeededTotal} ${bom.rawMaterial.unit.symbol}, tersedia ${availableStock} ${bom.rawMaterial.unit.symbol} (Kurang ${shortageAmount} ${bom.rawMaterial.unit.symbol})`
                      );
                    }

                    itemBOMCost += Number(bom.quantityNeeded) * Number(material.avg_cost_per_unit);
                  }

                  if (!isCancelledOrReturned && shortages.length > 0) {
                    throw new Error(
                      `Stok bahan baku tidak mencukupi untuk pesanan Shopee ${orderSn} (${item.productName}, Qty: ${item.quantity}):\n\n` +
                        shortages.join("\n")
                    );
                  }

                  // Deduct raw materials if order is valid
                  if (!isCancelledOrReturned) {
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
                          notes: `Bahan pesanan kustom Shopee ${orderSn} (${item.productName})`,
                          createdById: validUserId,
                        },
                      });
                    }
                  }

                  unitHpp = Math.round(itemBOMCost);
                }
              }
            }
          }

          totalOrderHpp += unitHpp * item.quantity;

          processedItems.push({
            productId: mappedProductId,
            productName: item.productName,
            productSku,
            variantName: item.variation || null,
            quantity: item.quantity,
            unitPrice: item.dealPrice,
            subtotal: itemSubtotal,
            unitHpp,
            customNote: item.buyerNote || null,
          });
        }

        const totalAmount = first.totalPayment || subtotalAmount;
        const roundedTotalHpp = Math.round(totalOrderHpp);
        const netMarginAmount = isCancelledOrReturned ? 0 : totalAmount - roundedTotalHpp;

        // Parse order date
        let orderDate = new Date();
        if (first.orderDate) {
          const parsedD = new Date(first.orderDate);
          if (!isNaN(parsedD.getTime())) orderDate = parsedD;
        }

        // Create Order in DB
        await tx.order.create({
          data: {
            orderNumber: `SHP-${orderSn}`,
            channel: SalesChannel.SHOPEE,
            externalOrderSn: orderSn,
            customerName: first.customerName || "Pembeli Shopee",
            customerPhone: first.customerPhone || null,
            customerAddress: first.customerAddress || null,
            orderDate,
            status: orderStatus,
            paymentStatus: isCancelledOrReturned ? PaymentStatus.REFUNDED : PaymentStatus.PAID,
            paymentMethod: PaymentMethod.SHOPEE_PAY,
            subtotalAmount,
            discountAmount: 0,
            shippingFee: first.shippingFee || 0,
            platformFee: 0,
            totalAmount: isCancelledOrReturned ? 0 : totalAmount,
            totalHppAmount: isCancelledOrReturned ? 0 : roundedTotalHpp,
            netMarginAmount,
            notes: first.buyerNote ? `Catatan Shopee: ${first.buyerNote}` : null,
            importLogId: importLog.id,
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
        });

        importedCount++;
      }

      // Update Import Log Counts
      await tx.shopeeImportLog.update({
        where: { id: importLog.id },
        data: {
          importedCount,
          skippedDuplicateCount,
          failedCount,
        },
      });

      return {
        importLogId: importLog.id,
        importedCount,
        skippedDuplicateCount,
        failedCount,
      };
    }, { maxWait: 5000, timeout: 15000 });

    try {
      revalidatePath("/import-shopee");
      revalidatePath("/transaksi");
      revalidatePath("/produk");
      revalidatePath("/bahan-baku");
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: serializePrisma(result) };
  } catch (error: any) {
    console.error("Error executing Shopee import:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal memproses impor data Shopee."),
    };
  }
}

export async function getShopeeImportLogs() {
  try {
    const logs = await prisma.shopeeImportLog.findMany({
      include: {
        createdBy: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return serializePrisma(logs);
  } catch (error) {
    console.error("Error fetching Shopee import logs:", error);
    throw new Error("Gagal memuat riwayat impor Shopee.");
  }
}

/**
 * Rollback Shopee Import Batch
 */
export async function rollbackShopeeImport(importLogId: string, userId?: string) {
  try {
    const validUserId = await getCurrentUserId(userId);

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.shopeeImportLog.findUnique({
        where: { id: importLogId },
        include: {
          orders: {
            include: {
              orderItems: {
                include: {
                  product: {
                    include: {
                      bomItems: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!log) {
        throw new Error("Log impor tidak ditemukan.");
      }

      if (log.status === ImportStatus.ROLLED_BACK) {
        throw new Error("Impor ini sudah pernah dibatalkan sebelumnya.");
      }

      // Reverse stock mutations for each order
      for (const order of log.orders) {
        if (order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.RETURNED) {
          for (const item of order.orderItems) {
            if (item.productId && item.product) {
              if (item.product.productionMode === ProductionMode.STOCK_BASED) {
                // Restore finished goods stock
                const product = await tx.product.findUnique({
                  where: { id: item.productId },
                });
                if (product) {
                  const newStock = product.currentStock + item.quantity;
                  await tx.product.update({
                    where: { id: item.productId },
                    data: { currentStock: newStock },
                  });

                  await tx.stockMutation.create({
                    data: {
                      itemType: ItemType.FINISHED_PRODUCT,
                      productId: item.productId,
                      mutationType: MutationType.RETURN_IN,
                      quantity: item.quantity,
                      previousStock: product.currentStock,
                      newStock,
                      referenceType: "IMPORT_ROLLBACK",
                      notes: `Pengembalian stok pembatalan impor file ${log.fileName}`,
                      createdById: validUserId,
                    },
                  });
                }
              } else {
                // Restore raw material stocks from BOM
                for (const bom of item.product.bomItems) {
                  const material = await tx.rawMaterial.findUnique({
                    where: { id: bom.rawMaterialId },
                  });
                  if (material) {
                    const returnQty = Number(bom.quantityNeeded) * item.quantity;
                    const newStock = Number(material.currentStock) + returnQty;

                    await tx.rawMaterial.update({
                      where: { id: bom.rawMaterialId },
                      data: { currentStock: newStock },
                    });

                    await tx.stockMutation.create({
                      data: {
                        itemType: ItemType.RAW_MATERIAL,
                        rawMaterialId: bom.rawMaterialId,
                        mutationType: MutationType.RETURN_IN,
                        quantity: returnQty,
                        previousStock: Number(material.currentStock),
                        newStock,
                        referenceType: "IMPORT_ROLLBACK",
                        notes: `Pengembalian bahan pembatalan impor file ${log.fileName}`,
                        createdById: validUserId,
                      },
                    });
                  }
                }
              }
            }
          }
        }

        // Soft delete orders
        await tx.order.update({
          where: { id: order.id },
          data: { deletedAt: new Date() },
        });
      }

      // Update log status
      await tx.shopeeImportLog.update({
        where: { id: importLogId },
        data: {
          status: ImportStatus.ROLLED_BACK,
          rolledBackAt: new Date(),
        },
      });

      return { rolledBackOrders: log.orders.length };
    }, { maxWait: 5000, timeout: 15000 });

    try {
      revalidatePath("/import-shopee");
      revalidatePath("/transaksi");
      revalidatePath("/produk");
      revalidatePath("/bahan-baku");
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: serializePrisma(result) };
  } catch (error: any) {
    console.error("Error rolling back import:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal membatalkan riwayat impor."),
    };
  }
}
