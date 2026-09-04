import { getRawMaterials } from "@/actions/raw-material.actions";
import prisma from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatNumber, formatRupiah } from "@/lib/utils";
import { Boxes, AlertTriangle, Plus, Search, Layers } from "lucide-react";
import Link from "next/link";
import { RawMaterialTable } from "@/components/raw-material/raw-material-table";
import { serializePrisma } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function RawMaterialsPage(props: {
  searchParams: Promise<{ search?: string; lowStock?: string }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";
  const lowStockOnly = searchParams?.lowStock === "true";

  const [rawMaterials, units] = await Promise.all([
    getRawMaterials({ search, lowStockOnly }),
    prisma.unit.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalMaterials = rawMaterials.length;
  const lowStockCount = rawMaterials.filter(
    (m) => Number(m.currentStock) <= Number(m.minimumStock)
  ).length;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Bahan Baku & Stok Inventori"
        subtitle="Kelola bahan baku kerajinan, harga beli rata-rata (Moving Average), dan ambang batas stok"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <span className="text-xs text-stone-500 font-medium">Total Bahan Baku</span>
              <CardTitle className="text-2xl font-bold text-stone-900 mt-1">
                {totalMaterials} Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-stone-500">Resin, wax, blacu, ring kunci, dll</p>
            </CardContent>
          </Card>

          <Card className={lowStockCount > 0 ? "border-rose-300 bg-rose-50/30" : ""}>
            <CardHeader className="pb-2">
              <span className="text-xs text-rose-800 font-medium">Stok Menipis (Perlu Restock)</span>
              <CardTitle className="text-2xl font-bold text-rose-900 mt-1">
                {lowStockCount} Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={lowStockOnly ? "/bahan-baku" : "/bahan-baku?lowStock=true"}
                className="text-xs font-semibold text-[#E0688A] hover:underline"
              >
                {lowStockOnly ? "Tampilkan Semua" : "Filter Stok Menipis &rarr;"}
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <span className="text-xs text-[#75656B] font-medium">Aksi Cepat Pengadaan</span>
              <CardTitle className="text-sm font-semibold text-[#231C20] mt-1">
                Beli Bahan Baku Baru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/pengeluaran/beli-bahan">
                <Button size="sm" className="w-full text-xs gap-1.5 bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold">
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Catat Pembelian Bahan</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Client Table with Modal for Adding & Stock Adjustment */}
        <RawMaterialTable rawMaterials={serializePrisma(rawMaterials)} units={units} />
      </div>
    </div>
  );
}
