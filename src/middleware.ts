import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Endpoint Keep-Alive & Health Check langsung diizinkan tanpa overhead autentikasi
  if (pathname.startsWith("/api/keep-alive") || pathname.startsWith("/api/health")) {
    return NextResponse.next();
  }

  const isPublicRoute = pathname === "/login";

  // 2. Fast-Path Optimisasi Vercel Free:
  // Cek apakah ada cookie sesi Supabase (`sb-*`). Jika tidak ada sama sekali,
  // hemat 1 round-trip jaringan ke Supabase Auth Server!
  const hasSupabaseCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (!hasSupabaseCookie) {
    if (isPublicRoute) {
      return NextResponse.next();
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Periksa pengguna aktif
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Jika belum login dan mencoba mengakses rute terproteksi
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Jika sudah login dan mencoba mengakses /login
  if (user && isPublicRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    return NextResponse.redirect(dashboardUrl);
  }

  // 5. Role-Based Access Control (RBAC) Guarding
  if (user) {
    const role = user.user_metadata?.role;
    const isKaryawan = role === "STAFF";

    if (isKaryawan) {
      // Halaman yang DILARANG untuk Karyawan (Hanya untuk Owner)
      const isOwnerOnlyRoute =
        pathname.startsWith("/laporan/laba-rugi") ||
        pathname.startsWith("/laporan/arus-kas") ||
        pathname.startsWith("/pengaturan") ||
        pathname.startsWith("/pengeluaran");

      if (isOwnerOnlyRoute) {
        const fallbackUrl = request.nextUrl.clone();
        fallbackUrl.pathname = "/";
        fallbackUrl.searchParams.set("denied", "true");
        return NextResponse.redirect(fallbackUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icon.svg, logo.png (brand assets)
     * - public files (svg, png, jpg, webp, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
