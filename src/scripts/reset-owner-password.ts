import "dotenv/config";
import prisma from "../lib/prisma";

async function main() {
  console.log("==================================================================");
  console.log("🔐 SKRIP DARURAT: PEMULIHAN KATA SANDI OWNER CRAFTBYHANIFA");
  console.log("==================================================================\n");

  const targetEmail = (process.argv[2] || "owner@craftbyhanifa.com").trim().toLowerCase();
  const newPassword = process.argv[3] || "OwnerHanifa2026!";

  console.log(`Target Akun  : ${targetEmail}`);
  console.log(`Password Baru: ${newPassword}`);
  console.log("Sedang memproses pembaruan pada database Supabase...\n");

  // 1. Cek user di database Prisma
  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
  });

  if (!user) {
    console.error(`❌ GAGAL: Pengguna dengan email '${targetEmail}' tidak ditemukan di database.`);
    process.exit(1);
  }

  // 2. Buat bcrypt hash baru
  const hashRes: any = await prisma.$queryRaw`
    SELECT crypt(${newPassword}, gen_salt('bf', 10)) as hashed;
  `;
  const hashed = hashRes[0]?.hashed;

  if (!hashed) {
    console.error("❌ GAGAL: Terjadi kesalahan saat membuat hash kata sandi.");
    process.exit(1);
  }

  // 3. Update di tabel auth.users Supabase
  await prisma.$queryRaw`
    UPDATE auth.users 
    SET encrypted_password = ${hashed}, updated_at = NOW() 
    WHERE email = ${targetEmail};
  `;

  console.log("✅ BERHASIL! Kata sandi Owner telah berhasil di-reset.");
  console.log("------------------------------------------------------------------");
  console.log(`Email        : ${targetEmail}`);
  console.log(`Password Baru: ${newPassword}`);
  console.log(`Role Akun    : ${user.role}`);
  console.log("------------------------------------------------------------------");
  console.log("Silakan buka aplikasi dan masuk menggunakan kredensial di atas.\n");
}

main()
  .catch((e) => {
    console.error("❌ Error tak terduga:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
