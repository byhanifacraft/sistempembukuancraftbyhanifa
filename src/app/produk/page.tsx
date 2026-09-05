import { getProducts } from "@/actions/product.actions";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, formatRupiah } from "@/lib/utils";
import { Package, Plus, Search, Sparkles, Layers, SlidersHorizontal, Edit3 } from "lucide-react";
import Link from "next/link";
import { ProductionMode } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ProductsPage(props: {
  searchParams: Promise<{ search?: string; categoryId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";
  const categoryId = searchParams?.categoryId || undefined;

  const products = await getProducts({ search, categoryId });

  const totalProducts = products.length;
  const stockBasedCount = products.filter((p) => p.productionMode === ProductionMode.STOCK_BASED).length;
  const madeToOrderCount = products.filter((p) => p.productionMode === ProductionMode.MADE_TO_ORDER).length;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Katalog Produk & Resep BOM"
        subtitle="Kelola produk kerajinan, mode produksi (Stock-Based vs Made-To-Order), dan kalkulasi HPP otomatis"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl">
        {/* KPI Top Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <span className="text-xs text-stone-500 font-medium">Total Katalog Produk</span>
              <CardTitle className="text-2xl font-bold text-stone-900 mt-1">
                {totalProducts} SKU
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-stone-500">Gantungan kunci, lilin, pouch, casing</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="pb-2">
              <span className="text-xs text-indigo-700 font-medium">Mode: Pesanan Kustom (Made-To-Order)</span>
              <CardTitle className="text-2xl font-bold text-indigo-950 mt-1">
                {madeToOrderCount} Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-stone-500">Bahan baku dipotong langsung saat ada pesanan</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#E0688A] shadow-xs">
            <CardHeader className="pb-2">
              <span className="text-xs text-[#75656B] font-medium">Mode: Stok Jadi (Stock-Based)</span>
              <CardTitle className="text-2xl font-bold text-[#231C20] mt-1">
                {stockBasedCount} Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/produksi" className="text-xs font-semibold text-[#E0688A] hover:underline">
                Buka Modul Batch Produksi &rarr;
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Product List Card */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#F2DBE3]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Daftar Produk CraftByHanifa</CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/resep-bom">
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 border-[#E8C5D1] text-[#9B2C54] hover:bg-[#FFF0F4]">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Formula Resep BOM</span>
                  </Button>
                </Link>
                <Link href="/produk/baru">
                  <Button size="sm" className="text-xs gap-1.5 bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs">
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Produk Baru</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Produk & SKU</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Mode Produksi</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">Estimasi HPP (BOM)</TableHead>
                  <TableHead className="text-right">Margin / Unit</TableHead>
                  <TableHead className="text-center">Stok Jadi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-stone-400 text-xs">
                      Belum ada produk terdaftar.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => {
                    const margin = p.sellingPrice - p.costPrice;
                    const marginPercent =
                      p.sellingPrice > 0 ? ((margin / p.sellingPrice) * 100).toFixed(0) : "0";

                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <p className="font-semibold text-stone-900 text-sm">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-stone-500 font-mono">
                              SKU: {p.sku || "-"}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              • {p.bomItems.length} bahan di resep
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-stone-700">{p.category.name}</span>
                        </TableCell>
                        <TableCell>
                          {p.productionMode === ProductionMode.MADE_TO_ORDER ? (
                            <Badge variant="custom" className="text-[10px]">
                              Made To Order (Custom)
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] bg-[#FFF0F4] text-[#9B2C54] border-[#F2DBE3]">
                              Stock-Based (Batch)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-stone-900">
                          {formatRupiah(p.sellingPrice)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-stone-700">
                          {formatRupiah(p.costPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-emerald-700">
                            {formatRupiah(margin)}
                          </span>
                          <span className="text-[10px] text-stone-400 ml-1">
                            ({marginPercent}%)
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {p.productionMode === ProductionMode.STOCK_BASED ? (
                            <span
                              className={`text-xs font-bold ${
                                p.currentStock <= p.minStockAlert
                                  ? "text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200"
                                  : "text-stone-800"
                              }`}
                            >
                              {p.currentStock} pcs
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">
                              Auto-potong bahan
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/produk/${p.id}`}>
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1">
                              <Edit3 className="w-3 h-3" />
                              <span>Edit & Resep</span>
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
