import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentAuthUser } from "@/lib/auth";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentAuthUser();

  return (
    <html lang="id">
      <body className="min-h-screen bg-[#FCF8FA] text-[#231C20] flex flex-col md:flex-row antialiased">
        <AppShell user={user}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
