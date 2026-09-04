import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileBottomBar } from "@/components/layout/mobile-bottom-bar";
import { MobileNavProvider } from "@/components/layout/mobile-nav-context";

export const metadata: Metadata = {
  title: "CraftByHanifa - Pembukuan & HPP Kerajinan Tangan",
  description: "Sistem Pembukuan Internal UMKM Kerajinan Tangan CraftByHanifa, Magetan, Jawa Timur",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#FCF8FA] text-[#231C20] flex flex-col md:flex-row antialiased">
        <MobileNavProvider>
          <Sidebar />
          <MobileNav />
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
            {children}
          </main>
          <MobileBottomBar />
        </MobileNavProvider>
      </body>
    </html>
  );
}
