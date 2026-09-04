import { getProductionRuns } from "@/actions/production.actions";
import prisma from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatIndonesianDateTime, formatRupiah } from "@/lib/utils";
import { Hammer, History, Layers } from "lucide-react";
import { ProductionMode } from "@prisma/client";
import { ProductionRunner } from "@/components/production/production-runner";
import { serializePrisma } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function ProductionPage() {
  const [stockBasedProducts, runsData] = await Promise.all([
    prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        productionMode: ProductionMode.STOCK_BASED,
      },
      include: {
        bomItems: {
          include: {
            rawMaterial: { include: { unit: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    getProductionRuns({ limit: 15 }),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Produksi Batch (Khusus Produk Stock-Based)"
        subtitle="Potong stok bahan baku secara batch untuk menghasilkan stok produk jadi dan perbarui HPP standar"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl">
        {/* Production Runner Component */}
        <ProductionRunner stockBasedProducts={serializePrisma(stockBasedProducts)} />

        {/* Audit Log Table */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#F2DBE3]">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                <History className="w-4 h-4 text-[#E0688A]" />
              </div>
              <CardTitle className="text-base font-semibold text-[#231C20]">
                Riwayat Aktivitas Produksi Batch
              </CardTitle>
            </div>
            <CardDescription>
              Catatan riwayat pemotongan bahan baku dan penambahan stok produk jadi
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal Produksi</TableHead>
                  <TableHead>Nama Produk Jadi</TableHead>
                  <TableHead className="text-right">Jumlah Dihasilkan</TableHead>
                  <TableHead className="text-right">Total Biaya Bahan</TableHead>
                  <TableHead className="text-right">Snapshot HPP Satuan</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runsData.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-[#75656B] text-xs">
                      Belum ada aktivitas produksi batch yang tercatat.
                    </TableCell>
                  </TableRow>
                ) : (
                  runsData.data.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-mono text-xs text-[#75656B]">
                        {formatIndonesianDateTime(run.productionDate)}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-[#231C20] text-sm">
                          {run.product.name}
                        </span>
                        <span className="text-[10px] text-[#75656B] block font-mono">
                          SKU: {run.product.sku || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-[#231C20]">
                        +{run.quantityMade} pcs
                      </TableCell>
                      <TableCell className="text-right font-medium text-[#231C20]">
                        {formatRupiah(run.totalCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-bold text-[#9B2C54]">
                          {formatRupiah(run.unitCost)} / pcs
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-stone-500 max-w-xs truncate">
                        {run.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
