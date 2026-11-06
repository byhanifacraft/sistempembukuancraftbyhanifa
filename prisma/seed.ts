import "dotenv/config";
import {
  ImportStatus,
  ItemType,
  MutationType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  ProductionMode,
  SalesChannel,
  UserRole,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { startOfMonth, subDays, subHours } from "date-fns";

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/postgres";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function dateInCurrentMonth(now: Date, daysBack: number, hoursBack = 2): Date {
  const monthStart = startOfMonth(now);
  const candidate = subHours(subDays(now, daysBack), hoursBack);
  return candidate < monthStart ? subHours(now, hoursBack) : candidate;
}

async function main() {
  console.log("🌱 Memulai Seeding Data Lengkap Sistem Pembukuan CraftByHanifa...");
  const now = new Date();

  // ---------------------------------------------------------------------------
  // 1. PROVISION / UPSERT OWNER & KARYAWAN (SUPABASE AUTH + PUBLIC.USERS)
  // ---------------------------------------------------------------------------
  const usersToSeed = [
    {
      email: "owner@craftbyhanifa.com",
      password: "OwnerHanifa2026!",
      name: "Hanifa (Owner)",
      role: UserRole.OWNER,
    },
    {
      email: "karyawan@craftbyhanifa.com",
      password: "KaryawanHanifa2026!",
      name: "Siti (Karyawan Operasional)",
      role: UserRole.STAFF,
    },
  ];

  const userMap = new Map<UserRole, string>();

  for (const u of usersToSeed) {
    const hashRes: any = await prisma.$queryRaw`
      SELECT crypt(${u.password}, gen_salt('bf', 10)) as hashed;
    `;
    const hashed = hashRes[0].hashed;
    const rawUserMeta = JSON.stringify({ name: u.name, role: u.role });
    const rawAppMeta = JSON.stringify({ provider: "email", providers: ["email"] });

    const existingAuth: any[] = await prisma.$queryRaw`
      SELECT id FROM auth.users WHERE email = ${u.email} LIMIT 1;
    `;

    let userId: string;

    if (existingAuth.length === 0) {
      const insertedUsers: any = await prisma.$queryRaw`
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          confirmation_token, recovery_token, email_change_token_new, email_change,
          raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
          phone_change, phone_change_token, email_change_token_current, email_change_confirm_status,
          reauthentication_token, is_sso_user, is_anonymous
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          ${u.email}, ${hashed}, NOW(), '', '', '', '',
          ${rawAppMeta}::jsonb, ${rawUserMeta}::jsonb, NULL, NOW(), NOW(),
          '', '', '', 0, '', false, false
        ) RETURNING id;
      `;
      userId = insertedUsers[0].id;

      const identityJson = JSON.stringify({ sub: userId, email: u.email });
      await prisma.$executeRaw`
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
        VALUES (gen_random_uuid(), ${userId}::uuid, ${identityJson}::jsonb, 'email', ${userId}::text, NOW(), NOW());
      `;
    } else {
      userId = existingAuth[0].id;
      await prisma.$executeRaw`
        UPDATE auth.users
        SET encrypted_password = ${hashed},
            raw_user_meta_data = ${rawUserMeta}::jsonb,
            updated_at = NOW()
        WHERE id = ${userId}::uuid;
      `;
    }

    const dbUser = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { id: userId, email: u.email, name: u.name, role: u.role },
    });

    userMap.set(u.role, dbUser.id);
    console.log(`✓ Akun siap: ${u.email} (${u.role})`);
  }

  const ownerId = userMap.get(UserRole.OWNER)!;
  const staffId = userMap.get(UserRole.STAFF)!;

  // ---------------------------------------------------------------------------
  // 2. BERSIHKAN DATA TRANSAKSI LAMA / DUMMY AGAR KONSISTEN & TIDAK DUPLIKAT
  // ---------------------------------------------------------------------------
  console.log("🧹 Menyegarkan data operasional & transaksi sebelum isi seed...");
  await prisma.shopeeProductMapping.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.shopeeImportLog.deleteMany();
  await prisma.stockMutation.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.productionRun.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.billOfMaterial.deleteMany();
  await prisma.product.deleteMany();
  await prisma.rawMaterial.deleteMany();
  await prisma.expenseCategory.deleteMany();

  // ---------------------------------------------------------------------------
  // 3. MASTER SATUAN (UNITS)
  // ---------------------------------------------------------------------------
  const unitsData = [
    { name: "Gram", symbol: "g" },
    { name: "Mililiter", symbol: "ml" },
    { name: "Pcs / Buah", symbol: "pcs" },
    { name: "Meter", symbol: "m" },
    { name: "Lembar", symbol: "lbr" },
    { name: "Botol", symbol: "btl" },
  ];

  const unitMap = new Map<string, string>();
  for (const u of unitsData) {
    const unit = await prisma.unit.upsert({
      where: { symbol: u.symbol },
      update: { name: u.name },
      create: u,
    });
    unitMap.set(u.symbol, unit.id);
  }
  console.log(`✓ Master Satuan: ${unitMap.size} satuan`);

  // ---------------------------------------------------------------------------
  // 4. MASTER KATEGORI PRODUK (CATEGORIES)
  // ---------------------------------------------------------------------------
  const categoriesData = [
    {
      name: "Gantungan Kunci Resin",
      slug: "gantungan-kunci-resin",
      description: "Gantungan kunci custom huruf, nama, glitter, dan shaker resin",
    },
    {
      name: "Lilin Aromaterapi & Souvenir",
      slug: "lilin-aromaterapi",
      description: "Lilin wangi soy wax souvenir gelas sloki & hampers aromaterapi",
    },
    {
      name: "Souvenir & Hadiah Pouch",
      slug: "souvenir-pouch-blacu",
      description: "Kantong serut kain blacu / drill custom sablon nama & pernikahan",
    },
    {
      name: "Casing & Aksesoris HP",
      slug: "casing-aksesoris-hp",
      description: "Casing ponsel custom resin bunga kering, glitter & phone strap",
    },
  ];

  const categoryMap = new Map<string, string>();
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, deletedAt: null },
      create: c,
    });
    categoryMap.set(c.slug, cat.id);
  }
  console.log(`✓ Master Kategori Produk: ${categoryMap.size} kategori`);

  // ---------------------------------------------------------------------------
  // 5. MASTER KATEGORI PENGELUARAN (EXPENSE CATEGORIES)
  // ---------------------------------------------------------------------------
  const expenseCategoriesData = [
    { name: "Kemasan & Packaging (Box, Bubble Wrap, Kartu)", isDefault: true },
    { name: "Listrik, Air & Operasional Studio", isDefault: true },
    { name: "Biaya Layanan & Iklan Shopee", isDefault: true },
    { name: "Ongkir Talangan & Pengiriman", isDefault: true },
    { name: "Peralatan Produksi & Cetakan", isDefault: true },
    { name: "Lain-lain / Operasional Tak Terduga", isDefault: false },
  ];

  const expenseCategoryMap = new Map<string, string>();
  for (const ec of expenseCategoriesData) {
    const created = await prisma.expenseCategory.upsert({
      where: { name: ec.name },
      update: { isDefault: ec.isDefault },
      create: ec,
    });
    expenseCategoryMap.set(ec.name, created.id);
  }
  console.log(`✓ Master Kategori Pengeluaran: ${expenseCategoryMap.size} kategori`);

  // ---------------------------------------------------------------------------
  // 6. BAHAN BAKU & STOK (RAW MATERIALS)
  // ---------------------------------------------------------------------------
  const rawMaterialsData = [
    {
      name: "Resin Epoxy Bening & Hardener (1:1)",
      sku: "RM-RESIN-01",
      unitSymbol: "ml",
      currentStock: 2850,
      minimumStock: 500,
      avgCostPerUnit: 85,
      lastCostPerUnit: 85,
      description: "Resin art bening anti menguning + katalis hardener perbandingan 1:1",
    },
    {
      name: "Ring Kunci Nikel + Rantai Pipih",
      sku: "RM-RING-01",
      unitSymbol: "pcs",
      currentStock: 420,
      minimumStock: 60,
      avgCostPerUnit: 450,
      lastCostPerUnit: 450,
      description: "Ring gantungan kunci tebal warna silver nikel anti karat + jump ring",
    },
    {
      name: "Foil Emas & Serpihan Glitter",
      sku: "RM-FOIL-01",
      unitSymbol: "g",
      currentStock: 185,
      minimumStock: 30,
      avgCostPerUnit: 300,
      lastCostPerUnit: 300,
      description: "Gold leaf flakes & fine glitter hologram untuk dekorasi huruf resin",
    },
    {
      name: "Soy Wax Kedelai Natural Grade A",
      sku: "RM-SOYWAX-01",
      unitSymbol: "g",
      currentStock: 4200,
      minimumStock: 1000,
      avgCostPerUnit: 55,
      lastCostPerUnit: 55,
      description: "Lilin kedelai murni ramah lingkungan untuk scented candle",
    },
    {
      name: "Sumbu Lilin Katun 10cm + Tab Dasar",
      sku: "RM-SUMBU-01",
      unitSymbol: "pcs",
      currentStock: 340,
      minimumStock: 80,
      avgCostPerUnit: 350,
      lastCostPerUnit: 350,
      description: "Sumbu katun berlilin sudah terpasang besi penyangga bawah",
    },
    {
      name: "Gelas Sloki Kaca Tebal 60ml",
      sku: "RM-GLS-60ML",
      unitSymbol: "pcs",
      currentStock: 115,
      minimumStock: 30,
      avgCostPerUnit: 2200,
      lastCostPerUnit: 2200,
      description: "Wadah gelas kaca tahan panas ukuran 60ml untuk lilin aromaterapi",
    },
    {
      name: "Fragrance Oil Lavender Premium",
      sku: "RM-FO-LAV",
      unitSymbol: "ml",
      currentStock: 75, // Di bawah minimumStock (100) agar tampil di Peringatan Stok Menipis
      minimumStock: 100,
      avgCostPerUnit: 450,
      lastCostPerUnit: 450,
      description: "Bibit parfum khusus lilin aroma French Lavender menenangkan",
    },
    {
      name: "Fragrance Oil Vanilla Sweet",
      sku: "RM-FO-VAN",
      unitSymbol: "ml",
      currentStock: 260,
      minimumStock: 80,
      avgCostPerUnit: 420,
      lastCostPerUnit: 420,
      description: "Bibit parfum khusus lilin aroma Warm Vanilla manis",
    },
    {
      name: "Kain Blacu Katun Tebal",
      sku: "RM-BLACU-01",
      unitSymbol: "m",
      currentStock: 34,
      minimumStock: 10,
      avgCostPerUnit: 16000,
      lastCostPerUnit: 16000,
      description: "Kain blacu serat rapat warna broken white untuk pouch souvenir",
    },
    {
      name: "Tali Kur Katun 4mm",
      sku: "RM-TALIKUR-01",
      unitSymbol: "m",
      currentStock: 140,
      minimumStock: 25,
      avgCostPerUnit: 800,
      lastCostPerUnit: 800,
      description: "Tali serut katun natural untuk kantong pouch & gantungan",
    },
    {
      name: "Casing HP Polos Bening Anticrack TPU",
      sku: "RM-CASE-CLR",
      unitSymbol: "pcs",
      currentStock: 9, // Di bawah minimumStock (15) agar tampil di Peringatan Stok Menipis
      minimumStock: 15,
      avgCostPerUnit: 5000,
      lastCostPerUnit: 5000,
      description: "Casing akrilik/TPU transparan bahan dasar custom case resin",
    },
    {
      name: "Bunga Kering Pres (Pressed Dried Flowers)",
      sku: "RM-BUNGA-01",
      unitSymbol: "pcs",
      currentStock: 120,
      minimumStock: 30,
      avgCostPerUnit: 650,
      lastCostPerUnit: 650,
      description: "Bunga daisy, baby breath & daun pakis kering pres asli untuk resin art",
    },
  ];

  const rawMaterialMap = new Map<string, { id: string; name: string; avgCost: number; stock: number }>();

  for (const rm of rawMaterialsData) {
    const unitId = unitMap.get(rm.unitSymbol)!;
    const created = await prisma.rawMaterial.create({
      data: {
        name: rm.name,
        sku: rm.sku,
        unitId,
        currentStock: rm.currentStock,
        minimumStock: rm.minimumStock,
        avgCostPerUnit: rm.avgCostPerUnit,
        lastCostPerUnit: rm.lastCostPerUnit,
        description: rm.description,
      },
    });

    rawMaterialMap.set(rm.sku, {
      id: created.id,
      name: created.name,
      avgCost: rm.avgCostPerUnit,
      stock: rm.currentStock,
    });

    await prisma.stockMutation.create({
      data: {
        itemType: ItemType.RAW_MATERIAL,
        rawMaterialId: created.id,
        mutationType: MutationType.ADJUSTMENT_IN,
        quantity: rm.currentStock,
        previousStock: 0,
        newStock: rm.currentStock,
        referenceType: "INITIAL_SEED",
        notes: "Saldo awal stok bahan baku studio CraftByHanifa",
        createdById: ownerId,
        createdAt: subDays(now, 10),
      },
    });
  }
  console.log(`✓ Bahan Baku & Saldo Awal: ${rawMaterialMap.size} item`);

  // ---------------------------------------------------------------------------
  // 7. PRODUK & RESEP KOMPOSISI (BILL OF MATERIALS)
  // ---------------------------------------------------------------------------
  const productsData = [
    {
      name: "Gantungan Kunci Huruf Resin Custom (Nama/Warna/Glitter)",
      sku: "PROD-GK-HURUF",
      categorySlug: "gantungan-kunci-resin",
      productionMode: ProductionMode.MADE_TO_ORDER,
      sellingPrice: 10000,
      costPrice: 2025, // (15 * 85) + (1 * 450) + (1 * 300) = 1275 + 450 + 300 = 2025
      currentStock: 0,
      minStockAlert: 0,
      description:
        "Gantungan kunci huruf inisial A-Z dengan custom foil emas, serpihan glitter, dan cetak nama di dalam resin.",
      bom: [
        { sku: "RM-RESIN-01", qty: 15, note: "Campuran resin & hardener 15ml per huruf" },
        { sku: "RM-RING-01", qty: 1, note: "1 set ring gantungan kunci nikel" },
        { sku: "RM-FOIL-01", qty: 1, note: "Foil emas & glitter dekoratif" },
      ],
    },
    {
      name: "Gantungan Kunci Shaker Resin Custom Premium",
      sku: "PROD-GK-SHAKER",
      categorySlug: "gantungan-kunci-resin",
      productionMode: ProductionMode.MADE_TO_ORDER,
      sellingPrice: 18000,
      costPrice: 3175, // (25 * 85) + (1 * 450) + (2 * 300) = 2125 + 450 + 600 = 3175
      currentStock: 0,
      minStockAlert: 0,
      description:
        "Gantungan kunci bentuk botol/bintang/hati dengan cairan shaker & manik-manik bergerak di dalamnya.",
      bom: [
        { sku: "RM-RESIN-01", qty: 25, note: "Resin cetakan shaker + penutup film 25ml" },
        { sku: "RM-RING-01", qty: 1, note: "1 set gantungan kunci" },
        { sku: "RM-FOIL-01", qty: 2, note: "Isian glitter & sequin shaker" },
      ],
    },
    {
      name: "Lilin Aromaterapi Gelas Kaca 60ml (Lavender Calming)",
      sku: "PROD-LILIN-LAV",
      categorySlug: "lilin-aromaterapi",
      productionMode: ProductionMode.STOCK_BASED,
      sellingPrice: 15000,
      costPrice: 7100, // (50 * 55) + (1 * 350) + (1 * 2200) + (4 * 450) = 2750 + 350 + 2200 + 1800 = 7100
      currentStock: 32,
      minStockAlert: 10,
      description:
        "Lilin aromaterapi soy wax alami dalam gelas sloki kaca 60ml, wangi French Lavender menenangkan.",
      bom: [
        { sku: "RM-SOYWAX-01", qty: 50, note: "50 gram soy wax per gelas" },
        { sku: "RM-SUMBU-01", qty: 1, note: "1 sumbu katun 10cm" },
        { sku: "RM-GLS-60ML", qty: 1, note: "1 gelas sloki kaca 60ml" },
        { sku: "RM-FO-LAV", qty: 4, note: "4 ml fragrance oil lavender (8%)" },
      ],
    },
    {
      name: "Lilin Aromaterapi Gelas Kaca 60ml (Vanilla Sweet)",
      sku: "PROD-LILIN-VAN",
      categorySlug: "lilin-aromaterapi",
      productionMode: ProductionMode.STOCK_BASED,
      sellingPrice: 15000,
      costPrice: 6980, // (50 * 55) + (1 * 350) + (1 * 2200) + (4 * 420) = 2750 + 350 + 2200 + 1680 = 6980
      currentStock: 6, // Di bawah minStockAlert (10) agar tampil di Peringatan Produk Perlu Dibuat
      minStockAlert: 10,
      description:
        "Lilin aromaterapi soy wax alami dalam gelas kaca 60ml dengan aroma Warm Vanilla manis & hangat.",
      bom: [
        { sku: "RM-SOYWAX-01", qty: 50, note: "50 gram soy wax per gelas" },
        { sku: "RM-SUMBU-01", qty: 1, note: "1 sumbu katun 10cm" },
        { sku: "RM-GLS-60ML", qty: 1, note: "1 gelas sloki kaca 60ml" },
        { sku: "RM-FO-VAN", qty: 4, note: "4 ml fragrance oil vanilla (8%)" },
      ],
    },
    {
      name: "Souvenir Pouch Kantong Serut Blacu Custom (10x15cm)",
      sku: "PROD-POUCH-BLACU",
      categorySlug: "souvenir-pouch-blacu",
      productionMode: ProductionMode.STOCK_BASED,
      sellingPrice: 5500,
      costPrice: 2480, // (0.125 * 16000) + (0.6 * 800) = 2000 + 480 = 2480
      currentStock: 75,
      minStockAlert: 20,
      description:
        "Pouch souvenir serut kain blacu ukuran 10x15cm, cocok untuk souvenir pernikahan, pengajian, dan hadiah.",
      bom: [
        { sku: "RM-BLACU-01", qty: 0.125, note: "1 meter kain menghasilkan 8 kantong pouch" },
        { sku: "RM-TALIKUR-01", qty: 0.6, note: "60 cm tali kur serut kanan-kiri" },
      ],
    },
    {
      name: "Casing HP Resin Bunga Kering Custom Nama",
      sku: "PROD-CASE-FLOWER",
      categorySlug: "casing-aksesoris-hp",
      productionMode: ProductionMode.MADE_TO_ORDER,
      sellingPrice: 35000,
      costPrice: 8525, // (1 * 5000) + (15 * 85) + (1 * 300) + (3 * 650) = 5000 + 1275 + 300 + 1950 = 8525
      currentStock: 0,
      minStockAlert: 0,
      description:
        "Casing ponsel transparan dengan rangkaian bunga kering asli yang diawetkan dalam resin bening & custom nama.",
      bom: [
        { sku: "RM-CASE-CLR", qty: 1, note: "1 casing polos anticrack sesuai tipe HP" },
        { sku: "RM-RESIN-01", qty: 15, note: "15 ml resin coating pelapis bunga" },
        { sku: "RM-FOIL-01", qty: 1, note: "Foil emas & aksen glitter" },
        { sku: "RM-BUNGA-01", qty: 3, note: "3 kuntum bunga kering pres" },
      ],
    },
    {
      name: "Phone Strap / Gantungan HP Manik & Charm Resin",
      sku: "PROD-STRAP-RESIN",
      categorySlug: "casing-aksesoris-hp",
      productionMode: ProductionMode.STOCK_BASED,
      sellingPrice: 12000,
      costPrice: 2325, // (10 * 85) + (1 * 450) + (1 * 300) + (0.5 * 800) + (0.5 * 650) = 850 + 450 + 300 + 400 + 325 = 2325
      currentStock: 22,
      minStockAlert: 8,
      description:
        "Gantungan tali HP estetik dengan charm mini resin bunga kering dan inisial huruf.",
      bom: [
        { sku: "RM-RESIN-01", qty: 10, note: "10 ml resin untuk mini charm" },
        { sku: "RM-RING-01", qty: 1, note: "Ring pengait & konektor" },
        { sku: "RM-FOIL-01", qty: 1, note: "Glitter pastel" },
        { sku: "RM-TALIKUR-01", qty: 0.5, note: "Tali pengait HP 50cm" },
        { sku: "RM-BUNGA-01", qty: 0.5, note: "Kelopak bunga mini" },
      ],
    },
  ];

  const productMap = new Map<
    string,
    {
      id: string;
      name: string;
      sku: string;
      sellingPrice: number;
      costPrice: number;
      productionMode: ProductionMode;
    }
  >();

  for (const p of productsData) {
    const categoryId = categoryMap.get(p.categorySlug)!;
    const product = await prisma.product.create({
      data: {
        name: p.name,
        sku: p.sku,
        categoryId,
        productionMode: p.productionMode,
        sellingPrice: p.sellingPrice,
        costPrice: p.costPrice,
        currentStock: p.currentStock,
        minStockAlert: p.minStockAlert,
        isActive: true,
        description: p.description,
      },
    });

    productMap.set(p.sku, {
      id: product.id,
      name: product.name,
      sku: p.sku,
      sellingPrice: p.sellingPrice,
      costPrice: p.costPrice,
      productionMode: p.productionMode,
    });

    for (const item of p.bom) {
      const rm = rawMaterialMap.get(item.sku)!;
      await prisma.billOfMaterial.create({
        data: {
          productId: product.id,
          rawMaterialId: rm.id,
          quantityNeeded: item.qty,
          notes: item.note,
        },
      });
    }
  }
  console.log(`✓ Produk & Resep BOM: ${productMap.size} produk kerajinan`);

  // ---------------------------------------------------------------------------
  // 8. RIWAYAT PRODUKSI BATCH (PRODUCTION RUNS)
  // ---------------------------------------------------------------------------
  const productionRunsData = [
    {
      productSku: "PROD-LILIN-LAV",
      quantityMade: 20,
      unitCost: 7100,
      productionDate: dateInCurrentMonth(now, 5, 6),
      notes: "Produksi batch rutin stok lilin lavender akhir pekan",
      createdById: staffId,
    },
    {
      productSku: "PROD-POUCH-BLACU",
      quantityMade: 50,
      unitCost: 2480,
      productionDate: dateInCurrentMonth(now, 4, 5),
      notes: "Jahit & pasang tali serut 50 pcs pouch blacu",
      createdById: staffId,
    },
    {
      productSku: "PROD-STRAP-RESIN",
      quantityMade: 15,
      unitCost: 2325,
      productionDate: dateInCurrentMonth(now, 3, 4),
      notes: "Cetak charm resin & rangkai phone strap pastel",
      createdById: ownerId,
    },
    {
      productSku: "PROD-LILIN-LAV",
      quantityMade: 15,
      unitCost: 7100,
      productionDate: dateInCurrentMonth(now, 1, 5),
      notes: "Restock cepat lilin lavender untuk pesanan Shopee",
      createdById: staffId,
    },
  ];

  for (const run of productionRunsData) {
    const prod = productMap.get(run.productSku)!;
    const totalCost = run.quantityMade * run.unitCost;

    const createdRun = await prisma.productionRun.create({
      data: {
        productId: prod.id,
        quantityMade: run.quantityMade,
        totalCost,
        unitCost: run.unitCost,
        productionDate: run.productionDate,
        notes: run.notes,
        createdById: run.createdById,
        createdAt: run.productionDate,
      },
    });

    await prisma.stockMutation.create({
      data: {
        itemType: ItemType.FINISHED_PRODUCT,
        productId: prod.id,
        mutationType: MutationType.PRODUCTION_IN,
        quantity: run.quantityMade,
        previousStock: 10,
        newStock: 10 + run.quantityMade,
        referenceType: "PRODUCTION",
        referenceId: createdRun.id,
        notes: `Hasil produksi batch selesai (${run.quantityMade} pcs @ Rp ${run.unitCost.toLocaleString("id-ID")})`,
        createdById: run.createdById,
        createdAt: run.productionDate,
      },
    });
  }
  console.log(`✓ Riwayat Produksi Batch: ${productionRunsData.length} batch`);

  // ---------------------------------------------------------------------------
  // 9. RIWAYAT PEMBELIAN BAHAN BAKU (PURCHASES)
  // ---------------------------------------------------------------------------
  const purchasesData = [
    {
      purchaseNumber: "PB-202611-0001-RSN",
      supplierName: "CV Kimia Resin Art Surabaya",
      purchaseDate: dateInCurrentMonth(now, 5, 8),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      notes: "Restock resin bening 1 liter & ring gantungan kunci",
      items: [
        { sku: "RM-RESIN-01", quantity: 1000, unitCost: 85 },
        { sku: "RM-RING-01", quantity: 150, unitCost: 450 },
        { sku: "RM-FOIL-01", quantity: 80, unitCost: 300 },
      ],
    },
    {
      purchaseNumber: "PB-202611-0002-WAX",
      supplierName: "Grosir Candle Supply Malang",
      purchaseDate: dateInCurrentMonth(now, 4, 7),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      notes: "Belanja soy wax, gelas sloki 60ml, dan fragrance oil",
      items: [
        { sku: "RM-SOYWAX-01", quantity: 1500, unitCost: 55 },
        { sku: "RM-GLS-60ML", quantity: 50, unitCost: 2200 },
        { sku: "RM-FO-VAN", quantity: 100, unitCost: 420 },
      ],
    },
    {
      purchaseNumber: "PB-202611-0003-TXT",
      supplierName: "UD Tekstil Blacu & Tali Solo",
      purchaseDate: dateInCurrentMonth(now, 2, 6),
      paymentMethod: PaymentMethod.QRIS,
      notes: "Pembelian kain blacu gulungan & tali kur katun",
      items: [
        { sku: "RM-BLACU-01", quantity: 20, unitCost: 16000 },
        { sku: "RM-TALIKUR-01", quantity: 100, unitCost: 800 },
      ],
    },
    {
      purchaseNumber: "PB-202611-0004-FLW",
      supplierName: "Florist Dried Craft Batu",
      purchaseDate: dateInCurrentMonth(now, 1, 4),
      paymentMethod: PaymentMethod.SHOPEE_PAY,
      notes: "Beli bunga kering pres & sumbu lilin katun",
      items: [
        { sku: "RM-BUNGA-01", quantity: 100, unitCost: 650 },
        { sku: "RM-SUMBU-01", quantity: 200, unitCost: 350 },
      ],
    },
  ];

  for (const pur of purchasesData) {
    const itemsWithSubtotal = pur.items.map((it) => {
      const rm = rawMaterialMap.get(it.sku)!;
      const subtotal = Math.round(it.quantity * it.unitCost);
      return {
        rawMaterialId: rm.id,
        quantity: it.quantity,
        unitCost: it.unitCost,
        subtotal,
      };
    });

    const totalAmount = itemsWithSubtotal.reduce((sum, i) => sum + i.subtotal, 0);

    const createdPur = await prisma.purchase.create({
      data: {
        purchaseNumber: pur.purchaseNumber,
        supplierName: pur.supplierName,
        purchaseDate: pur.purchaseDate,
        totalAmount,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: pur.paymentMethod,
        notes: pur.notes,
        createdById: ownerId,
        createdAt: pur.purchaseDate,
        purchaseItems: {
          create: itemsWithSubtotal,
        },
      },
    });

    for (const item of itemsWithSubtotal) {
      await prisma.stockMutation.create({
        data: {
          itemType: ItemType.RAW_MATERIAL,
          rawMaterialId: item.rawMaterialId,
          mutationType: MutationType.PURCHASE_IN,
          quantity: item.quantity,
          previousStock: 100,
          newStock: 100 + item.quantity,
          referenceType: "PURCHASE",
          referenceId: createdPur.id,
          notes: `Pembelian bahan baku #${pur.purchaseNumber} (${pur.supplierName})`,
          createdById: ownerId,
          createdAt: pur.purchaseDate,
        },
      });
    }
  }
  console.log(`✓ Riwayat Pembelian Bahan Baku: ${purchasesData.length} transaksi`);

  // ---------------------------------------------------------------------------
  // 10. BEBAN OPERASIONAL STUDIO (EXPENSES)
  // ---------------------------------------------------------------------------
  const expensesData = [
    {
      expenseNumber: "EXP-202611-0001-PKG",
      categoryName: "Kemasan & Packaging (Box, Bubble Wrap, Kartu)",
      title: "Beli Box Die-Cut Kraft, Bubble Wrap 50m & Stiker Segel",
      amount: 145000,
      expenseDate: dateInCurrentMonth(now, 5, 3),
      paymentMethod: PaymentMethod.QRIS,
      notes: "Stok kemasan paket Shopee & gift box untuk 1 bulan",
    },
    {
      expenseNumber: "EXP-202611-0002-UTL",
      categoryName: "Listrik, Air & Operasional Studio",
      title: "Token Listrik Studio Produksi & Kuota Internet Kasir",
      amount: 185000,
      expenseDate: dateInCurrentMonth(now, 4, 4),
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      notes: "Listrik pemanas wax, UV curing lamp, dan Wi-Fi",
    },
    {
      expenseNumber: "EXP-202611-0003-ADS",
      categoryName: "Biaya Layanan & Iklan Shopee",
      title: "Top Up Saldo Iklan Shopee Kata Kunci Gantungan Kunci & Souvenir",
      amount: 120000,
      expenseDate: dateInCurrentMonth(now, 3, 5),
      paymentMethod: PaymentMethod.SHOPEE_PAY,
      notes: "Promosi produk custom huruf resin & lilin aromaterapi",
    },
    {
      expenseNumber: "EXP-202611-0004-TLS",
      categoryName: "Peralatan Produksi & Cetakan",
      title: "Beli 2 Cetakan Silikon Alfabet Baru & Gelas Takar Silikon",
      amount: 85000,
      expenseDate: dateInCurrentMonth(now, 2, 3),
      paymentMethod: PaymentMethod.SHOPEE_PAY,
      notes: "Penggantian cetakan huruf A-Z yang mulai aus",
    },
    {
      expenseNumber: "EXP-202611-0005-SHP",
      categoryName: "Ongkir Talangan & Pengiriman",
      title: "Bensin & Pick-up Antar Paket Kargo Souvenir ke Agen Ekspedisi",
      amount: 45000,
      expenseDate: dateInCurrentMonth(now, 1, 2),
      paymentMethod: PaymentMethod.CASH,
      notes: "Pengiriman 2 karung pesanan souvenir pernikahan",
    },
    {
      expenseNumber: "EXP-202611-0006-MSC",
      categoryName: "Lain-lain / Operasional Tak Terduga",
      title: "Konsumsi Lembur Tim Packing Pesanan Tanggal Kembar",
      amount: 50000,
      expenseDate: dateInCurrentMonth(now, 0, 4),
      paymentMethod: PaymentMethod.CASH,
      notes: "Makan sore lembur packing 35 resi pesanan",
    },
  ];

  for (const exp of expensesData) {
    const categoryId = expenseCategoryMap.get(exp.categoryName)!;
    await prisma.expense.create({
      data: {
        expenseNumber: exp.expenseNumber,
        categoryId,
        title: exp.title,
        amount: exp.amount,
        expenseDate: exp.expenseDate,
        paymentMethod: exp.paymentMethod,
        notes: exp.notes,
        createdById: ownerId,
        createdAt: exp.expenseDate,
      },
    });
  }
  console.log(`✓ Beban Operasional Studio: ${expensesData.length} catatan pengeluaran`);

  // ---------------------------------------------------------------------------
  // 11. SHOPEE PRODUCT MAPPINGS & IMPORT LOGS
  // ---------------------------------------------------------------------------
  const shopeeMappingsData = [
    {
      shopeeProductName: "Custom Gantungan Kunci Huruf Resin Inisial Nama Glitter Gold",
      shopeeVariation: "Huruf + Nama",
      productSku: "PROD-GK-HURUF",
    },
    {
      shopeeProductName: "Keychain Shaker Resin Custom Nama Liquid Glitter Lucu",
      shopeeVariation: "Pink Pastel",
      productSku: "PROD-GK-SHAKER",
    },
    {
      shopeeProductName: "Scented Candle Lilin Aromaterapi 60ml Soy Wax Souvenir",
      shopeeVariation: "Lavender Calming",
      productSku: "PROD-LILIN-LAV",
    },
    {
      shopeeProductName: "Scented Candle Lilin Aromaterapi 60ml Soy Wax Souvenir",
      shopeeVariation: "Vanilla Sweet",
      productSku: "PROD-LILIN-VAN",
    },
    {
      shopeeProductName: "Souvenir Pouch Serut Kain Blacu Custom Sablon 10x15cm",
      shopeeVariation: "10x15cm Natural",
      productSku: "PROD-POUCH-BLACU",
    },
    {
      shopeeProductName: "Custom Case HP Resin Bunga Kering Asli Pressed Flower",
      shopeeVariation: "Custom Tipe HP + Nama",
      productSku: "PROD-CASE-FLOWER",
    },
    {
      shopeeProductName: "Phone Strap Manik Aesthetic Charm Huruf Resin",
      shopeeVariation: "Mix Pastel",
      productSku: "PROD-STRAP-RESIN",
    },
  ];

  for (const m of shopeeMappingsData) {
    const prod = productMap.get(m.productSku)!;
    await prisma.shopeeProductMapping.create({
      data: {
        shopeeProductName: m.shopeeProductName,
        shopeeVariation: m.shopeeVariation,
        mappedProductId: prod.id,
        confidenceScore: 1.0,
        isVerified: true,
      },
    });
  }

  const importLog1 = await prisma.shopeeImportLog.create({
    data: {
      fileName: "Income.sudah dilepas.id.202611_pekan1.xlsx",
      fileSize: 48620,
      totalRows: 8,
      importedCount: 4,
      skippedDuplicateCount: 0,
      failedCount: 0,
      status: ImportStatus.SUCCESS,
      createdById: ownerId,
      createdAt: dateInCurrentMonth(now, 3, 2),
    },
  });

  const importLog2 = await prisma.shopeeImportLog.create({
    data: {
      fileName: "Order.completed.202611_terbaru.xlsx",
      fileSize: 62410,
      totalRows: 10,
      importedCount: 4,
      skippedDuplicateCount: 1,
      failedCount: 0,
      status: ImportStatus.SUCCESS,
      createdById: staffId,
      createdAt: subHours(now, 2),
    },
  });
  console.log("✓ Mapping Produk Shopee & Log Riwayat Impor siap");

  // ---------------------------------------------------------------------------
  // 12. TRANSAKSI PENJUALAN (ORDERS & ORDER ITEMS) - 7 HARI TERAKHIR & BULAN INI
  // ---------------------------------------------------------------------------
  const ordersData = [
    // Hari ke-6 lalu
    {
      orderNumber: "SHP-2610319K8M2P",
      externalOrderSn: "2610319K8M2P",
      channel: SalesChannel.SHOPEE,
      customerName: "Nadia Putri Maharani",
      customerPhone: "081234567801",
      customerAddress: "Jl. Pahlawan No. 42, Kec. Kartoharjo, Kota Madiun, Jawa Timur",
      orderDate: subHours(subDays(now, 6), 4),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.SHOPEE_PAY,
      discountAmount: 0,
      shippingFee: 0,
      platformFee: 8500,
      importLogId: importLog1.id,
      notes: "Kurir: SPX Standard - Kemas aman bubble wrap tebal",
      items: [
        {
          sku: "PROD-GK-HURUF",
          quantity: 12,
          unitPrice: 10000,
          variantName: "Huruf + Nama",
          customNote: "Huruf A, N, D, R, S, F (2 set) warna Rose Gold + Foil Emas",
        },
        {
          sku: "PROD-LILIN-LAV",
          quantity: 4,
          unitPrice: 15000,
          variantName: "Lavender Calming",
          customNote: "Pita kartu ucapan Happy Graduation",
        },
      ],
    },
    // Hari ke-5 lalu
    {
      orderNumber: "CBH-202611-0001-OFL",
      externalOrderSn: null,
      channel: SalesChannel.OFFLINE,
      customerName: "Ibu Rina Sulistyowati",
      customerPhone: "085732109844",
      customerAddress: "Jl. Samudra No. 18, Kec. Magetan, Kab. Magetan, Jawa Timur",
      orderDate: dateInCurrentMonth(now, 5, 5),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.CASH,
      discountAmount: 10000,
      shippingFee: 0,
      platformFee: 0,
      importLogId: null,
      notes: "Pembelian langsung di studio untuk souvenir arisan keluarga",
      items: [
        {
          sku: "PROD-POUCH-BLACU",
          quantity: 40,
          unitPrice: 5500,
          variantName: "10x15cm Natural",
          customNote: "Sablon nama Keluarga Besar Bpk. H. Суpratman",
        },
      ],
    },
    {
      orderNumber: "SHP-2611017H4T9Q",
      externalOrderSn: "2611017H4T9Q",
      channel: SalesChannel.SHOPEE,
      customerName: "Amelia Kusuma Wardhani",
      customerPhone: "081398765412",
      customerAddress: "Perum Griya Asri Blok C-12, Kec. Ponorogo, Kab. Ponorogo, Jawa Timur",
      orderDate: dateInCurrentMonth(now, 5, 2),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.SHOPEE_PAY,
      discountAmount: 0,
      shippingFee: 0,
      platformFee: 6200,
      importLogId: importLog1.id,
      notes: "Kurir: J&T Express",
      items: [
        {
          sku: "PROD-CASE-FLOWER",
          quantity: 2,
          unitPrice: 35000,
          variantName: "iPhone 13 & Samsung A54",
          customNote: "Bunga daisy putih + nama 'Amel' & 'Rani' font kaligrafi gold",
        },
        {
          sku: "PROD-STRAP-RESIN",
          quantity: 3,
          unitPrice: 12000,
          variantName: "Mix Pastel",
          customNote: "Charm huruf A, R, M warna lilac",
        },
      ],
    },
    // Hari ke-4 lalu
    {
      orderNumber: "CBH-202611-0002-WA",
      externalOrderSn: null,
      channel: SalesChannel.WHATSAPP,
      customerName: "Dinda Ayu Lestari (Panitia Kampus)",
      customerPhone: "082145678923",
      customerAddress: "Jl. Raya Sarangan KM 5, Kec. Plaosan, Kab. Magetan, Jawa Timur",
      orderDate: dateInCurrentMonth(now, 4, 6),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      discountAmount: 15000,
      shippingFee: 15000,
      platformFee: 0,
      importLogId: null,
      notes: "Pesanan WhatsApp merchandise seminar kampus",
      items: [
        {
          sku: "PROD-GK-HURUF",
          quantity: 25,
          unitPrice: 10000,
          variantName: "Inisial Panitia",
          customNote: "25 huruf sesuai daftar Excel WA, glitter biru laut & silver",
        },
      ],
    },
    {
      orderNumber: "SHP-2611023W5L8N",
      externalOrderSn: "2611023W5L8N",
      channel: SalesChannel.SHOPEE,
      customerName: "Farhan Rizky Pratama",
      customerPhone: "085267891234",
      customerAddress: "Jl. Gubeng Kertajaya VII No. 11, Kota Surabaya, Jawa Timur",
      orderDate: dateInCurrentMonth(now, 4, 2),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.SHOPEE_PAY,
      discountAmount: 0,
      shippingFee: 0,
      platformFee: 7800,
      importLogId: importLog1.id,
      notes: "Kurir: SiCepat Reguler",
      items: [
        {
          sku: "PROD-LILIN-LAV",
          quantity: 5,
          unitPrice: 15000,
          variantName: "Lavender Calming",
          customNote: "Hampers kado ulang tahun sahabat",
        },
        {
          sku: "PROD-LILIN-VAN",
          quantity: 5,
          unitPrice: 15000,
          variantName: "Vanilla Sweet",
          customNote: "Tambahkan stiker custom Happy Birthday",
        },
      ],
    },
    // Hari ke-3 lalu
    {
      orderNumber: "SHP-2611038P2X4V",
      externalOrderSn: "2611038P2X4V",
      channel: SalesChannel.SHOPEE,
      customerName: "Clarissa Aurelia",
      customerPhone: "081923456781",
      customerAddress: "Jl. Slamet Riyadi No. 210, Kota Surakarta (Solo), Jawa Tengah",
      orderDate: dateInCurrentMonth(now, 3, 5),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.SHOPEE_PAY,
      discountAmount: 0,
      shippingFee: 0,
      platformFee: 5400,
      importLogId: importLog1.id,
      notes: "Kurir: SPX Standard",
      items: [
        {
          sku: "PROD-GK-SHAKER",
          quantity: 5,
          unitPrice: 18000,
          variantName: "Pink Pastel",
          customNote: "Bentuk bintang cairan pink, nama: Clara, Tasya, Vina, Mei, Nia",
        },
      ],
    },
    {
      orderNumber: "CBH-202611-0003-OFL",
      externalOrderSn: null,
      channel: SalesChannel.OFFLINE,
      customerName: "Mbak Zahra Nurhaliza",
      customerPhone: "087812349087",
      customerAddress: "Ds. Sukowidi, Kec. Kartoharjo, Kab. Magetan, Jawa Timur",
      orderDate: dateInCurrentMonth(now, 3, 2),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.QRIS,
      discountAmount: 0,
      shippingFee: 0,
      platformFee: 0,
      importLogId: null,
      notes: "Ambil langsung ke galeri CraftByHanifa",
      items: [
        {
          sku: "PROD-CASE-FLOWER",
          quantity: 2,
          unitPrice: 35000,
          variantName: "iPhone 14 Pro & iPhone 11",
          customNote: "Tema bunga ungu lavender + nama 'Zahra'",
        },
        {
          sku: "PROD-LILIN-LAV",
          quantity: 2,
          unitPrice: 15000,
          variantName: "Lavender Calming",
          customNote: null,
        },
      ],
    },
    // Hari ke-2 lalu
    {
      orderNumber: "SHP-2611046M9C1B",
      externalOrderSn: "2611046M9C1B",
      channel: SalesChannel.SHOPEE,
      customerName: "Sinta Dewi Anggraini",
      customerPhone: "081287654329",
      customerAddress: "Jl. Kaliurang KM 7, Kec. Depok, Kab. Sleman, DI Yogyakarta",
      orderDate: dateInCurrentMonth(now, 2, 6),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.SHOPEE_PAY,
      discountAmount: 0,
      shippingFee: 0,
      platformFee: 11200,
      importLogId: importLog2.id,
      notes: "Kurir: J&T Cargo - Pesanan paket souvenir pengajian pernikahan",
      items: [
        {
          sku: "PROD-POUCH-BLACU",
          quantity: 30,
          unitPrice: 5500,
          variantName: "10x15cm Natural",
          customNote: "Sablon The Wedding of Sinta & Bagas - 15 Nov 2026",
        },
        {
          sku: "PROD-GK-HURUF",
          quantity: 10,
          unitPrice: 10000,
          variantName: "Huruf + Nama",
          customNote: "Inisial Bridesmaid huruf S, D, A, K, L, M, P, R, T, Y warna Rose Gold",
        },
      ],
    },
    {
      orderNumber: "CBH-202611-0004-WA",
      externalOrderSn: null,
      channel: SalesChannel.WHATSAPP,
      customerName: "Ibu Rina Sulistyowati",
      customerPhone: "085732109844",
      customerAddress: "Jl. Samudra No. 18, Kec. Magetan, Kab. Magetan, Jawa Timur",
      orderDate: dateInCurrentMonth(now, 2, 2),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      discountAmount: 0,
      shippingFee: 0,
      platformFee: 0,
      importLogId: null,
      notes: "Repeat order Ibu Rina tambah lilin aromaterapi & strap HP",
      items: [
        {
          sku: "PROD-LILIN-LAV",
          quantity: 6,
          unitPrice: 15000,
          variantName: "Lavender Calming",
          customNote: "Bungkus tile pita pink",
        },
        {
          sku: "PROD-STRAP-RESIN",
          quantity: 4,
          unitPrice: 12000,
          variantName: "Mix Pastel",
          customNote: null,
        },
      ],
    },
    // Hari ke-1 lalu (Kemarin)
    {
      orderNumber: "SHP-2611054R7J3D",
      externalOrderSn: "2611054R7J3D",
      channel: SalesChannel.SHOPEE,
      customerName: "Kezia Aurel Natasya",
      customerPhone: "081345672190",
      customerAddress: "Jl. Soekarno Hatta No. 88, Kec. Lowokwaru, Kota Malang, Jawa Timur",
      orderDate: dateInCurrentMonth(now, 1, 6),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.SHOPEE_PAY,
      discountAmount: 0,
      shippingFee: 0,
      platformFee: 7500,
      importLogId: importLog2.id,
      notes: "Kurir: SPX Standard",
      items: [
        {
          sku: "PROD-GK-SHAKER",
          quantity: 4,
          unitPrice: 18000,
          variantName: "Pink Pastel",
          customNote: "Custom nama: Kezia, Celine, Audrey, Jessy + manik bintang",
        },
        {
          sku: "PROD-STRAP-RESIN",
          quantity: 5,
          unitPrice: 12000,
          variantName: "Mix Pastel",
          customNote: "Charm bunga sakura pink",
        },
      ],
    },
    {
      orderNumber: "CBH-202611-0005-OFL",
      externalOrderSn: null,
      channel: SalesChannel.OFFLINE,
      customerName: "Bpk. Hendra Wijaya",
      customerPhone: "081134567890",
      customerAddress: "Jl. Ahmad Yani No. 55, Kec. Magetan, Kab. Magetan, Jawa Timur",
      orderDate: dateInCurrentMonth(now, 1, 2),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.CASH,
      discountAmount: 5000,
      shippingFee: 0,
      platformFee: 0,
      importLogId: null,
      notes: "Beli kado hampers dan gantungan kunci custom keluarga",
      items: [
        {
          sku: "PROD-LILIN-VAN",
          quantity: 4,
          unitPrice: 15000,
          variantName: "Vanilla Sweet",
          customNote: "Box hampers pita gold",
        },
        {
          sku: "PROD-GK-HURUF",
          quantity: 6,
          unitPrice: 10000,
          variantName: "Huruf + Nama",
          customNote: "Huruf H, W, A, B, C, D warna hijau zamrud & gold leaf",
        },
      ],
    },
    // HARI INI (Today) - 3 Pesanan agar KPI Hari Ini & Pesanan Terbaru langsung hidup!
    {
      orderNumber: "SHP-2611069Z1K5L",
      externalOrderSn: "2611069Z1K5L",
      channel: SalesChannel.SHOPEE,
      customerName: "Tiara Maharani Putri",
      customerPhone: "085643218976",
      customerAddress: "Jl. Diponegoro No. 31, Kec. Taman, Kota Madiun, Jawa Timur",
      orderDate: subHours(now, 3),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.SHOPEE_PAY,
      discountAmount: 0,
      shippingFee: 0,
      platformFee: 6800,
      importLogId: importLog2.id,
      notes: "Kurir: SPX Instant - Pesanan kado wisuda",
      items: [
        {
          sku: "PROD-CASE-FLOWER",
          quantity: 2,
          unitPrice: 35000,
          variantName: "iPhone 15 & iPhone 13",
          customNote: "Bunga baby breath pink & putih + nama 'Tiara, S.Psi'",
        },
        {
          sku: "PROD-GK-HURUF",
          quantity: 5,
          unitPrice: 10000,
          variantName: "Huruf + Nama",
          customNote: "Huruf T, M, P, R, N tema pastel ungu",
        },
      ],
    },
    {
      orderNumber: "CBH-202611-0006-OFL",
      externalOrderSn: null,
      channel: SalesChannel.OFFLINE,
      customerName: "Kak Nabila Syakieb (Walk-in Studio)",
      customerPhone: "082233445566",
      customerAddress: "Jl. Hasanudin No. 12, Kec. Ngariboyo, Kab. Magetan, Jawa Timur",
      orderDate: subHours(now, 2),
      status: OrderStatus.COMPLETED,
      paymentMethod: PaymentMethod.QRIS,
      discountAmount: 0,
      shippingFee: 0,
      platformFee: 0,
      importLogId: null,
      notes: "Transaksi kasir toko fisik siang ini",
      items: [
        {
          sku: "PROD-LILIN-LAV",
          quantity: 4,
          unitPrice: 15000,
          variantName: "Lavender Calming",
          customNote: "Kartu ucapan Terima Kasih Guru",
        },
        {
          sku: "PROD-STRAP-RESIN",
          quantity: 3,
          unitPrice: 12000,
          variantName: "Mix Pastel",
          customNote: "Inisial N, S, A warna pink glitter",
        },
      ],
    },
    {
      orderNumber: "SHP-2611068Q4W7E",
      externalOrderSn: "2611068Q4W7E",
      channel: SalesChannel.SHOPEE,
      customerName: "Nadia Putri Maharani",
      customerPhone: "081234567801",
      customerAddress: "Jl. Pahlawan No. 42, Kec. Kartoharjo, Kota Madiun, Jawa Timur",
      orderDate: subHours(now, 1),
      status: OrderStatus.PROCESSING,
      paymentMethod: PaymentMethod.SHOPEE_PAY,
      discountAmount: 0,
      shippingFee: 0,
      platformFee: 5200,
      importLogId: importLog2.id,
      notes: "Sedang dicetak resin (proses curing)",
      items: [
        {
          sku: "PROD-GK-SHAKER",
          quantity: 3,
          unitPrice: 18000,
          variantName: "Pink Pastel",
          customNote: "Shaker bentuk hati custom nama 'Nadia', 'Raka', 'Dina'",
        },
        {
          sku: "PROD-POUCH-BLACU",
          quantity: 10,
          unitPrice: 5500,
          variantName: "10x15cm Natural",
          customNote: "Polos tanpa sablon untuk bungkus kado",
        },
      ],
    },
  ];

  for (const ord of ordersData) {
    const orderItemsPayload = ord.items.map((it) => {
      const prod = productMap.get(it.sku)!;
      const subtotal = it.quantity * it.unitPrice;
      return {
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        variantName: it.variantName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal,
        unitHpp: prod.costPrice,
        customNote: it.customNote,
      };
    });

    const subtotalAmount = orderItemsPayload.reduce((sum, i) => sum + i.subtotal, 0);
    const totalHppAmount = orderItemsPayload.reduce(
      (sum, i) => sum + i.unitHpp * i.quantity,
      0
    );
    const totalAmount =
      subtotalAmount - ord.discountAmount + ord.shippingFee - ord.platformFee;
    const netMarginAmount = totalAmount - totalHppAmount;

    const createdOrder = await prisma.order.create({
      data: {
        orderNumber: ord.orderNumber,
        channel: ord.channel,
        externalOrderSn: ord.externalOrderSn,
        customerName: ord.customerName,
        customerPhone: ord.customerPhone,
        customerAddress: ord.customerAddress,
        orderDate: ord.orderDate,
        status: ord.status,
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: ord.paymentMethod,
        subtotalAmount,
        discountAmount: ord.discountAmount,
        shippingFee: ord.shippingFee,
        platformFee: ord.platformFee,
        totalAmount,
        totalHppAmount,
        netMarginAmount,
        notes: ord.notes,
        importLogId: ord.importLogId,
        createdAt: ord.orderDate,
        orderItems: {
          create: orderItemsPayload,
        },
      },
    });

    for (const item of orderItemsPayload) {
      await prisma.stockMutation.create({
        data: {
          itemType: ItemType.FINISHED_PRODUCT,
          productId: item.productId,
          mutationType: MutationType.SALE_OUT,
          quantity: item.quantity,
          previousStock: 40,
          newStock: Math.max(0, 40 - item.quantity),
          referenceType: "ORDER",
          referenceId: createdOrder.id,
          notes: `Penjualan ${ord.channel} faktur #${ord.orderNumber}`,
          createdById: ord.channel === SalesChannel.OFFLINE ? staffId : ownerId,
          createdAt: ord.orderDate,
        },
      });
    }
  }
  console.log(`✓ Transaksi Penjualan (Shopee, Offline, WhatsApp): ${ordersData.length} pesanan`);

  console.log("\n✅ Seeding database CraftByHanifa selesai dengan sempurna!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
