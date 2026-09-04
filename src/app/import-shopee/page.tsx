import prisma from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { ShopeeImportWizard } from "@/components/import/shopee-import-wizard";
import { Button } from "@/components/ui/button";
import { History, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { serializePrisma } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function ShopeeImportPage() {
  const activeProducts = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Impor Data Penjualan Shopee"
        subtitle="Unggah laporan pesanan Shopee Seller Center (.xlsx / .csv), pemetaan nama produk cerdas, dan sinkronisasi stok instan"
      />

      <div className="p-6 space-y-6 max-w-7xl">
        <div className="flex items-center justify-end">
          <Link href="/import-shopee/riwayat">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <History className="w-3.5 h-3.5 text-stone-500" />
              <span>Lihat Riwayat & Audit Impor (Rollback)</span>
            </Button>
          </Link>
        </div>

        <ShopeeImportWizard activeProducts={serializePrisma(activeProducts)} />
      </div>
    </div>
  );
}
