import { getProductsWithFullBOM } from "@/actions/product.actions";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, formatRupiah } from "@/lib/utils";
import { Layers, Edit3, Sparkles, CheckCircle2, AlertTriangle, Plus, Search } from "lucide-react";
import Link from "next/link";
import { ProductionMode } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ResepBOMPage(props: {
  searchParams: Promise<{ search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";

  const products = await getProductsWithFullBOM({ search });

  const totalProducts = products.length;
  const withRecipeCount = products.filter((p) => p.bomItems.length > 0).length;
  const withoutRecipeCount = totalProducts - withRecipeCount;
  
  const avgCostPrice =
    totalProducts > 0
      ? Math.round(products.reduce((sum, p) => sum + (p.costPrice || 0), 0) / totalProducts)
      : 0;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Resep Komposisi Produk (Bill of Materials)"
        subtitle="Kelola takaran formula bahan baku, kebutuhan material per unit, dan estimasi biaya HPP"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-[#E0688A] shadow-xs">
            <CardHeader className="pb-2">
              <span className="text-xs text-[#75656B] font-medium">Total Produk Terdaftar</span>
              <CardTitle className="text-2xl font-bold text-[#231C20] mt-1">
                {totalProducts} SKU
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-[#75656B]">Katalog produk aktif</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <span className="text-xs text-emerald-700 font-medium">Resep Terkonfigurasi</span>
              <CardTitle className="text-2xl font-bold text-emerald-950 mt-1">
                {withRecipeCount} Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-[#75656B]">Sudah memiliki rincian bahan</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <span className="text-xs text-amber-700 font-medium">Belum Ada Resep</span>
              <CardTitle className="text-2xl font-bold text-amber-950 mt-1">
                {withoutRecipeCount} Produk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-[#75656B]">Perlu ditambahkan bahan BOM</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="pb-2">
              <span className="text-xs text-indigo-700 font-medium">Rata-rata HPP Bahan</span>
              <CardTitle className="text-2xl font-bold text-indigo-950 mt-1">
                {formatRupiah(avgCostPrice)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-[#75656B]">Berdasarkan biaya bahan saat ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Resep BOM List */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#F2DBE3]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-[#231C20] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#E0688A]" />
                  <span>Daftar Formula Resep BOM per Produk</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#75656B] mt-0.5">
                  Rincian kebutuhan bahan baku untuk menghasilkan 1 unit produk kerajinan
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/produk/baru">
                  <Button size="sm" className="text-xs gap-1.5 bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold">
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Produk Baru</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[850px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Produk & Kategori</TableHead>
                  <TableHead className="w-[140px]">Mode Produksi</TableHead>
                  <TableHead>Komposisi Bahan Baku (BOM)</TableHead>
                  <TableHead className="text-right w-[120px]">Estimasi HPP</TableHead>
                  <TableHead className="text-right w-[120px]">Harga Jual</TableHead>
                  <TableHead className="text-right w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-stone-400 text-xs">
                      Tidak ada data produk yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => {
                    const hasBOM = p.bomItems && p.bomItems.length > 0;
                    const calculatedBOMCost = p.bomItems.reduce((sum: number, b: any) => {
                      const unitCost = Number(b.rawMaterial?.avgCostPerUnit || 0);
                      const qty = Number(b.quantityNeeded || 0);
                      return sum + qty * unitCost;
                    }, 0);
                    const roundedBOMCost = Math.round(calculatedBOMCost);
                    const margin = (p.sellingPrice || 0) - roundedBOMCost;
                    const marginPercent =
                      p.sellingPrice > 0 ? ((margin / p.sellingPrice) * 100).toFixed(0) : "0";

                    return (
                      <TableRow key={p.id} className="align-top">
                        <TableCell>
                          <p className="font-semibold text-stone-900 text-xs">{p.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-stone-500 font-mono bg-stone-100 px-1.5 py-0.5 rounded">
                              {p.sku || "Tanpa SKU"}
                            </span>
                            <span className="text-[11px] text-[#9B2C54] font-medium">
                              {p.category?.name}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          {p.productionMode === ProductionMode.MADE_TO_ORDER ? (
                            <Badge variant="custom" className="text-[10px]">
                              Made-To-Order
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] bg-[#FFF0F4] text-[#9B2C54] border-[#F2DBE3]">
                              Stock-Based
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell>
                          {!hasBOM ? (
                            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50/70 border border-amber-200/70 p-2 rounded-md text-xs">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Belum ada bahan baku dalam resep ini.</span>
                            </div>
                          ) : (
                            <div className="space-y-1.5 bg-[#FFF9FB]/70 p-2.5 rounded-lg border border-[#F2DBE3]/70">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {p.bomItems.map((bom: any) => {
                                  const itemCost = Math.round(
                                    Number(bom.quantityNeeded) * Number(bom.rawMaterial?.avgCostPerUnit || 0)
                                  );
                                  return (
                                    <div
                                      key={bom.id}
                                      className="flex items-center justify-between text-[11px] bg-white px-2 py-1 rounded border border-[#F2DBE3]"
                                    >
                                      <div className="min-w-0 pr-2">
                                        <p className="font-medium text-[#231C20] truncate">
                                          {bom.rawMaterial?.name}
                                        </p>
                                        <p className="text-[10px] text-[#75656B]">
                                          {Number(bom.quantityNeeded)} {bom.rawMaterial?.unit?.symbol}
                                          {bom.notes ? ` (${bom.notes})` : ""}
                                        </p>
                                      </div>
                                      <span className="font-mono text-[10px] text-stone-600 shrink-0 font-semibold">
                                        {formatRupiah(itemCost)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <span className="font-bold text-stone-900 text-xs block">
                            {formatRupiah(roundedBOMCost || p.costPrice)}
                          </span>
                          {hasBOM && (
                            <span className="text-[10px] text-emerald-700 font-medium">
                              Laba: {formatRupiah(margin)} ({marginPercent}%)
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-right font-bold text-[#E0688A] text-xs">
                          {formatRupiah(p.sellingPrice)}
                        </TableCell>

                        <TableCell className="text-right">
                          <Link href={`/produk/${p.id}`}>
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1 border-[#E8C5D1] text-[#9B2C54] hover:bg-[#FFF0F4]">
                              <Edit3 className="w-3 h-3" />
                              <span>Ubah Resep</span>
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
