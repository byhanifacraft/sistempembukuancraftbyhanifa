import prisma from "../lib/prisma";

const tables = [
  "bill_of_materials",
  "categories",
  "products",
  "production_runs",
  "users",
  "units",
  "purchases",
  "purchase_items",
  "stock_mutations",
  "shopee_product_mappings",
  "order_items",
  "expense_categories",
  "expenses",
  "raw_materials",
  "shopee_import_logs",
  "orders",
];

async function applySecurityAndIndexes() {
  console.log("==================================================================");
  console.log("🛡️  MEMULAI PENERAPAN RLS & INDEKS PERFORMA KE DATABASE SUPABASE");
  console.log("==================================================================\n");

  // 1. Aktifkan RLS
  console.log("1. Mengaktifkan Row Level Security (RLS) pada 16 tabel...");
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`  ✅ [RLS ENABLED] ${table}`);
    } catch (err: any) {
      console.error(`  ❌ [FAIL RLS] ${table}:`, err.message);
    }
  }

  // 2. Buat Policy Service Role
  console.log("\n2. Membuat Policy izin akses penuh untuk role service_role...");
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Service role full access" ON public."${table}";`);
      await prisma.$executeRawUnsafe(`
        CREATE POLICY "Service role full access" 
        ON public."${table}" 
        FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
      `);
      console.log(`  ✅ [POLICY CREATED] ${table}`);
    } catch (err: any) {
      console.error(`  ❌ [FAIL POLICY] ${table}:`, err.message);
    }
  }

  // 3. Tambahkan Indeks Performa
  console.log("\n3. Membuat Indeks Performa PostgreSQL...");
  const indexes = [
    { name: "idx_purchase_items_purchase_id", sql: `CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON public.purchase_items(purchase_id);` },
    { name: "idx_purchase_items_raw_material_id", sql: `CREATE INDEX IF NOT EXISTS idx_purchase_items_raw_material_id ON public.purchase_items(raw_material_id);` },
    { name: "idx_order_items_composite", sql: `CREATE INDEX IF NOT EXISTS idx_order_items_composite ON public.order_items(order_id, product_id);` },
    { name: "idx_orders_deleted_created", sql: `CREATE INDEX IF NOT EXISTS idx_orders_deleted_created ON public.orders(deleted_at, created_at DESC);` },
    { name: "idx_products_active_deleted", sql: `CREATE INDEX IF NOT EXISTS idx_products_active_deleted ON public.products(deleted_at, is_active);` },
    { name: "idx_raw_materials_unit_deleted", sql: `CREATE INDEX IF NOT EXISTS idx_raw_materials_unit_deleted ON public.raw_materials(deleted_at, unit_id);` },
    { name: "idx_expenses_deleted_at", sql: `CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON public.expenses(deleted_at);` },
    { name: "idx_purchases_deleted_at", sql: `CREATE INDEX IF NOT EXISTS idx_purchases_deleted_at ON public.purchases(deleted_at);` },
    { name: "idx_categories_deleted_at", sql: `CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON public.categories(deleted_at);` },
  ];

  for (const idx of indexes) {
    try {
      await prisma.$executeRawUnsafe(idx.sql);
      console.log(`  ⚡ [INDEX CREATED] ${idx.name}`);
    } catch (err: any) {
      console.error(`  ❌ [FAIL INDEX] ${idx.name}:`, err.message);
    }
  }

  console.log("\n==================================================================");
  console.log("🎉 SELESAI: RLS & INDEKS BERHASIL DITERAPKAN DENGAN LENGKAP!");
  console.log("==================================================================");
}

applySecurityAndIndexes()
  .catch((e) => {
    console.error("FATAL ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
