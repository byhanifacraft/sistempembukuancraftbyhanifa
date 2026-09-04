"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Plus, TrendingUp, Menu } from "lucide-react";
import { useMobileNav } from "@/components/layout/mobile-nav-context";
import { cn } from "@/lib/utils";

export function MobileBottomBar() {
  const pathname = usePathname();
  const { openMobileNav } = useMobileNav();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F2DBE3] md:hidden px-3 py-1.5 flex items-center justify-around shadow-[0_-4px_16px_rgba(224,104,138,0.08)]">
      <Link
        href="/"
        className={cn(
          "flex flex-col items-center justify-center py-1 px-2 rounded-md text-[10px] font-medium transition-colors",
          pathname === "/" ? "text-[#E0688A] font-bold" : "text-[#75656B] hover:text-[#9B2C54]"
        )}
      >
        <LayoutDashboard className="w-4 h-4 mb-0.5" />
        <span>Beranda</span>
      </Link>

      <Link
        href="/produk"
        className={cn(
          "flex flex-col items-center justify-center py-1 px-2 rounded-md text-[10px] font-medium transition-colors",
          pathname.startsWith("/produk") ? "text-[#E0688A] font-bold" : "text-[#75656B] hover:text-[#9B2C54]"
        )}
      >
        <Package className="w-4 h-4 mb-0.5" />
        <span>Produk</span>
      </Link>

      <Link
        href="/transaksi/baru"
        className="flex flex-col items-center justify-center -mt-3"
      >
        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#E0688A] to-[#E87A9B] text-white flex items-center justify-center shadow-md shadow-pink-500/25 hover:from-[#D45679] hover:to-[#E0688A] active:scale-95 transition-all">
          <Plus className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold text-[#9B2C54] mt-0.5">Kasir</span>
      </Link>

      <Link
        href="/laporan/laba-rugi"
        className={cn(
          "flex flex-col items-center justify-center py-1 px-2 rounded-md text-[10px] font-medium transition-colors",
          pathname.startsWith("/laporan") ? "text-[#E0688A] font-bold" : "text-[#75656B] hover:text-[#9B2C54]"
        )}
      >
        <TrendingUp className="w-4 h-4 mb-0.5" />
        <span>Laporan</span>
      </Link>

      <button
        type="button"
        onClick={openMobileNav}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-md text-[10px] font-medium text-[#75656B] hover:text-[#9B2C54] active:text-[#E0688A] cursor-pointer"
      >
        <Menu className="w-4 h-4 mb-0.5" />
        <span>Menu</span>
      </button>
    </div>
  );
}
