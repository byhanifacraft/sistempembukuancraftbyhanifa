import { cache } from "react";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let mockUserForTesting: SessionUser | null = null;

/**
 * Utilitas untuk pengujian otomatis (test runner) dalam mensimulasikan role tanpa browser context.
 */
export function setMockUserForTesting(user: SessionUser | null) {
  mockUserForTesting = user;
}

/**
 * Resolusi internal sesi pengguna yang di-memoize per-request menggunakan React.cache()
 * sehingga pemanggilan ganda di RootLayout + Page tidak memicu kueri berulang ke Supabase & DB.
 */
const resolveAuthUserPerRequest = cache(async (): Promise<SessionUser | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !authUser) {
      return null;
    }

    // Ambil metadata dari database Prisma
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
      },
    });

    if (dbUser) {
      return dbUser;
    }

    // Jika belum sinkron di Prisma, gunakan metadata Supabase Auth
    const role = (authUser.user_metadata?.role as UserRole) || UserRole.STAFF;
    const name =
      authUser.user_metadata?.name || authUser.email?.split("@")[0] || "User";

    const createdUser = await prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email || `${authUser.id}@craftbyhanifa.com`,
        name,
        role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
      },
    });

    return createdUser;
  } catch {
    return null;
  }
});

/**
 * Mendapatkan data pengguna yang sedang login dari session cookie Supabase SSR.
 * Mengembalikan null jika belum terautentikasi.
 */
export async function getCurrentAuthUser(): Promise<SessionUser | null> {
  if (mockUserForTesting) {
    return mockUserForTesting;
  }
  return resolveAuthUserPerRequest();
}

/**
 * Mendapatkan User ID yang valid untuk foreign key pencatatan transaksi (createdById).
 * 1. Jika explicitUserId berupa UUID valid, langsung gunakan.
 * 2. Mengambil ID dari user yang sedang login via session.
 * 3. Fallback: Mengambil ID user Owner jika berjalan di background script/cron.
 */
export async function getCurrentUserId(
  explicitUserId?: string | null
): Promise<string> {
  if (explicitUserId && UUID_REGEX.test(explicitUserId)) {
    return explicitUserId;
  }

  const currentUser = await getCurrentAuthUser();
  if (currentUser) {
    return currentUser.id;
  }

  // Fallback untuk CLI / Seeding / Automated tasks
  try {
    const defaultOwner = await prisma.user.findFirst({
      where: { role: UserRole.OWNER },
      select: { id: true },
    });

    if (defaultOwner) {
      return defaultOwner.id;
    }

    const anyUser = await prisma.user.findFirst({
      select: { id: true },
    });

    if (anyUser) {
      return anyUser.id;
    }

    throw new Error("Tidak ada pengguna terdaftar untuk foreign key transaksi.");
  } catch (error: any) {
    console.error("Error resolving current user ID:", error?.message);
    throw new Error("Gagal mengidentifikasi pengguna aktif untuk pencatatan transaksi.");
  }
}

/**
 * Guard: Memastikan request berasal dari pengguna terautentikasi.
 */
export async function requireAuthUser(): Promise<SessionUser> {
  const user = await getCurrentAuthUser();
  if (!user) {
    throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
  }
  return user;
}

/**
 * Guard: Memastikan request berasal dari pengguna dengan peran OWNER.
 * Melempar error jika pengguna ber-role STAFF (Karyawan) atau belum login.
 */
export async function requireOwnerRole(): Promise<SessionUser> {
  const user = await getCurrentAuthUser();
  if (user && user.role !== UserRole.OWNER) {
    throw new Error("Akses ditolak: Tindakan ini hanya dapat dilakukan oleh Owner.");
  }
  if (!user) {
    throw new Error("Akses ditolak: Silakan login sebagai Owner terlebih dahulu.");
  }
  return user;
}
