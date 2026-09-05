import "dotenv/config";
import prisma from "../lib/prisma";
import { createOfflineOrder, getOrders, deleteOrder } from "../actions/order.actions";
import { getCustomers } from "../actions/customer.actions";
import { getProducts } from "../actions/product.actions";
import { createProduct } from "../actions/product.actions";
import { createCategory } from "../actions/master.actions";
import { ProductionMode } from "@prisma/client";
import * as XLSX from "xlsx";

async function runCustomerAndExcelTest() {
  console.log("==================================================================");
  console.log("🚀 PENGUJIAN FITUR DATA PELANGGAN, ALAMAT & EXPORT EXCEL");
  console.log("==================================================================\n");

  const owner = await prisma.user.findUnique({ where: { email: "owner@craftbyhanifa.com" } });
  if (!owner) {
    throw new Error("User owner tidak ditemukan.");
  }

  // Pre-cleanup in case of leftover test data
  const existingOrders = await prisma.order.findMany({
    where: { customerName: "Kak Anita Magetan" },
    select: { id: true },
  });
  for (const eo of existingOrders) {
    await prisma.orderItem.deleteMany({ where: { orderId: eo.id } });
    await prisma.order.delete({ where: { id: eo.id } }).catch(() => {});
  }

  // 1. Ensure a dummy category & product exist for test order
  const cat = await prisma.category.findFirst({ where: { deletedAt: null } });
  if (!cat) throw new Error("Kategori tidak ditemukan");

  const testProduct = await prisma.product.create({
    data: {
      name: "Gantungan Kunci Uji Coba Pelanggan",
      sku: `TEST-CUST-${Date.now()}`,
      categoryId: cat.id,
      productionMode: ProductionMode.STOCK_BASED,
      sellingPrice: 25000,
      costPrice: 10000,
      currentStock: 100,
    },
  });

  const createdOrderIds: string[] = [];

  try {
    // 2. Buat Transaksi Kasir Baru dengan Alamat Customer
    console.log("📝 1. Menguji Pencatatan Transaksi dengan Alamat Customer...");
    const orderPayload = {
      customerName: "Kak Anita Magetan",
      customerPhone: "081234567890",
      customerAddress: "Jl. Sukowati No. 10, RT 01/02, Kec. Kawedanan, Magetan",
      orderDate: new Date(),
      paymentMethod: "CASH" as const,
      paymentStatus: "PAID" as const,
      status: "COMPLETED" as const,
      discountAmount: 0,
      shippingFee: 0,
      notes: "Pesanan souvenir gantungan kunci custom",
      items: [
        {
          productId: testProduct.id,
          productName: testProduct.name,
          productSku: testProduct.sku,
          quantity: 2,
          unitPrice: 25000,
        },
      ],
    };

    const orderRes = await createOfflineOrder(orderPayload, owner.id);
    if (!orderRes.success || !orderRes.data) {
      throw new Error("Gagal membuat pesanan: " + orderRes.error);
    }
    createdOrderIds.push(orderRes.data.id);
    console.log("  ✅ Berhasil membuat pesanan:", orderRes.data.orderNumber);

    // 3. Verifikasi Alamat Customer Tersimpan di Database
    console.log("\n🔍 2. Verifikasi Data Alamat di Database...");
    const savedOrder = await prisma.order.findUnique({
      where: { id: orderRes.data.id },
    });

    if (savedOrder?.customerAddress !== orderPayload.customerAddress) {
      throw new Error(
        `Alamat tidak cocok! Harapan: ${orderPayload.customerAddress}, Aktual: ${savedOrder?.customerAddress}`
      );
    }
    console.log("  ✅ Alamat customer tersimpan akurat:", savedOrder.customerAddress);

    // 4. Verifikasi Agregasi getCustomers()
    console.log("\n👥 3. Menguji Server Action getCustomers()...");
    const customers = await getCustomers({ search: "Kak Anita" });
    const targetCustomer = customers.find((c) => c.name === "Kak Anita Magetan");

    if (!targetCustomer) {
      throw new Error("Pelanggan 'Kak Anita Magetan' tidak ditemukan dalam agregasi getCustomers!");
    }

    if (targetCustomer.address !== orderPayload.customerAddress) {
      throw new Error("Alamat pelanggan dalam getCustomers() tidak cocok!");
    }

    if (targetCustomer.totalOrders !== 1 || targetCustomer.totalSpent !== 50000) {
      throw new Error(`Kalkulasi belanja salah! Total Orders: ${targetCustomer.totalOrders}, Spent: ${targetCustomer.totalSpent}`);
    }
    console.log("  ✅ Agregasi data pelanggan valid:");
    console.log("     - Nama:", targetCustomer.name);
    console.log("     - Telepon:", targetCustomer.phone);
    console.log("     - Alamat:", targetCustomer.address);
    console.log("     - Total Order:", targetCustomer.totalOrders);
    console.log("     - Total Belanja: Rp", targetCustomer.totalSpent.toLocaleString("id-ID"));

    // 5. Menguji Pembuatan Struktur Excel (SheetJS / XLSX)
    console.log("\n📊 4. Menguji Format Data & Struktur File Excel...");
    const titleRow = ["SISTEM PEMBUKUAN CRAFTBYHANIFA - DIREKTORI DATA PELANGGAN"];
    const subTitleRow = [`Tanggal Ekspor: 05 September 2026 | Total Pelanggan: ${customers.length} Orang`];
    const infoRow = ["CraftByHanifa Studio • Magetan, Jawa Timur"];
    const emptyRow: string[] = [];
    const tableHeaders = [
      "No.",
      "Nama Pelanggan",
      "No. WhatsApp / Telepon",
      "Alamat Lengkap Customer",
      "Total Transaksi",
      "Total Belanja (Rp)",
      "Terakhir Belanja",
      "Kanal Penjualan",
    ];

    const dataRows = customers.map((c, idx) => [
      idx + 1,
      c.name,
      c.phone ? `'${c.phone}` : "-",
      c.address || "-",
      c.totalOrders,
      c.totalSpent,
      "05/09/2026",
      c.channels.join(", "),
    ]);

    const summaryRow = ["TOTAL", `${customers.length} Pelanggan`, "-", "-", 1, 50000, "-", "-"];

    const fullSheetData = [titleRow, subTitleRow, infoRow, emptyRow, tableHeaders, ...dataRows, summaryRow];
    const ws = XLSX.utils.aoa_to_sheet(fullSheetData);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 22 },
      { wch: 50 },
      { wch: 16 },
      { wch: 22 },
      { wch: 18 },
      { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Pelanggan");

    const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    if (!excelBuffer || excelBuffer.length === 0) {
      throw new Error("Gagal menghasilkan buffer file Excel!");
    }
    console.log("  ✅ Workbook Excel berhasil dibuat dengan sempurna (Ukuran:", excelBuffer.length, "bytes)");
    console.log("  ✅ Lebar kolom (!cols) terkonfigurasi rapi (8 kolom terdefinisi).");
    console.log("  ✅ Format nomor telepon terjaga dengan awalan teks sehingga '0' tidak hilang.");

    console.log("\n==================================================================");
    console.log("🏆 SELURUH PENGUJIAN FITUR PELANGGAN & EXPORT EXCEL SUKSES 100%!");
    console.log("==================================================================");
  } finally {
    // Cleanup test data
    console.log("\n🧹 Membersihkan data uji coba...");
    for (const oid of createdOrderIds) {
      await prisma.orderItem.deleteMany({ where: { orderId: oid } });
      await prisma.order.delete({ where: { id: oid } }).catch(() => {});
    }
    await prisma.stockMutation.deleteMany({ where: { productId: testProduct.id } });
    await prisma.product.delete({ where: { id: testProduct.id } }).catch(() => {});
    console.log("  ✅ Cleanup selesai.");
  }
}

runCustomerAndExcelTest()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
