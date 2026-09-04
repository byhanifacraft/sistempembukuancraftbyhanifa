-- ==============================================================================
-- SKRIP MIGRASI KEAMANAN RLS & INDEKS PERFORMA POSTGRESQL
-- SISTEM PEMBUKUAN CRAFTBYHANIFA
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. AKTIFKAN ROW LEVEL SECURITY (RLS) PADA SEMUA TABEL PUBLIK (16 TABEL)
-- Menutup kerentanan "rls_disabled_in_public" yang terdeteksi di Supabase.
-- Akses publik via PostgREST/Anon Key akan langsung diblokir secara default.
-- Prisma ORM internal (role postgres) tetap berjalan normal karena bypass RLS.
-- ------------------------------------------------------------------------------

ALTER TABLE public.bill_of_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopee_product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopee_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. KEBIJAKAN AKSES SERVICE ROLE SUPABASE (POLICIES)
-- Memastikan service_role Supabase (untuk internal serverless / maintenance)
-- memiliki izin penuh secara eksplisit.
-- ------------------------------------------------------------------------------

DO $$ 
DECLARE
    t text;
    tables text[] := ARRAY[
        'bill_of_materials', 'categories', 'products', 'production_runs',
        'users', 'units', 'purchases', 'purchase_items', 'stock_mutations',
        'shopee_product_mappings', 'order_items', 'expense_categories',
        'expenses', 'raw_materials', 'shopee_import_logs', 'orders'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS "Service role full access" ON public.%I;
            CREATE POLICY "Service role full access" 
            ON public.%I 
            FOR ALL 
            TO service_role 
            USING (true) 
            WITH CHECK (true);
        ', t, t);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 3. INDEKS PERFORMA POSTGRESQL TAMBAHAN
-- Menghilangkan Sequential Scans pada relasi transaksi, soft-delete, dan status.
-- ------------------------------------------------------------------------------

-- Relasi Pembelian Bahan Baku
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON public.purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_raw_material_id ON public.purchase_items(raw_material_id);

-- Relasi Order & Item
CREATE INDEX IF NOT EXISTS idx_order_items_composite ON public.order_items(order_id, product_id);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_created ON public.orders(deleted_at, created_at DESC);

-- Katalog & Filter Soft Delete
CREATE INDEX IF NOT EXISTS idx_products_active_deleted ON public.products(deleted_at, is_active);
CREATE INDEX IF NOT EXISTS idx_raw_materials_unit_deleted ON public.raw_materials(deleted_at, unit_id);
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON public.expenses(deleted_at);
CREATE INDEX IF NOT EXISTS idx_purchases_deleted_at ON public.purchases(deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON public.categories(deleted_at);
