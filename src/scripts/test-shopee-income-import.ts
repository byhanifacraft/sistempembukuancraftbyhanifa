import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import prisma from "../lib/prisma";
import {
  parseShopeeBuffer,
  previewShopeeData,
  executeShopeeImport,
} from "../actions/shopee-import.actions";
import { ProductionMode } from "@prisma/client";

async function runShopeeIncomeTest() {
  console.log("==================================================================");
  console.log("🧪 PENGUJIAN END-TO-END IMPOR LAPORAN INCOME SHOPEE REAL");
  console.log("==================================================================\n");

  const owner = await prisma.user.findUnique({ where: { email: "owner@craftbyhanifa.com" } });
  if (!owner) throw new Error("User owner tidak ditemukan.");

  // 1. Read real sample file
  const filePath = path.join(process.cwd(), "sample-data", "Income.sudah dilepas.id.20260831_20260905.xlsx");
  if (!fs.existsSync(filePath)) {
    throw new Error("File sample-data/Income.sudah dilepas... tidak ditemukan!");
  }

  const fileBuffer = fs.readFileSync(filePath);
  const base64Content = fileBuffer.toString("base64");
  const fileName = "Income.sudah dilepas.id.20260831_20260905.xlsx";

  console.log("📁 1. Membaca & Mem-parsing File Excel Shopee...");
  const parseResult = await parseShopeeBuffer(base64Content, fileName);

  console.log("  ✅ Berhasil membaca file Excel!");
  console.log("  ✅ Total Baris Produk Terstandarisasi:", parseResult.rows.length);
  console.log("  ✅ Headers Kolom Terdeteksi:", parseResult.headers.slice(0, 8).join(", "));

  if (parseResult.rows.length === 0) {
    throw new Error("Gagal mengekstrak baris dari sheet Penghasilan!");
  }

  // 2. Preview Data & Product Auto-Matching
  console.log("\n🔍 2. Menjalankan Preview & Smart Auto-Match Produk...");
  const preview = await previewShopeeData(parseResult.rows);

  console.log("  ✅ Total Item di-preview:", preview.items.length);
  console.log("  ✅ Total Pesanan Unik:", preview.totalOrders);
  const totalEst = preview.items.reduce((sum: number, it: any) => sum + (it.totalPayment || 0), 0);
  console.log("  ✅ Estimasi Omzet Bersih: Rp", totalEst.toLocaleString("id-ID"));
  console.log("  ✅ Jumlah Variasi Produk Unik Terdeteksi:", preview.productSuggestions.length);

  console.log("\n📋 Contoh 3 Saran Pencocokan Produk:");
  preview.productSuggestions.slice(0, 3).forEach((s: any, idx: number) => {
    console.log(`  [${idx + 1}] Shopee: "${s.shopeeProductName}"`);
    console.log(`      Status: ${s.status} | Skor: ${(s.confidenceScore * 100).toFixed(0)}%`);
    if (s.mappedProductName) {
      console.log(`      Dicocokkan ke Katalog: "${s.mappedProductName}"`);
    }
  });

  // 3. Uji Coba Simulasi Eksekusi 1 Pesanan Sample (Atomic Transaction)
  console.log("\n⚙️ 3. Menguji Eksekusi Impor 1 Pesanan Sampel ke Database...");

  // Pastikan produk pengujian tersedia di database
  const cat = await prisma.category.findFirst({ where: { deletedAt: null } });
  if (!cat) throw new Error("Kategori tidak ditemukan");

  const sampleProduct = await prisma.product.upsert({
    where: { sku: "TEST-POUCH-BLACU" },
    update: { currentStock: 100 },
    create: {
      name: "KANTONG SERUT BLACU / POUCH SOUVENIR BLACU",
      sku: "TEST-POUCH-BLACU",
      categoryId: cat.id,
      productionMode: ProductionMode.STOCK_BASED,
      sellingPrice: 50000,
      costPrice: 15000,
      currentStock: 100,
    },
  });

  // Ambil 1 pesanan dari preview untuk diuji
  const testSampleItem = preview.items[0];
  const testOrderSn = testSampleItem.orderSn;

  // Pastikan pesanan uji coba belum ada
  const existingOrder = await prisma.order.findUnique({
    where: { orderNumber: `SHP-${testOrderSn}` },
  });
  if (existingOrder) {
    await prisma.orderItem.deleteMany({ where: { orderId: existingOrder.id } });
    await prisma.order.delete({ where: { id: existingOrder.id } });
  }

  // Siapkan mapping untuk pesanan sampel ini
  const confirmedMappings = [
    {
      shopeeProductName: testSampleItem.productName,
      shopeeVariation: testSampleItem.variation || "",
      mappedProductId: sampleProduct.id,
    },
  ];

  // Eksekusi impor dengan pesanan sampel
  const importRes = await executeShopeeImport({
    fileName: `SIMULASI-${fileName}`,
    fileSize: fileBuffer.length,
    items: [testSampleItem],
    confirmedMappings,
    skipDuplicates: true,
  }, owner.id);

  if (!importRes.success || !importRes.data) {
    throw new Error("Gagal mengeksekusi impor: " + importRes.error);
  }

  console.log("  ✅ Berhasil mengeksekusi impor pesanan Shopee!");
  console.log("  ✅ Log Impor ID:", importRes.data.importLogId);
  console.log("  ✅ Jumlah Pesanan Diimpor:", importRes.data.importedCount);

  // Verifikasi Data Tersimpan di Database
  const savedOrder = await prisma.order.findUnique({
    where: { orderNumber: `SHP-${testOrderSn}` },
    include: { orderItems: true },
  });

  if (!savedOrder) {
    throw new Error(`Pesanan SHP-${testOrderSn} tidak ditemukan di database!`);
  }

  console.log("\n📦 4. Verifikasi Data Pesanan di Database:");
  console.log("  - No Faktur:", savedOrder.orderNumber);
  console.log("  - External Order SN:", savedOrder.externalOrderSn);
  console.log("  - Customer / Pembeli:", savedOrder.customerName);
  console.log("  - Total Pembayaran (Net Masuk Saldo): Rp", savedOrder.totalAmount.toLocaleString("id-ID"));
  console.log("  - Biaya Platform / Admin Shopee: Rp", savedOrder.platformFee.toLocaleString("id-ID"));
  console.log("  - Snapshot HPP:", savedOrder.totalHppAmount);
  console.log("  - Laba Bersih Pesanan: Rp", savedOrder.netMarginAmount.toLocaleString("id-ID"));

  // 4. Bersihkan data simulasi
  console.log("\n🧹 5. Pembersihan Data Simulasi Pengujian...");
  await prisma.orderItem.deleteMany({ where: { orderId: savedOrder.id } });
  await prisma.order.delete({ where: { id: savedOrder.id } });
  await prisma.shopeeImportLog.delete({ where: { id: importRes.data.importLogId } });
  await prisma.stockMutation.deleteMany({ where: { productId: sampleProduct.id } });
  await prisma.product.delete({ where: { id: sampleProduct.id } });
  console.log("  ✅ Pembersihan data uji selesai 100%.");

  console.log("\n==================================================================");
  console.log("🏆 SELURUH PENGUJIAN IMPOR LAPORAN INCOME SHOPEE SUKSES 100%!");
  console.log("==================================================================");
}

runShopeeIncomeTest()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
