"use client";

import Link from "next/link";
import { Plus, FileSpreadsheet, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobileNav } from "@/components/layout/mobile-nav-context";

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const { openMobileNav } = useMobileNav();

  return (
    <header className="bg-white/95 border-b border-[#F2DBE3] px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-30 backdrop-blur-xs">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Button */}
        <button
          type="button"
          onClick={openMobileNav}
          className="md:hidden p-2 rounded-lg text-[#9B2C54] bg-[#FFF0F4] hover:bg-[#FCE2EC] active:bg-[#F8D2DF] border border-[#F2DBE3] transition-colors focus:outline-none flex items-center justify-center shrink-0 cursor-pointer"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base md:text-xl font-bold text-[#231C20] tracking-tight leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] md:text-xs text-[#75656B] mt-0.5 line-clamp-1 sm:line-clamp-none">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Link href="/import-shopee">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 sm:px-3 gap-1 sm:gap-1.5 text-xs font-medium border-[#F2DBE3] bg-white hover:bg-[#FFF0F4]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#E0688A]" />
            <span className="hidden xs:inline">Impor</span>
            <span>Shopee</span>
          </Button>
        </Link>
        <Link href="/transaksi/baru">
          <Button
            size="sm"
            className="h-8 px-2.5 sm:px-3 gap-1 sm:gap-1.5 text-xs font-semibold bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Kasir Offline</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
