import "dotenv/config";
import prisma from "../lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { UserRole, ProductionMode, OrderStatus, PaymentMethod } from "@prisma/client";
import { setMockUserForTesting } from "../lib/auth";
import { getFilteredNavSections } from "../components/layout/sidebar";
import { createRawMaterial, getRawMaterials, deleteRawMaterial } from "../actions/raw-material.actions";
import { createProduct, getProductById, deleteProduct } from "../actions/product.actions";
import { createOfflineOrder, deleteOrder } from "../actions/order.actions";
import { createExpense, deleteExpense, createExpenseCategory, deleteExpenseCategory } from "../actions/expense.actions";
import { createCategory, deleteCategory } from "../actions/master.actions";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

async function runAuthAndRbacTestSuite() {
  console.log("==================================================================");
  console.log("🚀 MEMULAI SUITE PENGUJIAN LENGKAP: AUTHENTICATION & RBAC");
  console.log("==================================================================\n");

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
    // BAGIAN 1: PENGUJIAN AUTENTIKASI SUPABASE AUTH (LOGIN)
    // -------------------------------------------------------------
    console.log("🔐 BAGIAN 1: Pengujian Otentikasi Supabase Auth...");

    // 1.1 Login Akun Owner
    const ownerLogin = await supabase.auth.signInWithPassword({
      email: "owner@craftbyhanifa.com",
      password: "OwnerHanifa2026!",
    });
    assert(
      !ownerLogin.error && !!ownerLogin.data.session,
      "Auth: Login sebagai Owner berhasil dengan token session aktif",
      ownerLogin.error?.message
    );
    assert(
      ownerLogin.data.user?.user_metadata?.role === UserRole.OWNER,
      "Auth: Metadata role Owner terverifikasi sebagai 'OWNER'"
    );

    // 1.2 Login Akun Karyawan
    const karyawanLogin = await supabase.auth.signInWithPassword({
      email: "karyawan@craftbyhanifa.com",
      password: "KaryawanHanifa2026!",
    });
    assert(
      !karyawanLogin.error && !!karyawanLogin.data.session,
      "Auth: Login sebagai Karyawan berhasil dengan token session aktif",
      karyawanLogin.error?.message
    );
    assert(
      karyawanLogin.data.user?.user_metadata?.role === UserRole.STAFF,
      "Auth: Metadata role Karyawan terverifikasi sebagai 'STAFF'"
    );

    // 1.3 Login dengan Password Salah (Harus Ditolak)
    const invalidLogin = await supabase.auth.signInWithPassword({
      email: "owner@craftbyhanifa.com",
      password: "SalahPassword123!",
    });
    assert(
      !!invalidLogin.error && !invalidLogin.data.session,
      "Auth: Login kredensial salah berhasil ditolak oleh sistem keamanan",
      invalidLogin.error?.message
    );

    // -------------------------------------------------------------
    // BAGIAN 2: PENGUJIAN FILTER NAVIGASI SIDEBAR (UI RBAC)
    // -------------------------------------------------------------
    console.log("\n🧭 BAGIAN 2: Pengujian Filter Navigasi UI Berdasarkan Role...");

    const ownerNav = getFilteredNavSections(true);
    const karyawanNav = getFilteredNavSections(false);

    const ownerHasLaporan = ownerNav.some((s) => s.title === "Laporan & Analisis");
    const ownerHasPengeluaran = ownerNav.some((s) =>
      s.items.some((i) => i.href === "/pengeluaran")
    );
    const ownerHasPengaturan = ownerNav.some((s) =>
      s.items.some((i) => i.href === "/pengaturan")
    );
    assert(
      ownerHasLaporan && ownerHasPengeluaran && ownerHasPengaturan,
      "UI RBAC: Owner memiliki akses lengkap ke Laporan, Pengeluaran, dan Pengaturan"
    );

    const karyawanHasLaporan = karyawanNav.some((s) => s.title === "Laporan & Analisis");
    const karyawanHasPengeluaran = karyawanNav.some((s) =>
      s.items.some((i) => i.href === "/pengeluaran")
    );
    const karyawanHasPengaturan = karyawanNav.some((s) =>
      s.items.some((i) => i.href === "/pengaturan")
    );
    assert(
      !karyawanHasLaporan && !karyawanHasPengeluaran && !karyawanHasPengaturan,
      "UI RBAC: Menu Laporan, Pengeluaran, dan Pengaturan tersembunyi secara ketat untuk Karyawan"
    );

    // Ambil data user dari database untuk context testing
    const ownerDbUser = await prisma.user.findUnique({ where: { email: "owner@craftbyhanifa.com" } });
    const karyawanDbUser = await prisma.user.findUnique({ where: { email: "karyawan@craftbyhanifa.com" } });

    // -------------------------------------------------------------
    // BAGIAN 3: PENGUJIAN CRUD OPERASIONAL OLEH KARYAWAN
    // -------------------------------------------------------------
    console.log("\n🛒 BAGIAN 3: Pengujian CRUD Operasional oleh Karyawan...");

    // Set sesi aktif sebagai KARYAWAN
    setMockUserForTesting(karyawanDbUser);

    // Cari satuan baku
    const defaultUnit = await prisma.unit.findFirst();
    const defaultCategory = await prisma.category.findFirst();

    // 3.1 Karyawan membuat Bahan Baku
    const testRmRes = await createRawMaterial({
      name: "Bahan Baku Resin Uji Coba Karyawan",
      sku: "RM-TEST-KARYAWAN",
      unitId: defaultUnit!.id,
      currentStock: 100,
      minimumStock: 10,
      avgCostPerUnit: 50,
      lastCostPerUnit: 50,
    });
    assert(testRmRes.success === true, "Operasional Karyawan: Berhasil input Bahan Baku baru", testRmRes.error);
    const testRmId = testRmRes.data?.id;

    // 3.2 Karyawan membuat Produk dengan Resep BOM
    const testProdRes = await createProduct({
      name: "Gantungan Kunci Kustom Uji Coba",
      sku: "PROD-TEST-KARYAWAN",
      categoryId: defaultCategory!.id,
      productionMode: ProductionMode.STOCK_BASED,
      sellingPrice: 15000,
      costPrice: 5000,
      currentStock: 20,
      minStockAlert: 5,
      isActive: true,
      bomItems: [
        {
          rawMaterialId: testRmId!,
          quantityNeeded: 2,
          notes: "Resin takaran 2 unit",
        },
      ],
    });
    assert(testProdRes.success === true, "Operasional Karyawan: Berhasil input Produk & Resep BOM", testProdRes.error);
    const testProdId = testProdRes.data?.id;

    // 3.3 Karyawan memproses Transaksi Kasir (Offline Order)
    const testOrderRes = await createOfflineOrder({
      channel: "OFFLINE",
      customerName: "Pelanggan Uji Coba",
      customerPhone: "08123456789",
      orderDate: new Date(),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.CASH,
      items: [
        {
          productId: testProdId!,
          productName: "Gantungan Kunci Kustom Uji Coba",
          quantity: 2,
          unitPrice: 15000,
          customNote: "Huruf S - Pink",
        },
      ],
    });
    assert(testOrderRes.success === true, "Operasional Karyawan: Berhasil catat transaksi kasir & potong stok", testOrderRes.error);
    const testOrderId = testOrderRes.data?.id;

    // -------------------------------------------------------------
    // BAGIAN 4: PENGUJIAN PEMBLOKIRAN AKSES KARYAWAN (BLOCKED ACTIONS)
    // -------------------------------------------------------------
    console.log("\n🛡️ BAGIAN 4: Pengujian Pemblokiran Aksi Administratif untuk Karyawan...");

    // 4.1 Karyawan mencoba Hapus Transaksi Penjualan (HARUS DITOLAK)
    const karyawanDelOrder = await deleteOrder(testOrderId!);
    assert(
      karyawanDelOrder.success === false && karyawanDelOrder.error?.includes("Akses ditolak"),
      "Keamanan RBAC: Karyawan dilarang menghapus transaksi penjualan",
      karyawanDelOrder.error
    );

    // 4.2 Karyawan mencoba Hapus Produk (HARUS DITOLAK)
    const karyawanDelProd = await deleteProduct(testProdId!);
    assert(
      karyawanDelProd.success === false && karyawanDelProd.error?.includes("Akses ditolak"),
      "Keamanan RBAC: Karyawan dilarang menghapus produk",
      karyawanDelProd.error
    );

    // 4.3 Karyawan mencoba Hapus Bahan Baku (HARUS DITOLAK)
    const karyawanDelRm = await deleteRawMaterial(testRmId!);
    assert(
      karyawanDelRm.success === false && karyawanDelRm.error?.includes("Akses ditolak"),
      "Keamanan RBAC: Karyawan dilarang menghapus bahan baku",
      karyawanDelRm.error
    );

    // 4.4 Karyawan mencoba Mencatat Pengeluaran Operasional (HARUS DITOLAK)
    const testExpCat = await prisma.expenseCategory.findFirst();
    const karyawanExpRes = await createExpense({
      categoryId: testExpCat!.id,
      title: "Beli Alat Studio Ilegal",
      amount: 50000,
      paymentMethod: PaymentMethod.CASH,
    });
    assert(
      karyawanExpRes.success === false && karyawanExpRes.error?.includes("Akses ditolak"),
      "Keamanan RBAC: Karyawan dilarang mencatat pengeluaran finansial usaha",
      karyawanExpRes.error
    );

    // 4.5 Karyawan mencoba Menambah Kategori Master (HARUS DITOLAK)
    const karyawanCatRes = await createCategory({
      name: "Kategori Ilegal Karyawan",
    });
    assert(
      karyawanCatRes.success === false && karyawanCatRes.error?.includes("Akses ditolak"),
      "Keamanan RBAC: Karyawan dilarang menambah/mengubah master data kategori",
      karyawanCatRes.error
    );

    // -------------------------------------------------------------
    // BAGIAN 5: PENGUJIAN HAK AKSES OWNER (SUPERUSER PERMISSIONS)
    // -------------------------------------------------------------
    console.log("\n👑 BAGIAN 5: Pengujian Hak Penuh Owner (Superuser)...");

    // Ganti sesi aktif sebagai OWNER
    setMockUserForTesting(ownerDbUser);

    // 5.1 Owner mencatat Pengeluaran Operasional
    const ownerExpRes = await createExpense({
      categoryId: testExpCat!.id,
      title: "Beli Bubble Wrap Uji Coba Owner",
      amount: 45000,
      paymentMethod: PaymentMethod.CASH,
    });
    assert(ownerExpRes.success === true, "Akses Owner: Berhasil mencatat beban operasional", ownerExpRes.error);
    const testExpId = ownerExpRes.data?.id;

    // 5.2 Owner menghapus Pengeluaran
    const ownerDelExp = await deleteExpense(testExpId!);
    assert(ownerDelExp.success === true, "Akses Owner: Berhasil menghapus pengeluaran", ownerDelExp.error);

    // 5.3 Owner menghapus Transaksi Penjualan
    const ownerDelOrder = await deleteOrder(testOrderId!);
    assert(ownerDelOrder.success === true, "Akses Owner: Berhasil menghapus transaksi penjualan", ownerDelOrder.error);

    // 5.4 Owner menghapus Produk
    const ownerDelProd = await deleteProduct(testProdId!);
    assert(ownerDelProd.success === true, "Akses Owner: Berhasil menghapus produk", ownerDelProd.error);

    // 5.5 Owner menghapus Bahan Baku
    const ownerDelRm = await deleteRawMaterial(testRmId!);
    assert(ownerDelRm.success === true, "Akses Owner: Berhasil menghapus bahan baku", ownerDelRm.error);

    // -------------------------------------------------------------
    // BAGIAN 6: PEMBERSIHAN DATA PENGUJIAN TOTAL (POST-TEST CLEANUP)
    // -------------------------------------------------------------
    console.log("\n🧹 BAGIAN 6: Pembersihan Data Pasca-Test (Post-Test Cleanup)...");

    // Hapus seluruh entitas uji coba agar database benar-benar bersih
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.stockMutation.deleteMany();
    await prisma.billOfMaterial.deleteMany();
    await prisma.product.deleteMany();
    await prisma.rawMaterial.deleteMany();
    await prisma.expense.deleteMany();

    const finalCounts = {
      users: await prisma.user.count(),
      orders: await prisma.order.count(),
      products: await prisma.product.count(),
      rawMaterials: await prisma.rawMaterial.count(),
      expenses: await prisma.expense.count(),
      stockMutations: await prisma.stockMutation.count(),
      units: await prisma.unit.count(),
      categories: await prisma.category.count(),
      expenseCategories: await prisma.expenseCategory.count(),
    };

    assert(
      finalCounts.orders === 0 &&
      finalCounts.products === 0 &&
      finalCounts.rawMaterials === 0 &&
      finalCounts.expenses === 0 &&
      finalCounts.stockMutations === 0,
      "Post-Test Cleanup: Seluruh data uji coba berhasil dibersihkan total (0 data tersisa)"
    );

    // Reset mock
    setMockUserForTesting(null);

    // -------------------------------------------------------------
    // RINGKASAN AKHIR
    // -------------------------------------------------------------
    console.log("\n==================================================================");
    console.log(`🏆 HASIL AKHIR: ${passedTests}/${totalTests} Test PASSED (${((passedTests / totalTests) * 100).toFixed(0)}% SUCCESS)`);
    console.log("==================================================================");
    console.log("Status Database Saat Ini:");
    console.log(JSON.stringify(finalCounts, null, 2));
    console.log("==================================================================\n");

  } catch (error) {
    console.error("❌ Terjadi error kritis:", error);
    process.exit(1);
  } finally {
    setMockUserForTesting(null);
    await prisma.$disconnect();
  }
}

runAuthAndRbacTestSuite();
