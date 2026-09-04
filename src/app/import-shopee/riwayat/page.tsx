import { getShopeeImportLogs } from "@/actions/shopee-import.actions";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History } from "lucide-react";
import Link from "next/link";
import { ImportHistoryTable } from "@/components/import/import-history-table";

export const dynamic = "force-dynamic";

export default async function ImportHistoryPage() {
  const logs = await getShopeeImportLogs();

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Riwayat & Audit Impor Shopee"
        subtitle="Jejak audit setiap kali file Shopee diunggah dan fitur pembatalan impor (Rollback)"
      />

      <div className="p-6 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <Link href="/import-shopee">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Impor</span>
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-3 border-b border-[#F2DBE3]">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                <History className="w-4 h-4 text-[#E0688A]" />
              </div>
              <CardTitle className="text-base font-semibold text-[#231C20]">
                Daftar File yang Telah Diimpor
              </CardTitle>
            </div>
            <CardDescription>
              Jika terdapat kesalahan data atau salah memilih file, gunakan tombol <strong>Batalkan Impor</strong> untuk mengembalikan stok seperti semula.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ImportHistoryTable logs={logs} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
