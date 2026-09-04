import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
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

  // 1. Provision / Upsert Owner & Karyawan
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

  for (const u of usersToSeed) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      const hashRes: any = await prisma.$queryRaw`
        SELECT crypt(${u.password}, gen_salt('bf', 10)) as hashed;
      `;
      const hashed = hashRes[0].hashed;
      const rawUserMeta = JSON.stringify({ name: u.name, role: u.role });
      const rawAppMeta = JSON.stringify({ provider: "email", providers: ["email"] });

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

      const userId = insertedUsers[0].id;
      const identityJson = JSON.stringify({ sub: userId, email: u.email });

      await prisma.$executeRaw`
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, created_at, updated_at)
        VALUES (gen_random_uuid(), ${userId}::uuid, ${identityJson}::jsonb, 'email', ${userId}::text, NOW(), NOW());
      `;

      await prisma.user.create({
        data: { id: userId, email: u.email, name: u.name, role: u.role },
      });
      console.log(`✓ Created User: ${u.email} (${u.role})`);
    } else {
      console.log(`✓ User already exists: ${u.email} (${existing.role})`);
    }
  }

  // 2. Units
  const unitsData = [
    { name: "Gram", symbol: "g" },
    { name: "Mililiter", symbol: "ml" },
    { name: "Pcs / Buah", symbol: "pcs" },
    { name: "Meter", symbol: "m" },
    { name: "Lembar", symbol: "lbr" },
    { name: "Botol", symbol: "btl" },
  ];

  for (const u of unitsData) {
    await prisma.unit.upsert({
      where: { symbol: u.symbol },
      update: { name: u.name },
      create: u,
    });
  }
  console.log("✓ Ensured standard units:", unitsData.length);

  // 3. Categories
  const categoriesData = [
    { name: "Gantungan Kunci Resin", slug: "gantungan-kunci-resin", description: "Gantungan kunci custom huruf, glitter, dan shaker resin" },
    { name: "Lilin Aromaterapi & Souvenir", slug: "lilin-aromaterapi", description: "Lilin wangi soy wax souvenir gelas sloki & tungku keramik" },
    { name: "Souvenir & Hadiah Pouch", slug: "souvenir-pouch-blacu", description: "Kantong serut kain blacu / drill custom sablon nama/motif" },
    { name: "Casing & Aksesoris HP", slug: "casing-aksesoris-hp", description: "Casing ponsel custom resin bunga kering & glitter" },
  ];

  for (const c of categoriesData) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: c,
    });
  }
  console.log("✓ Ensured standard categories:", categoriesData.length);

  // 4. Expense Categories
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
  console.log("✓ Ensured expense categories:", expenseCategories.length);

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
