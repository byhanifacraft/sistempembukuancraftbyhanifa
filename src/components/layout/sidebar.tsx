"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Hammer,
  ReceiptText,
  FileSpreadsheet,
  WalletCards,
  TrendingUp,
  Settings,
  Calculator,
  History,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const navSections = [
  {
    title: "Operasional & Kasir",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
      },
      {
        name: "Transaksi Penjualan",
        href: "/transaksi",
        icon: ReceiptText,
      },
      {
        name: "Impor Shopee",
        href: "/import-shopee",
        icon: FileSpreadsheet,
        badge: "Auto-Match",
      },
      {
        name: "Pengeluaran & Belanja",
        href: "/pengeluaran",
        icon: WalletCards,
      },
    ],
  },
  {
    title: "Produk & Produksi",
    items: [
      {
        name: "Produk & Resep BOM",
        href: "/produk",
        icon: Package,
      },
      {
        name: "Bahan Baku & Stok",
        href: "/bahan-baku",
        icon: Boxes,
      },
      {
        name: "Produksi Batch",
        href: "/produksi",
        icon: Hammer,
      },
    ],
  },
  {
    title: "Laporan & Analisis",
    items: [
      {
        name: "Laporan Laba Rugi",
        href: "/laporan/laba-rugi",
        icon: TrendingUp,
      },
      {
        name: "Laporan Arus Kas",
        href: "/laporan/arus-kas",
        icon: History,
      },
      {
        name: "Simulasi HPP",
        href: "/laporan/kalkulator-hpp",
        icon: Calculator,
      },
    ],
  },
  {
    title: "Lainnya",
    items: [
      {
        name: "Pengaturan",
        href: "/pengaturan",
        icon: Settings,
      },
      {
        name: "Bantuan & Panduan",
        href: "/bantuan",
        icon: HelpCircle,
      },
    ],
  },
];

// Flat export for compatibility with mobile nav
export const navigation = navSections.flatMap((s) => s.items);

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-[#F2DBE3] flex-col h-screen sticky top-0 shrink-0 z-20">
      {/* Brand Header */}
      <div className="px-4 py-3.5 border-b border-[#F2DBE3] bg-white">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative w-14 h-14 shrink-0 transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="CraftByHanifa Logo"
              width={56}
              height={56}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-[#231C20] leading-tight text-lg tracking-tight truncate group-hover:text-[#E0688A] transition-colors">
              CraftByHanifa
            </h1>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold text-[#9B2C54]/70 uppercase tracking-wider">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                    isActive
                      ? "bg-gradient-to-r from-[#E0688A] to-[#E87A9B] text-white shadow-xs font-semibold"
                      : "text-[#4A3B41] hover:bg-[#FFF0F4] hover:text-[#9B2C54]"
                  )}
                >
                  <div className="flex items-center space-x-2.5">
                    <item.icon
                      className={cn(
                        "w-4 h-4 transition-colors",
                        isActive ? "text-white" : "text-[#75656B] group-hover:text-[#9B2C54]"
                      )}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded font-semibold",
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-[#FFF0F4] text-[#9B2C54] border border-[#F2DBE3]"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / Profile */}
      <div className="p-3 border-t border-[#F2DBE3] bg-[#FFF5F8]/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-pink-100 text-[#9B2C54] flex items-center justify-center font-bold text-xs border border-pink-200">
              HN
            </div>
            <div>
              <p className="text-xs font-bold text-[#231C20] leading-tight">
                Hanifa (Owner)
              </p>
              <p className="text-[10px] text-[#75656B]">Desa Bogem, Kawedanan</p>
            </div>
          </div>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" title="Sistem Aktif" />
        </div>
      </div>
    </aside>
  );
}
