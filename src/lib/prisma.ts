import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/postgres";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Optimisasi Connection Pool untuk Vercel Free (Serverless) & Supabase Free Tier:
 * - max: 3 pada production serverless mencegah "MaxClientsInSessionMode" ketika beberapa fungsi berjalan bersamaan.
 * - allowExitOnIdle: true membebaskan koneksi segera saat fungsi serverless selesai dieksekusi.
 * - Singleton disimpan di globalThis baik di development maupun warm production container.
 */
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    max: isProduction ? 3 : 8,
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
    allowExitOnIdle: true,
  });

globalForPrisma.pool = pool;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
    log: isProduction ? ["error"] : ["error", "warn"],
  });

globalForPrisma.prisma = prisma;

export default prisma;
