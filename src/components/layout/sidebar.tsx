"use client";

import { useTransition } from "react";
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
  LogOut,
  Loader2,
  Users,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth.actions";

export interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
  ownerOnly?: boolean;
}

export interface NavSection {
  title: string;
  ownerOnly?: boolean;
  items: NavItem[];
}

export const navSections: NavSection[] = [
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
        name: "Data Pelanggan",
        href: "/pelanggan",
        icon: Users,
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
        ownerOnly: true,
      },
    ],
  },
  {
    title: "Produk & Produksi",
    items: [
      {
        name: "Bahan Baku & Stok",
        href: "/bahan-baku",
        icon: Boxes,
      },
      {
        name: "Produk",
        href: "/produk",
        icon: Package,
      },
      {
        name: "Resep BOM",
        href: "/resep-bom",
        icon: Layers,
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
    ownerOnly: true,
    items: [
      {
        name: "Laporan Laba Rugi",
        href: "/laporan/laba-rugi",
        icon: TrendingUp,
        ownerOnly: true,
      },
      {
        name: "Laporan Arus Kas",
        href: "/laporan/arus-kas",
        icon: History,
        ownerOnly: true,
      },
      {
        name: "Simulasi HPP",
        href: "/laporan/kalkulator-hpp",
        icon: Calculator,
        ownerOnly: true,
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
        ownerOnly: true,
      },
      {
        name: "Bantuan & Panduan",
        href: "/bantuan",
        icon: HelpCircle,
      },
    ],
  },
];

// Helper untuk filter item navigasi berdasarkan role
export function getFilteredNavSections(isOwner: boolean): NavSection[] {
  return navSections
    .filter((section) => !section.ownerOnly || isOwner)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.ownerOnly || isOwner),
    }))
    .filter((section) => section.items.length > 0);
}

export const navigation = navSections.flatMap((s) => s.items);

export function Sidebar({ user }: { user?: SessionUser | null }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const isOwner = user?.role === "OWNER";
  const filteredSections = getFilteredNavSections(isOwner);

  // Inisial avatar
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "CB";

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      startTransition(async () => {
        await logoutAction();
      });
    }
  };

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-[#F2DBE3] flex-col h-screen sticky top-0 shrink-0 z-20">
      {/* Brand Header */}
      <div className="px-4 py-3.5 border-b border-[#F2DBE3] bg-white">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative w-12 h-12 shrink-0 transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="CraftByHanifa Logo"
              width={48}
              height={48}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-[#231C20] leading-tight text-base tracking-tight truncate group-hover:text-[#E0688A] transition-colors">
              CraftByHanifa
            </h1>
            <p className="text-[10px] text-[#75656B] truncate">
              Pembukuan & HPP Studio
            </p>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {filteredSections.map((section) => (
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

      {/* Footer / Profile & Logout */}
      <div className="p-3 border-t border-[#F2DBE3] bg-[#FFF5F8]/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border",
                isOwner
                  ? "bg-pink-100 text-[#9B2C54] border-pink-200"
                  : "bg-emerald-100 text-emerald-800 border-emerald-200"
              )}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <p className="text-xs font-bold text-[#231C20] leading-tight truncate">
                  {user?.name || "Pengguna"}
                </p>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span
                  className={cn(
                    "text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider",
                    isOwner
                      ? "bg-[#9B2C54] text-white"
                      : "bg-emerald-600 text-white"
                  )}
                >
                  {isOwner ? "Owner" : "Karyawan"}
                </span>
                <span className="text-[10px] text-[#75656B] truncate">
                  {user?.email || ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Logout */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isPending}
          className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200/80 transition-colors cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Keluar...</span>
            </>
          ) : (
            <>
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar (Logout)</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
