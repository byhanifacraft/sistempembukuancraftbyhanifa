import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const sampleRows = [
  {
    "No. Pesanan": "260901SHOPEE001",
    "Status Pesanan": "Selesai",
    "Waktu Pesanan Dibuat": "2026-09-01 10:15",
    "Nama Produk": "Gantungan Kunci Huruf Resin Custom (Nama/Warna/Glitter)",
    "Nama Variasi": "Huruf N / Gold Glitter",
    "Harga Awal": "10000",
    "Harga Setelah Diskon": "8000",
    "Jumlah": "2",
    "Total Pembayaran": "16000",
    "Perkiraan Ongkos Kirim": "0",
    "Nama Penerima": "Dinda Ayu Magetan",
    "Pesan dari Pembeli": "Nama di resin: Nabila, foil emas ya kak",
  },
  {
    "No. Pesanan": "260901SHOPEE002",
    "Status Pesanan": "Selesai",
    "Waktu Pesanan Dibuat": "2026-09-01 11:30",
    "Nama Produk": "Lilin Aromaterapi Gelas Kaca 60ml (Lavender Calming)",
    "Nama Variasi": "Lavender Gelas 60ml",
    "Harga Awal": "15000",
    "Harga Setelah Diskon": "12000",
    "Jumlah": "3",
    "Total Pembayaran": "36000",
    "Perkiraan Ongkos Kirim": "0",
    "Nama Penerima": "Rina Madiun",
    "Pesan dari Pembeli": "Packing bubble wrap tebal ya kak",
  },
  {
    "No. Pesanan": "260901SHOPEE003",
    "Status Pesanan": "Selesai",
    "Waktu Pesanan Dibuat": "2026-09-01 14:00",
    "Nama Produk": "Souvenir Pouch Kantong Serut Blacu Custom (10x15cm)",
    "Nama Variasi": "10x15cm Serut Dua Sisi",
    "Harga Awal": "5000",
    "Harga Setelah Diskon": "4500",
    "Jumlah": "20",
    "Total Pembayaran": "90000",
    "Perkiraan Ongkos Kirim": "0",
    "Nama Penerima": "Budi Santoso Solo",
    "Pesan dari Pembeli": "Sablon: The Wedding of Arga & Nabila 2026",
  },
  {
    "No. Pesanan": "260901SHOPEE004",
    "Status Pesanan": "Dibatalkan",
    "Waktu Pesanan Dibuat": "2026-09-01 15:20",
    "Nama Produk": "Gantungan Kunci Shaker Resin Custom Premium",
    "Nama Variasi": "Botol Shaker",
    "Harga Awal": "18000",
    "Harga Setelah Diskon": "15000",
    "Jumlah": "1",
    "Total Pembayaran": "15000",
    "Perkiraan Ongkos Kirim": "0",
    "Nama Penerima": "Citra Surabaya",
    "Pesan dari Pembeli": "Batal karena salah alamat",
  },
  {
    "No. Pesanan": "260901SHOPEE005",
    "Status Pesanan": "Selesai",
    "Waktu Pesanan Dibuat": "2026-09-01 16:45",
    "Nama Produk": "Casing HP Resin Bunga Kering Custom Nama",
    "Nama Variasi": "iPhone 13 / Bunga Ungu",
    "Harga Awal": "30000",
    "Harga Setelah Diskon": "25000",
    "Jumlah": "1",
    "Total Pembayaran": "25000",
    "Perkiraan Ongkos Kirim": "0",
    "Nama Penerima": "Siti Nurhaliza Ngawi",
    "Pesan dari Pembeli": "Nama: Hanifa, font latin emas",
  },
];

const sampleDir = path.join(process.cwd(), "sample-data");
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

// Write CSV
const csvHeaders = Object.keys(sampleRows[0]).join(",");
const csvBody = sampleRows
  .map((r) =>
    Object.values(r)
      .map((v) => `"${v.replace(/"/g, '""')}"`)
      .join(",")
  )
  .join("\n");
const csvContent = `${csvHeaders}\n${csvBody}`;
fs.writeFileSync(path.join(sampleDir, "laporan_penjualan_shopee_sample.csv"), csvContent);

// Write XLSX
const ws = XLSX.utils.json_to_sheet(sampleRows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Orders");
XLSX.writeFile(wb, path.join(sampleDir, "laporan_penjualan_shopee_sample.xlsx"));

console.log("✓ Sample Shopee files created in sample-data/ directory.");
