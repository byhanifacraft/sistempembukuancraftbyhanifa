import "dotenv/config";
import { PrismaClient, ProductionMode, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/postgres";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting CraftByHanifa Database Seed...");

  // 1. Create Default Owner User
  const owner = await prisma.user.upsert({
    where: { email: "owner@craftbyhanifa.com" },
    update: {},
    create: {
      email: "owner@craftbyhanifa.com",
      name: "Hanifa (Pemilik Usaha)",
      role: UserRole.OWNER,
    },
  });
  console.log("✓ Created Owner User:", owner.email);

  // 2. Units
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
  console.log("✓ Created Units:", unitMap.size);

  // 3. Categories
  const categoriesData = [
    { name: "Gantungan Kunci Resin", slug: "gantungan-kunci-resin", description: "Gantungan kunci custom huruf, nama, glitter, dan shaker resin" },
    { name: "Lilin Aromaterapi & Souvenir", slug: "lilin-aromaterapi", description: "Lilin wangi soy wax souvenir gelas sloki & tungku keramik" },
    { name: "Souvenir & Hadiah Pouch", slug: "souvenir-pouch-blacu", description: "Kantong serut kain blacu / drill custom sablon nama/motif" },
    { name: "Casing & Skin HP", slug: "casing-skin-hp", description: "Casing ponsel custom resin bunga kering & glitter" },
  ];

  const categoryMap = new Map<string, string>();
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: c,
    });
    categoryMap.set(c.slug, cat.id);
  }
  console.log("✓ Created Categories:", categoryMap.size);

  // 4. Raw Materials
  const rawMaterialsData = [
    { name: "Resin Epoxy Bening & Hardener (1:1)", sku: "RM-RESIN-01", unitSymbol: "ml", currentStock: 2500, minimumStock: 500, avgCostPerUnit: 85, lastCostPerUnit: 85 },
    { name: "Ring Kunci Nikel + Rantai Pipih", sku: "RM-RING-01", unitSymbol: "pcs", currentStock: 350, minimumStock: 50, avgCostPerUnit: 450, lastCostPerUnit: 450 },
    { name: "Foil Emas & Serpihan Glitter", sku: "RM-FOIL-01", unitSymbol: "g", currentStock: 200, minimumStock: 30, avgCostPerUnit: 300, lastCostPerUnit: 300 },
    { name: "Soy Wax Kedelai Natural Grade A", sku: "RM-SOYWAX-01", unitSymbol: "g", currentStock: 5000, minimumStock: 1000, avgCostPerUnit: 55, lastCostPerUnit: 55 },
    { name: "Sumbu Lilin Katun 10cm + Tab Dasar", sku: "RM-SUMBU-01", unitSymbol: "pcs", currentStock: 400, minimumStock: 80, avgCostPerUnit: 350, lastCostPerUnit: 350 },
    { name: "Gelas Sloki Kaca Tebal 60ml", sku: "RM-GLS-60ML", unitSymbol: "pcs", currentStock: 150, minimumStock: 30, avgCostPerUnit: 2200, lastCostPerUnit: 2200 },
    { name: "Fragrance Oil Lavender Premium", sku: "RM-FO-LAV", unitSymbol: "ml", currentStock: 500, minimumStock: 100, avgCostPerUnit: 450, lastCostPerUnit: 450 },
    { name: "Kain Blacu Katun Tebal", sku: "RM-BLACU-01", unitSymbol: "m", currentStock: 25, minimumStock: 5, avgCostPerUnit: 16000, lastCostPerUnit: 16000 },
    { name: "Tali Kur Katun 4mm", sku: "RM-TALIKUR-01", unitSymbol: "m", currentStock: 100, minimumStock: 20, avgCostPerUnit: 800, lastCostPerUnit: 800 },
    { name: "Casing HP Polos Bening TPU", sku: "RM-CASE-CLR", unitSymbol: "pcs", currentStock: 45, minimumStock: 10, avgCostPerUnit: 5000, lastCostPerUnit: 5000 },
  ];

  const rawMaterialMap = new Map<string, string>();
  for (const rm of rawMaterialsData) {
    const unitId = unitMap.get(rm.unitSymbol)!;
    const material = await prisma.rawMaterial.upsert({
      where: { sku: rm.sku },
      update: {
        name: rm.name,
        currentStock: rm.currentStock,
        minimumStock: rm.minimumStock,
        avgCostPerUnit: rm.avgCostPerUnit,
        lastCostPerUnit: rm.lastCostPerUnit,
        unitId,
      },
      create: {
        name: rm.name,
        sku: rm.sku,
        unitId,
        currentStock: rm.currentStock,
        minimumStock: rm.minimumStock,
        avgCostPerUnit: rm.avgCostPerUnit,
        lastCostPerUnit: rm.lastCostPerUnit,
      },
    });
    rawMaterialMap.set(rm.sku, material.id);
  }
  console.log("✓ Created Raw Materials:", rawMaterialMap.size);

  // 5. Products & BOMs
  const productsData = [
    {
      name: "Gantungan Kunci Huruf Resin Custom (Nama/Warna/Glitter)",
      sku: "PROD-GK-HURUF",
      categorySlug: "gantungan-kunci-resin",
      productionMode: ProductionMode.MADE_TO_ORDER,
      sellingPrice: 8000,
      costPrice: 2025, // Calculated: (15ml * 85) + (1 * 450) + (1g * 300) = 1275 + 450 + 300 = 2025
      currentStock: 0,
      minStockAlert: 0,
      description: "Gantungan kunci huruf inisial A-Z dengan custom foil emas, serpihan glitter, dan cetak nama kecil di dalam resin.",
      bom: [
        { sku: "RM-RESIN-01", qty: 15, note: "Campuran resin & hardener 15ml per huruf" },
        { sku: "RM-RING-01", qty: 1, note: "1 ring gantungan kunci" },
        { sku: "RM-FOIL-01", qty: 1, note: "Glitter / foil dekoratif" },
      ],
    },
    {
      name: "Gantungan Kunci Shaker Resin Custom Premium",
      sku: "PROD-GK-SHAKER",
      categorySlug: "gantungan-kunci-resin",
      productionMode: ProductionMode.MADE_TO_ORDER,
      sellingPrice: 15000,
      costPrice: 3175, // (25 * 85) + (1 * 450) + (2 * 300) = 2125 + 450 + 600 = 3175
      currentStock: 0,
      minStockAlert: 0,
      description: "Gantungan kunci bentuk botol/bintang dengan cairan shaker & manik-manik di dalamnya.",
      bom: [
        { sku: "RM-RESIN-01", qty: 25, note: "Resin shaker 25ml" },
        { sku: "RM-RING-01", qty: 1, note: "1 ring kunci" },
        { sku: "RM-FOIL-01", qty: 2, note: "Glitter & manik" },
      ],
    },
    {
      name: "Lilin Aromaterapi Gelas Kaca 60ml (Lavender Calming)",
      sku: "PROD-LILIN-60ML",
      categorySlug: "lilin-aromaterapi",
      productionMode: ProductionMode.STOCK_BASED,
      sellingPrice: 12000,
      costPrice: 7100, // (50 * 55) + (1 * 350) + (1 * 2200) + (4 * 450) = 2750 + 350 + 2200 + 1800 = 7100
      currentStock: 25,
      minStockAlert: 10,
      description: "Lilin aroma terapi soy wax alami dalam gelas sloki kaca 60ml, wangi lavender menenangkan.",
      bom: [
        { sku: "RM-SOYWAX-01", qty: 50, note: "50 gram soy wax per gelas" },
        { sku: "RM-SUMBU-01", qty: 1, note: "1 sumbu katun" },
        { sku: "RM-GLS-60ML", qty: 1, note: "1 gelas sloki kaca 60ml" },
        { sku: "RM-FO-LAV", qty: 4, note: "4 ml fragrance oil lavender" },
      ],
    },
    {
      name: "Souvenir Pouch Kantong Serut Blacu Custom (10x15cm)",
      sku: "PROD-POUCH-BLACU",
      categorySlug: "souvenir-pouch-blacu",
      productionMode: ProductionMode.MADE_TO_ORDER,
      sellingPrice: 4500,
      costPrice: 2480, // (0.125 * 16000) + (0.6 * 800) = 2000 + 480 = 2480
      currentStock: 0,
      minStockAlert: 0,
      description: "Pouch souvenir serut kain blacu ukuran 10x15cm, cocok untuk souvenir pernikahan dan hadiah custom nama.",
      bom: [
        { sku: "RM-BLACU-01", qty: 0.125, note: "1 meter kain menghasilkan 8 kantong pouch" },
        { sku: "RM-TALIKUR-01", qty: 0.6, note: "60 cm tali kur untuk serut kanan-kiri" },
      ],
    },
    {
      name: "Casing HP Resin Bunga Kering Custom Nama",
      sku: "PROD-CASE-FLOWER",
      categorySlug: "casing-skin-hp",
      productionMode: ProductionMode.MADE_TO_ORDER,
      sellingPrice: 25000,
      costPrice: 6575, // (1 * 5000) + (15 * 85) + (1 * 300) = 5000 + 1275 + 300 = 6575
      currentStock: 0,
      minStockAlert: 0,
      description: "Casing ponsel transparan dengan hiasan bunga kering asli yang diawetkan dalam resin dan custom foil nama.",
      bom: [
        { sku: "RM-CASE-CLR", qty: 1, note: "1 casing polos TPU" },
        { sku: "RM-RESIN-01", qty: 15, note: "15 ml resin pelapis" },
        { sku: "RM-FOIL-01", qty: 1, note: "Foil / glitter dekoratif" },
      ],
    },
  ];

  for (const p of productsData) {
    const categoryId = categoryMap.get(p.categorySlug)!;
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        categoryId,
        productionMode: p.productionMode,
        sellingPrice: p.sellingPrice,
        costPrice: p.costPrice,
        currentStock: p.currentStock,
        minStockAlert: p.minStockAlert,
        description: p.description,
      },
      create: {
        name: p.name,
        sku: p.sku,
        categoryId,
        productionMode: p.productionMode,
        sellingPrice: p.sellingPrice,
        costPrice: p.costPrice,
        currentStock: p.currentStock,
        minStockAlert: p.minStockAlert,
        description: p.description,
      },
    });

    // Create BOM items
    for (const item of p.bom) {
      const rawMaterialId = rawMaterialMap.get(item.sku)!;
      await prisma.billOfMaterial.upsert({
        where: {
          productId_rawMaterialId: {
            productId: product.id,
            rawMaterialId,
          },
        },
        update: {
          quantityNeeded: item.qty,
          notes: item.note,
        },
        create: {
          productId: product.id,
          rawMaterialId,
          quantityNeeded: item.qty,
          notes: item.note,
        },
      });
    }
  }
  console.log("✓ Created Products & BOM Recipes:", productsData.length);

  // 6. Expense Categories
  const expenseCategories = [
    { name: "Kemasan & Packaging (Box, Bubble Wrap, Kartu)", isDefault: true },
    { name: "Listrik, Air & Operasional Studio", isDefault: true },
    { name: "Biaya Layanan & Iklan Shopee", isDefault: true },
    { name: "Ongkir Talangan & Pengiriman", isDefault: true },
    { name: "Peralatan Produksi & Cetakan", isDefault: true },
    { name: "Lain-lain / Tak Terduga", isDefault: false },
  ];

  for (const ec of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name: ec.name },
      update: { isDefault: ec.isDefault },
      create: ec,
    });
  }
  console.log("✓ Created Expense Categories:", expenseCategories.length);

  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
