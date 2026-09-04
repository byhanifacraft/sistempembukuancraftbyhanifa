import prisma from "@/lib/prisma";

let cachedUserId: string | null = null;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Mendapatkan User ID yang valid untuk foreign key createdById.
 * Jika explicitUserId berupa UUID valid, langsung gunakan.
 * Jika tidak (undefined, null, atau string invalid seperti "dummy-user"),
 * maka otomatis mengambil user Owner / user pertama dari database,
 * atau membuat user Owner default jika database masih kosong.
 */
export async function getCurrentUserId(
  explicitUserId?: string | null
): Promise<string> {
  if (explicitUserId && UUID_REGEX.test(explicitUserId)) {
    return explicitUserId;
  }

  if (cachedUserId) {
    return cachedUserId;
  }

  try {
    const existingUser = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (existingUser) {
      cachedUserId = existingUser.id;
      return existingUser.id;
    }

    const newUser = await prisma.user.create({
      data: {
        email: "owner@craftbyhanifa.com",
        name: "Hanifa (Pemilik Usaha)",
        role: "OWNER",
      },
      select: { id: true },
    });

    cachedUserId = newUser.id;
    return newUser.id;
  } catch (error) {
    console.error("Error resolving current user ID:", error);
    // Jika terjadi kegagalan query saat startup, cari sekali lagi tanpa cache
    const fallbackUser = await prisma.user.findFirst({
      select: { id: true },
    });
    if (fallbackUser) {
      cachedUserId = fallbackUser.id;
      return fallbackUser.id;
    }
    throw new Error("Gagal mengidentifikasi pengguna aktif untuk pencatatan transaksi.");
  }
}
