import { getPurchases } from "@/actions/purchase.actions";
import { getExpenses } from "@/actions/expense.actions";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIndonesianDate, formatIndonesianDateTime, formatRupiah } from "@/lib/utils";
import { Plus, WalletCards, Boxes, Receipt, ArrowRight } from "lucide-react";
import Link from "next/link";
import { requireOwnerRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ExpensesOverviewPage() {
  await requireOwnerRole();
  const [purchasesData, expensesData] = await Promise.all([
    getPurchases({ limit: 5 }),
    getExpenses({ limit: 5 }),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Pengeluaran & Belanja Usaha"
        subtitle="Pencatatan pembelian bahan baku (Moving Weighted Average) dan beban operasional"
      />

      <div className="p-6 space-y-6 max-w-7xl">
        {/* Action & Nav Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Pembelian Bahan Baku */}
          <Card className="border-l-4 border-l-[#E0688A] shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#231C20]">
                  <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                    <Boxes className="w-4 h-4 text-[#E0688A]" />
                  </div>
                  <span>Pengadaan Bahan Baku</span>
                </CardTitle>
                <Link href="/pengeluaran/beli-bahan">
                  <Button size="sm" className="text-xs gap-1.5 bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold">
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Beli Bahan Baku</span>
                  </Button>
                </Link>
              </div>
              <CardDescription>
                Otomatis menambah stok dan memperbarui harga rata-rata bahan baku (Moving Average)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[420px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Bukti / Tanggal</TableHead>
                    <TableHead>Supplier & Item</TableHead>
                    <TableHead className="text-right">Total Biaya</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchasesData.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-stone-400 text-xs">
                        Belum ada riwayat pembelian bahan baku.
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchasesData.data.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <span className="font-mono font-bold text-stone-900 text-xs block">
                            {p.purchaseNumber}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {formatIndonesianDate(p.purchaseDate)}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <p className="font-semibold text-stone-800">
                            {p.supplierName || "Supplier"}
                          </p>
                          <p className="text-[10px] text-stone-500">
                            {p.purchaseItems.length} item bahan
                          </p>
                        </TableCell>
                        <TableCell className="text-right font-bold text-stone-900 text-xs">
                          {formatRupiah(p.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Card 2: Beban Operasional */}
          <Card className="border-l-4 border-l-[#E0688A] shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#231C20]">
                  <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-[#E0688A]" />
                  </div>
                  <span>Beban Operasional Studio</span>
                </CardTitle>
                <Link href="/pengeluaran/operasional">
                  <Button size="sm" className="text-xs gap-1.5 bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold">
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Catat Beban Operasional</span>
                  </Button>
                </Link>
              </div>
              <CardDescription>
                Kemasan & box, listrik, iklan Shopee, ongkir talangan, peralatan studio
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[420px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori & Judul</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesData.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-stone-400 text-xs">
                        Belum ada beban operasional tercatat.
                      </TableCell>
                    </TableRow>
                  ) : (
                    expensesData.data.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs">
                          <Badge variant="secondary" className="text-[10px] mb-1">
                            {e.category.name}
                          </Badge>
                          <p className="font-semibold text-stone-800">{e.title}</p>
                        </TableCell>
                        <TableCell className="text-xs text-stone-500 font-mono">
                          {formatIndonesianDate(e.expenseDate)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-stone-900 text-xs">
                          {formatRupiah(e.amount)}
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
    </div>
  );
}
