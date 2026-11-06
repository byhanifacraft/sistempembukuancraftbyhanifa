"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileBottomBar } from "@/components/layout/mobile-bottom-bar";
import { MobileNavProvider } from "@/components/layout/mobile-nav-context";
import { SessionUser } from "@/lib/auth";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser | null;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  // Passive Keep-Alive: kirim 1 heartbeat ringan per sesi browser di latar belakang
  // agar proyek Supabase Free selalu tercatat aktif saat website dibuka
  useEffect(() => {
    try {
      const storageKey = "cbh_keepalive_ts";
      const lastPing = Number(sessionStorage.getItem(storageKey) || "0");
      const sixHoursMs = 6 * 60 * 60 * 1000;

      if (Date.now() - lastPing > sixHoursMs) {
        sessionStorage.setItem(storageKey, String(Date.now()));
        fetch("/api/keep-alive", { method: "GET", keepalive: true }).catch(
          () => {}
        );
      }
    } catch {
      // Abaikan jika sessionStorage tidak tersedia
    }
  }, []);

  if (isLoginPage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <MobileNavProvider>
      <Sidebar user={user} />
      <MobileNav user={user} />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      <MobileBottomBar user={user} />
    </MobileNavProvider>
  );
}
