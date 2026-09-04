import prisma from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { serializePrisma } from "@/lib/serialize";
import { MasterDataManager } from "@/components/settings/master-data-manager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [categories, units, expenseCategories, users] = await Promise.all([
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
    prisma.expenseCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Pengaturan & Master Konfigurasi"
        subtitle="Kelola kategori produk, satuan unit, kategori beban operasional, dan informasi sistem"
      />

      <div className="p-6 space-y-6 max-w-5xl">
        {/* Architecture & Concurrency Banner */}
        <Card className="border-l-4 border-l-[#E0688A] bg-[#FFF5F8]/60 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2 text-[#231C20]">
              <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#E0688A]" />
              </div>
              <CardTitle className="text-base font-semibold">
                Arsitektur & Konkurensi Stok Terkunci (Pessimistic Row Lock)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-stone-600 space-y-2">
            <p>
              Sistem menerapkan <strong>Pessimistic Row Locking</strong> (<code>SELECT ... FOR UPDATE</code>) di dalam transaksi Prisma interaktif untuk seluruh alur yang memvalidasi dan memotong persediaan (Produksi Batch, Penjualan Offline, dan Impor Shopee). Hal ini menjamin tidak terjadi <em>race condition</em> saat banyak transaksi diproses bersamaan.
            </p>
            <p>
              Perhitungan harga bahan baku menggunakan rumus <strong>Moving Weighted Average</strong> yang diperbarui secara otomatis setiap kali ada pembelian baru.
            </p>
          </CardContent>
        </Card>

        {/* Interactive Master Data Management */}
        <MasterDataManager
          categories={serializePrisma(categories)}
          units={serializePrisma(units)}
          expenseCategories={serializePrisma(expenseCategories)}
          users={serializePrisma(users)}
        />
      </div>
    </div>
  );
}
