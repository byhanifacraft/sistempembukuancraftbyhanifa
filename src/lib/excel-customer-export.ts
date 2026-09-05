import * as XLSX from "xlsx";
import { CustomerSummary } from "@/actions/customer.actions";

/**
 * Export customer directory into a beautifully formatted Excel file
 * Ensures clean column widths, preserved phone number formatting, and summary totals
 */
export function exportCustomersToExcel(customers: CustomerSummary[]) {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const formattedPrintDate = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // 1. Header and metadata banners
  const titleRow = ["SISTEM PEMBUKUAN CRAFTBYHANIFA - DIREKTORI DATA PELANGGAN"];
  const subTitleRow = [
    `Tanggal Ekspor: ${formattedPrintDate} | Total Pelanggan: ${customers.length} Orang`,
  ];
  const infoRow = ["CraftByHanifa Studio • Magetan, Jawa Timur (Katalog & Penjualan)"];
  const emptyRow: string[] = [];

  // 2. Table Column Headers
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

  let totalOrdersAll = 0;
  let totalSpentAll = 0;

  // 3. Data rows with careful formatting
  const dataRows = customers.map((c, index) => {
    totalOrdersAll += c.totalOrders;
    totalSpentAll += c.totalSpent;

    const formattedDate = c.lastOrderDate
      ? new Date(c.lastOrderDate).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "-";

    return [
      index + 1,
      c.name,
      // Prefix with apostrophe to keep exact leading zero in Excel ('0812...)
      c.phone ? `'${c.phone}` : "-",
      c.address || "-",
      c.totalOrders,
      c.totalSpent,
      formattedDate,
      c.channels.join(", "),
    ];
  });

  // 4. Summary row
  const summaryRow = [
    "TOTAL",
    `${customers.length} Pelanggan`,
    "-",
    "-",
    totalOrdersAll,
    totalSpentAll,
    "-",
    "-",
  ];

  const fullSheetData = [
    titleRow,
    subTitleRow,
    infoRow,
    emptyRow,
    tableHeaders,
    ...dataRows,
    summaryRow,
  ];

  // 5. Construct Worksheet
  const ws = XLSX.utils.aoa_to_sheet(fullSheetData);

  // 6. Set custom character widths for every column (neat, readable, no truncation)
  ws["!cols"] = [
    { wch: 6 },  // No.
    { wch: 28 }, // Nama Pelanggan
    { wch: 22 }, // No. WhatsApp / Telepon
    { wch: 50 }, // Alamat Lengkap Customer
    { wch: 16 }, // Total Transaksi
    { wch: 22 }, // Total Belanja (Rp)
    { wch: 18 }, // Terakhir Belanja
    { wch: 20 }, // Kanal Penjualan
  ];

  // 7. Construct Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data Pelanggan");

  // 8. Trigger download
  const filename = `Data_Pelanggan_CraftByHanifa_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}
