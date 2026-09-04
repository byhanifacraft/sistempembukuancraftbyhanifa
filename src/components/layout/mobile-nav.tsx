"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navigation } from "@/components/layout/sidebar";
import { useMobileNav } from "@/components/layout/mobile-nav-context";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();
  const { isOpen, closeMobileNav } = useMobileNav();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs mobile-backdrop-anim"
        onClick={closeMobileNav}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        onClick={(e) => e.stopPropagation()}
        className="fixed top-0 bottom-0 left-0 w-[285px] max-w-[85vw] bg-white border-r border-[#F2DBE3] shadow-2xl flex flex-col z-50 mobile-drawer-anim"
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#F2DBE3] flex items-center justify-between bg-white shrink-0">
          <Link
            href="/"
            onClick={closeMobileNav}
            className="flex items-center space-x-3"
          >
            <div className="relative w-12 h-12 shrink-0">
              <Image
                src="/logo.png"
                alt="CraftByHanifa Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="font-bold text-[#231C20] leading-tight text-base tracking-tight">
                CraftByHanifa
              </h1>
            </div>
          </Link>

          <button
            type="button"
            onClick={closeMobileNav}
            className="p-1.5 rounded-lg text-[#75656B] hover:text-[#9B2C54] hover:bg-[#FFF0F4] transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-bold text-[#9B2C54]/70 uppercase tracking-wider">
            Menu Navigasi
          </div>
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeMobileNav}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group min-h-[42px]",
                  isActive
                    ? "bg-gradient-to-r from-[#E0688A] to-[#E87A9B] text-white shadow-xs font-semibold"
                    : "text-[#4A3B41] hover:bg-[#FFF0F4] hover:text-[#9B2C54]"
                )}
              >
                <div className="flex items-center space-x-3">
                  <item.icon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
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
        </nav>

        {/* Footer Profile */}
        <div className="p-3 border-t border-[#F2DBE3] bg-[#FFF5F8]/80 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-pink-100 text-[#9B2C54] flex items-center justify-center font-bold text-[11px] border border-pink-200">
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
    </div>
  );
}
