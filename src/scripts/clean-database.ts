import "dotenv/config";
import prisma from "../lib/prisma";
import { UserRole } from "@prisma/client";

export async function cleanAndSeedDatabase() {
  console.log("===============================================================");
  console.log("🧹 MEMULAI PEMBERSIHAN TOTAL DATA (CLEAN SWEEP) DATABASE...");
  console.log("===============================================================\n");

  try {
    // 1. Hapus semua data transaksi & operasional secara berurutan sesuai relasi
    console.log("1. Menghapus seluruh data operasional, transaksi, dan audit...");
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
    await prisma.category.deleteMany();
    await prisma.unit.deleteMany();
    await prisma.user.deleteMany();
    console.log("   ✓ Seluruh tabel operasional dan transaksi di public schema bersih!");

    // 2. Bersihkan user lama dari auth.users
    console.log("\n2. Membersihkan seluruh auth users lama...");
    await prisma.$executeRaw`
      DELETE FROM auth.users 
      WHERE email IN ('owner@craftbyhanifa.com', 'karyawan@craftbyhanifa.com', 'test.exact@gmail.com')
         OR email ILIKE '%probe%'
         OR email ILIKE '%test%';
    `;
    console.log("   ✓ Tabel auth.users bersih dari akun uji coba!");

    // 3. Provisioning Akun Resmi Owner & Karyawan
    console.log("\n3. Membuat akun resmi Owner & Karyawan di Supabase Auth & Prisma...");

    const usersToCreate = [
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

    for (const u of usersToCreate) {
      // Hapus jika ada duplikat sebelumnya
      await prisma.$executeRaw`DELETE FROM auth.users WHERE email = ${u.email};`;

      // Hash password dengan bcrypt cost 10
      const hashRes: any = await prisma.$queryRaw`
        SELECT crypt(${u.password}, gen_salt('bf', 10)) as hashed;
      `;
      const hashed = hashRes[0].hashed;

      // Insert ke auth.users
      const rawUserMeta = JSON.stringify({ name: u.name, role: u.role });
      const rawAppMeta = JSON.stringify({ provider: "email", providers: ["email"] });

      const insertedUsers: any = await prisma.$queryRaw`
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          invited_at,
          confirmation_token,
          confirmation_sent_at,
          recovery_token,
          recovery_sent_at,
          email_change_token_new,
          email_change,
          email_change_sent_at,
          last_sign_in_at,
          raw_app_meta_data,
          raw_user_meta_data,
          is_super_admin,
          created_at,
          updated_at,
          phone,
          phone_confirmed_at,
          phone_change,
          phone_change_token,
          phone_change_sent_at,
          email_change_token_current,
          email_change_confirm_status,
          banned_until,
          reauthentication_token,
          reauthentication_sent_at,
          is_sso_user,
          deleted_at,
          is_anonymous
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          gen_random_uuid(),
          'authenticated',
          'authenticated',
          ${u.email},
          ${hashed},
          NOW(),
          NULL,
          '',
          NULL,
          '',
          NULL,
          '',
          '',
          NULL,
          NULL,
          ${rawAppMeta}::jsonb,
          ${rawUserMeta}::jsonb,
          NULL,
          NOW(),
          NOW(),
          NULL,
          NULL,
          '',
          '',
          NULL,
          '',
          0,
          NULL,
          '',
          NULL,
          false,
          NULL,
          false
        )
        RETURNING id, email;
      `;

      const userId = insertedUsers[0].id;
      const identityJson = JSON.stringify({ sub: userId, email: u.email });

      // Insert ke auth.identities
      await prisma.$executeRaw`
        INSERT INTO auth.identities (
          id,
          user_id,
          identity_data,
          provider,
          provider_id,
          last_sign_in_at,
          created_at,
          updated_at
        ) VALUES (
          gen_random_uuid(),
          ${userId}::uuid,
          ${identityJson}::jsonb,
          'email',
          ${userId}::text,
          NULL,
          NOW(),
          NOW()
        );
      `;

      // Insert ke public.users
      await prisma.user.create({
        data: {
          id: userId,
          email: u.email,
          name: u.name,
          role: u.role,
        },
      });

      console.log(`   ✓ Dibuat akun: ${u.email} (${u.role}) -> User ID: ${userId}`);
    }

    // 4. Inisialisasi Master Data Baku (Standard Units & Categories)
    console.log("\n4. Menginisialisasi Master Data Baku UMKM (Satuan, Kategori, Beban)...");

    const units = [
      { name: "Gram", symbol: "g" },
      { name: "Mililiter", symbol: "ml" },
      { name: "Pcs / Buah", symbol: "pcs" },
      { name: "Meter", symbol: "m" },
      { name: "Lembar", symbol: "lbr" },
      { name: "Botol", symbol: "btl" },
    ];
    for (const unit of units) {
      await prisma.unit.create({ data: unit });
    }
    console.log(`   ✓ Dibuat ${units.length} Satuan Baku`);

    const categories = [
      { name: "Gantungan Kunci Resin", slug: "gantungan-kunci-resin", description: "Gantungan kunci custom huruf, glitter, dan shaker resin" },
      { name: "Lilin Aromaterapi & Souvenir", slug: "lilin-aromaterapi", description: "Lilin aroma terapi wangi soy wax natural" },
      { name: "Souvenir & Hadiah Pouch", slug: "souvenir-pouch-blacu", description: "Pouch souvenir serut kain blacu custom" },
      { name: "Casing & Aksesoris HP", slug: "casing-aksesoris-hp", description: "Casing ponsel resin bunga kering dan aksesoris" },
    ];
    for (const cat of categories) {
      await prisma.category.create({ data: cat });
    }
    console.log(`   ✓ Dibuat ${categories.length} Kategori Baku`);

    const expenseCategories = [
      { name: "Kemasan & Packaging (Box, Bubble Wrap, Kartu)", isDefault: true },
      { name: "Listrik, Air & Operasional Studio", isDefault: true },
      { name: "Biaya Layanan & Iklan Shopee", isDefault: true },
      { name: "Ongkir Talangan & Pengiriman", isDefault: true },
      { name: "Peralatan Produksi & Cetakan", isDefault: true },
      { name: "Lain-lain / Operasional Tak Terduga", isDefault: false },
    ];
    for (const ec of expenseCategories) {
      await prisma.expenseCategory.create({ data: ec });
    }
    console.log(`   ✓ Dibuat ${expenseCategories.length} Kategori Pengeluaran`);

    // 5. Cek Ringkasan Akhir
    const counts = {
      users: await prisma.user.count(),
      orders: await prisma.order.count(),
      products: await prisma.product.count(),
      rawMaterials: await prisma.rawMaterial.count(),
      purchases: await prisma.purchase.count(),
      expenses: await prisma.expense.count(),
      stockMutations: await prisma.stockMutation.count(),
      units: await prisma.unit.count(),
      categories: await prisma.category.count(),
      expenseCategories: await prisma.expenseCategory.count(),
    };

    console.log("\n===============================================================");
    console.log("✨ HASIL PEMBERSIHAN & STATUS DATABASE:");
    console.log(JSON.stringify(counts, null, 2));
    console.log("===============================================================");
    console.log("✅ Database berhasil dibersihkan total dan siap digunakan!");
  } catch (error) {
    console.error("❌ Terjadi error saat pembersihan database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Jalankan langsung jika dieksekusi via CLI
if (require.main === module) {
  cleanAndSeedDatabase().catch(() => process.exit(1));
}
