import prisma from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Activity, Zap } from "lucide-react";
import { serializePrisma } from "@/lib/serialize";
import { MasterDataManager } from "@/components/settings/master-data-manager";
import { requireOwnerRole } from "@/lib/auth";
import { getCategories, getUnits } from "@/actions/master.actions";
import { getExpenseCategories } from "@/actions/expense.actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireOwnerRole();
  const [categories, units, expenseCategories, users] = await Promise.all([
    getCategories(),
    getUnits(),
    getExpenseCategories(),
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Pengaturan & Master Konfigurasi"
        subtitle="Kelola kategori produk, satuan unit, kategori beban operasional, dan informasi sistem"
      />

      <div className="p-6 space-y-6 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Architecture & Concurrency Banner */}
          <Card className="border-l-4 border-l-[#E0688A] bg-[#FFF5F8]/60 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center space-x-2 text-[#231C20]">
                <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#E0688A]" />
                </div>
                <CardTitle className="text-sm font-semibold">
                  Konkurensi Stok Terkunci (Pessimistic Row Lock)
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-stone-600 space-y-1.5">
              <p>
                Sistem menerapkan <strong>Pessimistic Row Locking</strong> (<code>SELECT ... FOR UPDATE</code>) dan perhitungan <strong>Moving Weighted Average</strong> otomatis untuk menjamin akurasi stok dan HPP tanpa <em>race condition</em>.
              </p>
            </CardContent>
          </Card>

          {/* Keep-Alive & Serverless Optimization Status Card */}
          <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/30 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-[#231C20]">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-emerald-700" />
                  </div>
                  <CardTitle className="text-sm font-semibold">
                    Proteksi Anti-Sleep Supabase & Vercel Free
                  </CardTitle>
                </div>
                <Badge variant="success" className="text-[10px]">
                  Aktif
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-stone-600 space-y-1.5">
              <p>
                Dilengkapi <strong>Auto Keep-Alive Heartbeat</strong> (<code>/api/keep-alive</code> via Vercel Cron harian & GitHub Actions) agar database Supabase Free tidak pernah mati/pause otomatis, serta optimisasi <em>connection pool</em> hemat kuota.
              </p>
            </CardContent>
          </Card>
        </div>

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
