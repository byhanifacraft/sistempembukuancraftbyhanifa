import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Endpoint Keep-Alive untuk mencegah Supabase Free Tier mengalami auto-pause (inactivity 7 hari).
 * Dipanggil secara berkala oleh Vercel Cron Job (harian) dan/atau GitHub Actions / Uptime Monitor.
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  // Opsional: Jika CRON_SECRET diset di environment, izinkan tetap jalan namun catat mode verifikasi
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isAuthorizedCron = cronSecret
    ? authHeader === `Bearer ${cronSecret}`
    : true;

  let dbActive = false;
  let supabaseApiActive = false;
  let unitCount = 0;
  const errors: string[] = [];

  // 1. Ping PostgreSQL Database via Prisma (mencatat aktivitas database langsung)
  try {
    const [, count] = await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      prisma.unit.count(),
    ]);
    dbActive = true;
    unitCount = count;
  } catch (err: any) {
    console.error("[Keep-Alive] Database ping error:", err?.message);
    errors.push(`db: ${err?.message || "unknown error"}`);
  }

  // 2. Ping Supabase REST & Auth API Gateway (mencatat aktivitas proyek di dashboard Supabase)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("dummy")) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const [authHealthRes, restRes] = await Promise.allSettled([
        fetch(`${supabaseUrl}/auth/v1/health`, {
          method: "GET",
          headers: { apikey: supabaseAnonKey },
          cache: "no-store",
          signal: controller.signal,
        }),
        fetch(`${supabaseUrl}/rest/v1/`, {
          method: "HEAD",
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          cache: "no-store",
          signal: controller.signal,
        }),
      ]);

      clearTimeout(timeout);

      supabaseApiActive =
        (authHealthRes.status === "fulfilled" && authHealthRes.value.ok) ||
        (restRes.status === "fulfilled" && restRes.value.ok);
    } catch (err: any) {
      console.error("[Keep-Alive] Supabase API ping error:", err?.message);
      errors.push(`api: ${err?.message || "unknown error"}`);
    }
  }

  const latencyMs = Date.now() - startTime;
  const ok = dbActive || supabaseApiActive;

  return NextResponse.json(
    {
      ok,
      status: ok ? "healthy" : "degraded",
      service: "CraftByHanifa Supabase Keep-Alive",
      timestamp: new Date().toISOString(),
      latencyMs,
      checks: {
        database: dbActive,
        supabaseApi: supabaseApiActive,
        masterUnits: unitCount,
        cronVerified: isAuthorizedCron,
      },
      ...(errors.length > 0 ? { errors } : {}),
    },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

export async function HEAD(request: Request) {
  const res = await GET(request);
  return new NextResponse(null, {
    status: res.status,
    headers: res.headers,
  });
}
