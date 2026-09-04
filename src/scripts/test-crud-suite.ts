import "dotenv/config";
import prisma from "../lib/prisma";
import {
  createRawMaterial,
  getRawMaterials,
  getRawMaterialById,
  updateRawMaterial,
  adjustRawMaterialStock,
  deleteRawMaterial,
} from "../actions/raw-material.actions";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  adjustProductStock,
  deleteProduct,
} from "../actions/product.actions";
import {
  recordProductionRun,
  getProductionRuns,
} from "../actions/production.actions";
import {
  createPurchase,
  getPurchases,
  deletePurchase,
} from "../actions/purchase.actions";
import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  createExpenseCategory,
  deleteExpenseCategory,
} from "../actions/expense.actions";
import {
  createOfflineOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} from "../actions/order.actions";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createUnit,
  updateUnit,
  deleteUnit,
} from "../actions/master.actions";
import { ProductionMode, OrderStatus } from "@prisma/client";

async function runCrudTestSuite() {
  console.log("==================================================================");
  console.log("🚀 MEMULAI PENGUJIAN END-TO-END CRUD LENGKAP CRAFTBYHANIFA");
  console.log("==================================================================\n");

  const uid = Math.random().toString(36).substring(2, 7).toUpperCase();
  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${testName}`);
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // MODUL 1: MASTER DATA (KATEGORI & SATUAN)
    // -------------------------------------------------------------
    console.log("📁 MODUL 1: Pengujian CRUD Master Data (Category & Unit)...");

    // 1.1 Category Create
    const catRes = await createCategory({
      name: `Kategori Test ${uid}`,
      description: "Deskripsi kategori test",
    });
    assert(catRes.success === true, "Master Data: Berhasil membuat Category baru", catRes.error);
    const testCatId = catRes.data?.id;

    // 1.2 Category Update
    const catUpdateRes = await updateCategory(testCatId, {
      name: `Kategori Test Updated ${uid}`,
      description: "Deskripsi kategori terupdate",
    });
    assert(catUpdateRes.success === true, "Master Data: Berhasil memperbarui Category", catUpdateRes.error);

    // 1.3 Unit Create
    const unitRes = await createUnit({
      name: `Unit ${uid}`,
      symbol: `u${uid.toLowerCase()}`,
    });
    assert(unitRes.success === true, "Master Data: Berhasil membuat Unit baru", unitRes.error);
    const testUnitId = unitRes.data?.id;

    // 1.4 Unit Update
    const unitUpdateRes = await updateUnit(testUnitId, {
      name: `Unit Upd ${uid}`,
      symbol: `x${uid.toLowerCase()}`,
    });
    assert(unitUpdateRes.success === true, "Master Data: Berhasil memperbarui Unit", unitUpdateRes.error);

    // -------------------------------------------------------------
    // MODUL 2: BAHAN BAKU (RAW MATERIAL)
    // -------------------------------------------------------------
    console.log("\n🧪 MODUL 2: Pengujian CRUD Bahan Baku...");

    // 2.1 Create Raw Material (with initial stock > 0, verifying mutation creation without dummy-user error)
    const rmRes = await createRawMaterial({
      name: `Bahan Baku Resin ${uid}`,
      sku: `RM-${uid}-01`,
      unitId: testUnitId,
      currentStock: 100,
      minimumStock: 20,
      avgCostPerUnit: 1500,
      lastCostPerUnit: 1500,
      description: "Bahan uji coba sistem",
    });
    assert(rmRes.success === true, "Bahan Baku: Berhasil create dengan saldo awal & mutasi otomatis", rmRes.error);
    const testRmId = rmRes.data?.id;

    // 2.2 Read Raw Material
    const rmDetail = await getRawMaterialById(testRmId);
    assert(Boolean(rmDetail && rmDetail.name.includes(uid)), "Bahan Baku: Berhasil getById");

    // 2.3 Update Raw Material
    const rmUpdateRes = await updateRawMaterial(testRmId, {
      name: `Bahan Baku Resin (Grade A) ${uid}`,
      sku: `RM-${uid}-01`,
      unitId: testUnitId,
      minimumStock: 25,
      avgCostPerUnit: 1600,
      lastCostPerUnit: 1600,
      description: "Deskripsi bahan diperbarui",
    });
    assert(rmUpdateRes.success === true, "Bahan Baku: Berhasil update data master", rmUpdateRes.error);

    // 2.4 Adjust Stock (Opname with FOR UPDATE lock)
    const rmAdjustRes = await adjustRawMaterialStock({
      rawMaterialId: testRmId,
      newStock: 120,
      reason: "Koreksi Opname Fisik",
      notes: "Audit penyesuaian uji coba",
    });
    assert(rmAdjustRes.success === true, "Bahan Baku: Berhasil opname penyesuaian stok terkunci", rmAdjustRes.error);

    // -------------------------------------------------------------
    // MODUL 3: PRODUK & RESEP BOM
    // -------------------------------------------------------------
    console.log("\n📦 MODUL 3: Pengujian CRUD Produk & Resep BOM...");

    // 3.1 Create Product (STOCK_BASED with initial stock & BOM)
    const prodRes = await createProduct({
      name: `Produk Gantungan Kunci ${uid}`,
      sku: `PROD-${uid}-01`,
      categoryId: testCatId,
      productionMode: ProductionMode.STOCK_BASED,
      sellingPrice: 25000,
      costPrice: 5000,
      currentStock: 15,
      minStockAlert: 5,
      isActive: true,
      bomItems: [{ rawMaterialId: testRmId, quantityNeeded: 2 }],
    });
    assert(prodRes.success === true, "Produk: Berhasil create produk STOCK_BASED beserta resep BOM", prodRes.error);
    const testProdId = prodRes.data?.id;

    // 3.2 Read Product
    const prodDetail = await getProductById(testProdId);
    assert(Boolean(prodDetail && prodDetail.bomItems.length === 1), "Produk: Berhasil getById dengan relasi BOM");

    // 3.3 Update Product
    const prodUpdateRes = await updateProduct(testProdId, {
      name: `Produk Gantungan Kunci (Premium) ${uid}`,
      sku: `PROD-${uid}-01`,
      categoryId: testCatId,
      productionMode: ProductionMode.STOCK_BASED,
      sellingPrice: 30000,
      costPrice: 6000,
      minStockAlert: 5,
      isActive: true,
      bomItems: [{ rawMaterialId: testRmId, quantityNeeded: 3 }],
    });
    assert(prodUpdateRes.success === true, "Produk: Berhasil update data dan resep BOM", prodUpdateRes.error);

    // 3.4 Adjust Product Stock
    const prodAdjustRes = await adjustProductStock({
      productId: testProdId,
      newStock: 25,
      reason: "Penyesuaian Fisik",
    });
    assert(prodAdjustRes.success === true, "Produk: Berhasil opname stok produk jadi", prodAdjustRes.error);

    // -------------------------------------------------------------
    // MODUL 4: PRODUKSI BATCH
    // -------------------------------------------------------------
    console.log("\n🔨 MODUL 4: Pengujian Aktivitas Produksi Batch...");

    // 4.1 Record Production Run (produces 5 units, consumes 5 * 3 = 15 raw materials)
    const runRes = await recordProductionRun({
      productId: testProdId,
      quantityMade: 5,
      notes: "Produksi batch tes otomatis",
    });
    assert(runRes.success === true, "Produksi: Berhasil eksekusi batch, potong bahan & tambah stok jadi", runRes.error);

    const runsList = await getProductionRuns({ productId: testProdId, limit: 1 });
    assert(runsList.data.length > 0, "Produksi: Riwayat batch tersimpan rapi");

    // -------------------------------------------------------------
    // MODUL 5: PENGADAAN (PURCHASE)
    // -------------------------------------------------------------
    console.log("\n🛒 MODUL 5: Pengujian CRUD Pembelian Bahan Baku...");

    // 5.1 Create Purchase (Moving Weighted Average)
    const purchaseRes = await createPurchase({
      supplierName: `Supplier Kimia ${uid}`,
      paymentMethod: "BANK_TRANSFER",
      paymentStatus: "PAID",
      items: [{ rawMaterialId: testRmId, quantity: 50, unitCost: 2000 }],
    });
    assert(purchaseRes.success === true, "Pembelian: Berhasil catat belanja bahan & hitung Moving Average", purchaseRes.error);
    const testPurchaseId = purchaseRes.data?.id;

    // 5.2 Delete Purchase
    if (testPurchaseId) {
      const delPurchRes = await deletePurchase(testPurchaseId);
      assert(delPurchRes.success === true, "Pembelian: Berhasil soft delete riwayat belanja", delPurchRes.error);
    }

    // -------------------------------------------------------------
    // MODUL 6: BEBAN OPERASIONAL (EXPENSE)
    // -------------------------------------------------------------
    console.log("\n💵 MODUL 6: Pengujian CRUD Beban Operasional...");

    // 6.1 Create Expense Category
    const expCatRes = await createExpenseCategory({ name: `Biaya Packing ${uid}` });
    assert(expCatRes.success === true, "Beban: Berhasil membuat kategori beban operasional", expCatRes.error);
    const testExpCatId = expCatRes.data?.id;

    // 6.2 Create Expense
    const expRes = await createExpense({
      categoryId: testExpCatId,
      title: `Beli Lakban & Kardus ${uid}`,
      amount: 45000,
      paymentMethod: "CASH",
      notes: "Struk terlampir",
    });
    assert(expRes.success === true, "Beban: Berhasil catat pengeluaran operasional", expRes.error);
    const testExpId = expRes.data?.id;

    // 6.3 Update Expense
    const expUpdateRes = await updateExpense(testExpId, {
      categoryId: testExpCatId,
      title: `Beli Lakban & Kardus (Revisi) ${uid}`,
      amount: 50000,
      paymentMethod: "CASH",
    });
    assert(expUpdateRes.success === true, "Beban: Berhasil update/edit pengeluaran operasional", expUpdateRes.error);

    // 6.4 Delete Expense
    const expDelRes = await deleteExpense(testExpId);
    assert(expDelRes.success === true, "Beban: Berhasil soft delete pengeluaran", expDelRes.error);

    // 6.5 Verify protection: Cannot delete expense category while referenced by existing expense record
    const blockedExpCatDel = await deleteExpenseCategory(testExpCatId);
    assert(
      blockedExpCatDel.success === false && blockedExpCatDel.error?.includes("masih terhubung"),
      "Beban: Terproteksi tidak bisa hapus kategori yang masih memiliki riwayat beban"
    );

    // 6.6 Delete standalone Expense Category
    const standaloneExpCat = await createExpenseCategory({ name: `Kategori Beban Standalone ${uid}` });
    const delStandaloneExpCat = await deleteExpenseCategory(standaloneExpCat.data?.id);
    assert(delStandaloneExpCat.success === true, "Beban: Berhasil hapus kategori pengeluaran tanpa dependensi", delStandaloneExpCat.error);

    // -------------------------------------------------------------
    // MODUL 7: TRANSAKSI PENJUALAN (ORDER)
    // -------------------------------------------------------------
    console.log("\n🧾 MODUL 7: Pengujian CRUD Transaksi Penjualan...");

    // 7.1 Create Offline Order (STOCK_BASED product)
    const orderRes = await createOfflineOrder({
      customerName: `Pelanggan Test ${uid}`,
      paymentMethod: "CASH",
      items: [
        {
          productId: testProdId,
          productName: `Produk Gantungan Kunci (Premium) ${uid}`,
          quantity: 2,
          unitPrice: 30000,
          customNote: "Huruf H, Warna Lilac",
        },
      ],
    });
    assert(orderRes.success === true, "Penjualan: Berhasil catat pesanan & potong stok produk", orderRes.error);
    const testOrderId = orderRes.data?.id;

    // 7.2 Read Order Detail
    const orderDetail = await getOrderById(testOrderId);
    assert(Boolean(orderDetail && orderDetail.orderItems.length === 1), "Penjualan: Berhasil getById dengan rincian item");

    // 7.3 Update Order Status
    const statusRes = await updateOrderStatus(testOrderId, OrderStatus.PROCESSING);
    assert(statusRes.success === true, "Penjualan: Berhasil update status pesanan", statusRes.error);

    // 7.4 Delete Order
    const orderDelRes = await deleteOrder(testOrderId);
    assert(orderDelRes.success === true, "Penjualan: Berhasil soft delete pesanan", orderDelRes.error);

    // -------------------------------------------------------------
    // MODUL 8: INTEGRITAS CONSTRAINT & CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 MODUL 8: Pengujian Integritas Relasi & Cleanup...");

    // 8.1 Try to delete raw material while linked to ACTIVE product (MUST BE REJECTED)
    const blockedDelete = await deleteRawMaterial(testRmId);
    assert(
      blockedDelete.success === false && blockedDelete.error?.includes("masih digunakan"),
      "Integritas: Terproteksi tidak bisa hapus bahan baku saat masih dipakai produk aktif"
    );

    // 8.2 Delete Product (Soft delete)
    const prodDelRes = await deleteProduct(testProdId);
    assert(prodDelRes.success === true, "Integritas: Berhasil soft delete produk", prodDelRes.error);

    // 8.3 Delete Raw Material after Product is soft deleted (MUST SUCCEED)
    const allowedDelete = await deleteRawMaterial(testRmId);
    assert(allowedDelete.success === true, "Integritas: Berhasil hapus bahan baku setelah produk dinonaktifkan", allowedDelete.error);

    // 8.4 Verify Unit protection: Cannot delete unit while referenced by raw material
    const blockedUnitDel = await deleteUnit(testUnitId);
    assert(
      blockedUnitDel.success === false && blockedUnitDel.error?.includes("masih digunakan"),
      "Integritas: Terproteksi tidak bisa hapus satuan yang masih terhubung dengan data bahan"
    );

    // 8.5 Delete standalone Unit
    const standaloneUnit = await createUnit({ name: `Satuan Standalone ${uid}`, symbol: `s${uid.toLowerCase()}` });
    const delStandaloneUnit = await deleteUnit(standaloneUnit.data?.id);
    assert(delStandaloneUnit.success === true, "Cleanup: Berhasil delete Unit tanpa dependensi", delStandaloneUnit.error);

    // 8.6 Clean Category
    const delCatRes = await deleteCategory(testCatId);
    assert(delCatRes.success === true, "Cleanup: Berhasil soft delete Category", delCatRes.error);

    // -------------------------------------------------------------
    // HASIL AKHIR
    // -------------------------------------------------------------
    console.log("\n==================================================================");
    console.log(`🏆 HASIL AKHIR: ${passedTests}/${totalTests} Test PASSED (${((passedTests / totalTests) * 100).toFixed(0)}% SUCCESS)`);
    console.log("==================================================================");
  } catch (error) {
    console.error("❌ Terjadi error kritis:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCrudTestSuite();
