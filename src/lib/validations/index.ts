import { z } from "zod";

// ==============================================================================
// MASTER DATA SCHEMAS
// ==============================================================================

export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(100),
  description: z.string().optional().nullable(),
});

export const unitSchema = z.object({
  name: z.string().min(1, "Nama satuan wajib diisi").max(50),
  symbol: z.string().min(1, "Simbol satuan wajib diisi").max(10),
});

export const rawMaterialSchema = z.object({
  name: z.string().min(1, "Nama bahan baku wajib diisi").max(150),
  sku: z.string().optional().nullable(),
  unitId: z.string().uuid("Satuan tidak valid"),
  currentStock: z.coerce.number().min(0, "Stok awal tidak boleh negatif").default(0),
  minimumStock: z.coerce.number().min(0, "Ambang batas stok tidak boleh negatif").default(10),
  avgCostPerUnit: z.coerce.number().int().min(0, "Harga rata-rata tidak boleh negatif").default(0),
  lastCostPerUnit: z.coerce.number().int().min(0).default(0),
  description: z.string().optional().nullable(),
});

export const bomItemInputSchema = z.object({
  rawMaterialId: z.string().uuid("Bahan baku wajib dipilih"),
  quantityNeeded: z.coerce.number().positive("Jumlah kebutuhan bahan harus lebih dari 0"),
  notes: z.string().optional().nullable(),
});

export const productSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi").max(200),
  sku: z.string().optional().nullable(),
  categoryId: z.string().uuid("Kategori wajib dipilih"),
  productionMode: z.enum(["STOCK_BASED", "MADE_TO_ORDER"], {
    required_error: "Mode produksi wajib dipilih",
  }),
  sellingPrice: z.coerce.number().int().min(0, "Harga jual tidak boleh negatif"),
  costPrice: z.coerce.number().int().min(0).default(0),
  currentStock: z.coerce.number().int().min(0).default(0),
  minStockAlert: z.coerce.number().int().min(0).default(5),
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  bomItems: z.array(bomItemInputSchema).optional().default([]),
});

// ==============================================================================
// PRODUCTION RUN SCHEMA (STOCK_BASED)
// ==============================================================================

export const productionRunSchema = z.object({
  productId: z.string().uuid("Produk wajib dipilih"),
  quantityMade: z.coerce.number().int().positive("Jumlah produksi harus lebih dari 0"),
  productionDate: z.coerce.date().default(() => new Date()),
  notes: z.string().optional().nullable(),
});

// ==============================================================================
// SALES ORDER SCHEMAS (OFFLINE & SHOPEE)
// ==============================================================================

export const orderItemInputSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  productName: z.string().min(1, "Nama produk wajib diisi"),
  productSku: z.string().optional().nullable(),
  variantName: z.string().optional().nullable(),
  quantity: z.coerce.number().int().positive("Jumlah beli minimal 1"),
  unitPrice: z.coerce.number().int().min(0, "Harga satuan tidak boleh negatif"),
  customNote: z.string().optional().nullable(), // Catatan kustom (e.g. Nama, Warna, Glitter)
});

export const offlineOrderSchema = z.object({
  customerName: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  customerAddress: z.string().optional().nullable(),
  orderDate: z.coerce.date().default(() => new Date()),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "SHOPEE_PAY", "QRIS", "OTHER"]).default("CASH"),
  paymentStatus: z.enum(["PAID", "UNPAID", "REFUNDED"]).default("PAID"),
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "RETURNED"]).default("COMPLETED"),
  discountAmount: z.coerce.number().int().min(0).default(0),
  shippingFee: z.coerce.number().int().min(0).default(0),
  notes: z.string().optional().nullable(),
  items: z.array(orderItemInputSchema).min(1, "Minimal 1 produk dalam transaksi"),
});

// ==============================================================================
// PURCHASES & EXPENSES SCHEMAS
// ==============================================================================

export const purchaseItemInputSchema = z.object({
  rawMaterialId: z.string().uuid("Bahan baku wajib dipilih"),
  quantity: z.coerce.number().positive("Jumlah beli harus lebih dari 0"),
  unitCost: z.coerce.number().int().min(0, "Harga satuan beli tidak boleh negatif"),
});

export const purchaseSchema = z.object({
  supplierName: z.string().optional().nullable(),
  purchaseDate: z.coerce.date().default(() => new Date()),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "SHOPEE_PAY", "QRIS", "OTHER"]).default("BANK_TRANSFER"),
  paymentStatus: z.enum(["PAID", "UNPAID"]).default("PAID"),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseItemInputSchema).min(1, "Minimal 1 item bahan baku yang dibeli"),
});

export const expenseCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori pengeluaran wajib diisi").max(100),
});

export const expenseSchema = z.object({
  categoryId: z.string().uuid("Kategori pengeluaran wajib dipilih"),
  title: z.string().min(1, "Judul pengeluaran wajib diisi").max(200),
  amount: z.coerce.number().int().positive("Nominal pengeluaran harus lebih dari 0"),
  expenseDate: z.coerce.date().default(() => new Date()),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "OTHER"]).default("CASH"),
  receiptUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ==============================================================================
// SHOPEE IMPORT SCHEMAS
// ==============================================================================

export const shopeeColumnMappingSchema = z.object({
  orderSnColumn: z.string().default("No. Pesanan"),
  orderStatusColumn: z.string().default("Status Pesanan"),
  orderDateColumn: z.string().default("Waktu Pesanan Dibuat"),
  productNameColumn: z.string().default("Nama Produk"),
  variationColumn: z.string().default("Nama Variasi"),
  dealPriceColumn: z.string().default("Harga Setelah Diskon"),
  quantityColumn: z.string().default("Jumlah"),
  totalPaymentColumn: z.string().default("Total Pembayaran"),
  shippingFeeColumn: z.string().default("Perkiraan Ongkos Kirim"),
  buyerNoteColumn: z.string().default("Pesan dari Pembeli"),
  customerNameColumn: z.string().default("Nama Penerima"),
});

export type ShopeeColumnMapping = z.infer<typeof shopeeColumnMappingSchema>;
