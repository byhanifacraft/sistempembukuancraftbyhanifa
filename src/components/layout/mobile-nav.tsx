"use client";

import { useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { getFilteredNavSections } from "@/components/layout/sidebar";
import { useMobileNav } from "@/components/layout/mobile-nav-context";
import { cn } from "@/lib/utils";
import { X, LogOut, Loader2 } from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/actions/auth.actions";

export function MobileNav({ user }: { user?: SessionUser | null }) {
  const pathname = usePathname();
  const { isOpen, closeMobileNav } = useMobileNav();
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  const isOwner = user?.role === "OWNER";
  const filteredSections = getFilteredNavSections(isOwner);

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
            <div className="relative w-11 h-11 shrink-0">
              <Image
                src="/logo.png"
                alt="CraftByHanifa Logo"
                width={44}
                height={44}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="font-bold text-[#231C20] leading-tight text-base tracking-tight">
                CraftByHanifa
              </h1>
              <p className="text-[10px] text-[#75656B]">Pembukuan UMKM</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={closeMobileNav}
            className="p-1.5 rounded-lg text-[#75656B] hover:text-[#9B2C54] hover:bg-[#FFF0F4] transition-colors cursor-pointer"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
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
                    onClick={closeMobileNav}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group min-h-[38px]",
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
            </div>
          ))}
        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-3 border-t border-[#F2DBE3] bg-[#FFF5F8]/80 shrink-0 space-y-2">
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
                <p className="text-xs font-bold text-[#231C20] leading-tight truncate">
                  {user?.name || "Pengguna"}
                </p>
                <div className="flex items-center space-x-1 mt-0.5">
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.2 rounded font-bold uppercase",
                      isOwner
                        ? "bg-[#9B2C54] text-white"
                        : "bg-emerald-600 text-white"
                    )}
                  >
                    {isOwner ? "Owner" : "Karyawan"}
                  </span>
                </div>
              </div>
            </div>
          </div>

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
    </div>
  );
}
