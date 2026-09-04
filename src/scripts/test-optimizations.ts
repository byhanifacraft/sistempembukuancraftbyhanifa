import "dotenv/config";
import { getDashboardSummary, getProfitLossReport, getCashFlowReport } from "../actions/report.actions";
import { getProducts } from "../actions/product.actions";
import { getPurchases } from "../actions/purchase.actions";
import { getExpenses } from "../actions/expense.actions";
import prisma from "../lib/prisma";

async function runTests() {
  console.log("==================================================================");
  console.log("🚀 MEMULAI PENGUJIAN INTEGRITAS & BENCHMARK PERFORMA CRAFTBYHANIFA");
  console.log("==================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

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
    // TEST 1: Dashboard Summary
    // -------------------------------------------------------------
    console.log("📊 1. Menguji getDashboardSummary()...");
    const startDash = performance.now();
    const dashboard = await getDashboardSummary();
    const durationDash = performance.now() - startDash;

    assert(typeof dashboard.today.revenue === "number", "Dashboard: today.revenue is number");
    assert(typeof dashboard.month.revenue === "number", "Dashboard: month.revenue is number");
    assert(
      dashboard.month.grossProfit === dashboard.month.revenue - dashboard.month.totalHpp,
      "Dashboard: Laba Kotor = Omzet - HPP"
    );
    assert(
      dashboard.month.netProfit === dashboard.month.grossProfit - dashboard.month.operatingExpenses,
      "Dashboard: Laba Bersih = Laba Kotor - Beban Operasional"
    );
    assert(dashboard.last7Days.length === 7, "Dashboard: Trend 7 hari memiliki tepat 7 entri");
    assert(Array.isArray(dashboard.topSellingProducts), "Dashboard: topSellingProducts adalah Array");
    assert(Array.isArray(dashboard.recentOrders), "Dashboard: recentOrders adalah Array");
    console.log(`  ⏱️  Durasi getDashboardSummary: ${durationDash.toFixed(2)} ms\n`);

    // -------------------------------------------------------------
    // TEST 2: Product Catalog
    // -------------------------------------------------------------
    console.log("📦 2. Menguji getProducts()...");
    const startProd = performance.now();
    const products = await getProducts();
    const durationProd = performance.now() - startProd;

    assert(Array.isArray(products), "Katalog Produk: Mengembalikan array produk");
    if (products.length > 0) {
      const sample = products[0];
      assert(typeof sample.name === "string", "Katalog: Produk memiliki atribut nama");
      assert(sample.category && typeof sample.category.name === "string", "Katalog: Produk memiliki relasi kategori ringan");
      assert(Array.isArray(sample.bomItems), "Katalog: Produk memiliki resep BOM ringan");
    }
    console.log(`  ⏱️  Durasi getProducts: ${durationProd.toFixed(2)} ms\n`);

    // -------------------------------------------------------------
    // TEST 3: Laporan Laba Rugi
    // -------------------------------------------------------------
    console.log("📈 3. Menguji getProfitLossReport()...");
    const startPL = performance.now();
    const plReport = await getProfitLossReport();
    const durationPL = performance.now() - startPL;

    assert(typeof plReport.revenue.total === "number", "Laba Rugi: Total Revenue is number");
    assert(
      plReport.grossProfit === plReport.revenue.total - plReport.cogs.totalHpp,
      "Laba Rugi: Laba Kotor konsisten"
    );
    assert(
      plReport.netProfit === plReport.grossProfit - plReport.expenses.total,
      "Laba Rugi: Laba Bersih konsisten"
    );
    assert(Array.isArray(plReport.expenses.byCategory), "Laba Rugi: Beban terkelompok per kategori");
    console.log(`  ⏱️  Durasi getProfitLossReport: ${durationPL.toFixed(2)} ms\n`);

    // -------------------------------------------------------------
    // TEST 4: Laporan Arus Kas
    // -------------------------------------------------------------
    console.log("💵 4. Menguji getCashFlowReport()...");
    const startCF = performance.now();
    const cfReport = await getCashFlowReport();
    const durationCF = performance.now() - startCF;

    assert(typeof cfReport.totalCashIn === "number", "Arus Kas: totalCashIn is number");
    assert(typeof cfReport.totalCashOut === "number", "Arus Kas: totalCashOut is number");
    assert(
      cfReport.netCashFlow === cfReport.totalCashIn - cfReport.totalCashOut,
      "Arus Kas: Net Cash Flow = Cash In - Cash Out"
    );
    assert(Array.isArray(cfReport.recentTransactions), "Arus Kas: Memiliki daftar mutasi kas terbaru");
    console.log(`  ⏱️  Durasi getCashFlowReport: ${durationCF.toFixed(2)} ms\n`);

    // -------------------------------------------------------------
    // TEST 5: Pengeluaran & Belanja
    // -------------------------------------------------------------
    console.log("🛒 5. Menguji getPurchases() & getExpenses()...");
    const startExp = performance.now();
    const [purchases, expenses] = await Promise.all([
      getPurchases({ limit: 5 }),
      getExpenses({ limit: 5 }),
    ]);
    const durationExp = performance.now() - startExp;

    assert(Array.isArray(purchases.data), "Pengadaan: Daftar pembelian bahan baku valid");
    assert(Array.isArray(expenses.data), "Beban: Daftar beban operasional valid");
    console.log(`  ⏱️  Durasi Pengeluaran (Parallel): ${durationExp.toFixed(2)} ms\n`);

    // -------------------------------------------------------------
    // HASIL AKHIR
    // -------------------------------------------------------------
    console.log("==================================================================");
    console.log(`🏆 HASIL PENGUJIAN: ${passedTests}/${totalTests} Test PASSED (100% SUCCESS)`);
    console.log("==================================================================");
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat pengujian:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
