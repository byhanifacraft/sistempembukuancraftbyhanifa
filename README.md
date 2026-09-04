# Sistem Pembukuan & Manajemen Inventori CraftByHanifa

Aplikasi pembukuan internal, kalkulasi HPP (Harga Pokok Produksi) berbasis Bill of Materials (BOM), dan rekonsiliasi data penjualan Shopee & kasir offline untuk usaha kerajinan tangan **CraftByHanifa**, berlokasi di **Desa Bogem, Kecamatan Kawedanan, Kabupaten Magetan, Jawa Timur**.

---

## 1. Karakteristik Bisnis & Dua Mode Produksi

CraftByHanifa memproduksi kerajinan tangan custom (Gantungan Kunci Resin, Lilin Aromaterapi Soy Wax, Pouch Kain Blacu, Casing HP) dengan dua model alur stok yang berjalan berdampingan:

1. **`STOCK_BASED` (Produk Variasi Tetap / Standar)**:
   - *Contoh*: Lilin Aromaterapi Gelas 60ml, Tungku Keramik, Casing Polos.
   - Diproduksi di muka secara batch via modul **Produksi Batch**.
   - Bahan baku dipotong saat aktivitas produksi dicatat, menghasilkan stok produk jadi (`Product.currentStock`) dan memperbarui harga pokok standar (`Product.costPrice`).
   - Saat ada transaksi penjualan (Shopee / Offline), sistem memotong stok produk jadi dan mengunci snapshot HPP dari `costPrice` terkini.

2. **`MADE_TO_ORDER` (Produk Kustom / Personalisasi)**:
   - *Contoh*: Gantungan Kunci Custom Huruf/Nama/Glitter, Souvenir Pouch Custom Sablon.
   - Tidak ada stok produk jadi yang disimpan di muka.
   - Bahan baku dipotong **LANGSUNG** dari resep BOM saat transaksi penjualan disimpan.
   - Snapshot HPP dihitung otomatis dari akumulasi $\sum (\text{BOM quantityNeeded} \times \text{RawMaterial.avgCostPerUnit})$ pada saat order dibuat.
   - Catatan kustomisasi pembeli (mis. tulisan nama, warna glitter) tersimpan di `OrderItem.customNote`.

---

## 2. Arsitektur Teknis & Prinsip Integritas Data

### A. Pessimistic Row Locking (Pencegahan Race Condition)
Untuk mencegah *race condition* ketika kasir offline dan impor data Shopee berjalan bersamaan pada bahan baku atau produk yang sama, semua operasi yang memeriksa dan mengurangi stok menggunakan transaksi interaktif Prisma dengan penguncian baris PostgreSQL:
```typescript
await tx.$queryRaw`
  SELECT id, current_stock, avg_cost_per_unit FROM raw_materials 
  WHERE id = ANY(${materialIds}::uuid[]) FOR UPDATE
`;
```
Baris terkunci hingga transaksi selesai (*commit* atau *rollback*), menjamin ketersediaan stok tidak pernah minus tanpa terdeteksi.

### B. Moving Weighted Average (Harga Pokok Bahan Baku)
Setiap kali ada pembelian bahan baku baru (`Purchase`), harga rata-rata bahan diperbarui secara moving weighted average:
$$\text{newAvgCost} = \text{round}\left( \frac{(\text{currentStock} \times \text{avgCostPerUnit}) + (\text{purchaseQty} \times \text{purchaseUnitCost})}{\text{currentStock} + \text{purchaseQty}} \right)$$
Nilai `lastCostPerUnit` mencatat harga pembelian terakhir tanpa rata-rata (berguna untuk simulasi kenaikan harga bahan).

### C. Kebijakan Pembulatan Rupiah (Rounding Policy)
- Semua field moneter disimpan sebagai **Integer Rupiah** (tanpa desimal).
- Pembulatan dilakukan konsisten menggunakan `Math.round()`.
- Akumulasi pembulatan lintas multi-transaksi dapat menyebabkan selisih beberapa Rupiah dari nilai teoritis bahan baku. Hal ini wajar dan dapat diterima dalam skala UMKM.

### D. Snapshot HPP Permanen
Field `OrderItem.unitHpp` dan `Order.totalHppAmount` adalah **snapshot yang dikunci sekali saat transaksi dibuat**. Laporan laba-rugi periode lampau tidak akan terdistorsi meskipun harga bahan baku naik/turun di masa depan.

---

## 3. Fitur Utama Sistem

1. **Dashboard Usaha**: Ringkasan omzet hari ini & bulan ini, laba bersih (net margin %), peringatan stok bahan baku menipis, kontribusi kanal Shopee vs Offline, dan produk terlaris.
2. **Katalog Produk & Resep BOM**: CRUD produk, pemilihan mode (`STOCK_BASED` vs `MADE_TO_ORDER`), penyusunan resep bahan baku per unit, dan kalkulasi otomatis HPP live.
3. **Bahan Baku & Stok Inventori**: Master bahan baku dengan satuan (gram, ml, pcs, meter), pemantauan ambang batas minimum, dan fitur stock opname fisik.
4. **Produksi Batch**: Eksekusi batch produk stok jadi, pre-check kecukupan seluruh bahan baku di resep, dan jejak audit batch.
5. **Transaksi Penjualan Terpadu**: Kasir cepat offline dengan input custom order, rincian pesanan dengan tampilan cetak faktur.
6. **Impor Shopee Cerdas**:
   - Upload file `.xlsx` / `.csv` dari Shopee Seller Center.
   - Deteksi kolom fleksibel & pencegahan duplikasi pesanan.
   - Fuzzy matching nama produk dengan konfirmasi manual wajib sebelum impor.
   - Rollback instan untuk membatalkan impor dan mengembalikan stok.
7. **Pengeluaran Usaha**: Pembelian bahan baku (Moving Average) & beban operasional (kemasan, listrik, iklan Shopee, ongkir talangan).
8. **Laporan Keuangan**:
   - **Laba Rugi**: Pendapatan bersih - Total HPP - Beban operasional = Laba bersih.
   - **Arus Kas**: Arus kas masuk vs kas keluar.
   - **Kalkulator HPP & Simulasi Harga Jual**: Analisis margin dan rekomendasi harga jual optimal.

---

## 4. Panduan Setup & Instalasi Lokal

### Prasyarat:
- Node.js versi 18.x / 20.x / 22.x LTS
- PostgreSQL Database (lokal atau instance Supabase Cloud)

### Langkah Instalasi:

1. **Clone repository & masuk ke direktori project**:
   ```bash
   cd c:/Projects/pembukuancraftbyhanifa
   ```

2. **Salin file environment variables**:
   ```bash
   cp .env.example .env
   ```
   Sesuaikan isi `.env` dengan kredensial database Anda:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

5. **Jalankan Migrasi Database / Push Schema**:
   ```bash
   npx prisma db push
   # atau untuk mode migration:
   npx prisma migrate dev --name init_craftbyhanifa
   ```

6. **Seed Data Awal (Katalog & Bahan Baku Sampel CraftByHanifa)**:
   ```bash
   npm run prisma:seed
   ```

7. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```
   Buka browser di `http://localhost:3000`.

---

## 5. File Contoh untuk Pengujian Impor Shopee

Tersedia file sampel laporan ekspor Shopee di folder `sample-data/`:
- `sample-data/laporan_penjualan_shopee_sample.xlsx`
- `sample-data/laporan_penjualan_shopee_sample.csv`

File ini memuat contoh pesanan:
- Gantungan kunci huruf resin custom dengan catatan pesan pembeli (*"Nama: Nabila, foil emas"*).
- Lilin aromaterapi lavender gelas 60ml.
- Pouch serut souvenir blacu 10x15cm (*"The Wedding of Arga & Nabila"*).
- Casing HP resin bunga kering custom nama.
- Pesanan berstatus batal untuk menguji filter status.

---

## 6. Panduan Deployment ke Vercel & Supabase

### A. Supabase Setup
1. Buat project baru di [supabase.com](https://supabase.com).
2. Salin **Connection String** (URI) dari menu *Project Settings > Database*:
   - Gunakan *Transaction Pooler* (port 6543) untuk `DATABASE_URL`.
   - Gunakan *Session / Direct Connection* (port 5432) untuk `DIRECT_URL`.
3. Di menu *Storage*, buat bucket baru bernama `receipts` (opsional untuk upload foto nota/struk beban).

### B. Vercel Deployment
1. Import repository ke [Vercel](https://vercel.com).
2. Masukkan Environment Variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Build Command: `npm run build`
4. Output Directory: `.next`
5. Klik **Deploy**.
