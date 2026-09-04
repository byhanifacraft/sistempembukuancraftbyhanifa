import { getCashFlowReport } from "@/actions/report.actions";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatIndonesianDate, formatIndonesianDateTime, formatRupiah } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, History, Wallet } from "lucide-react";
import { requireOwnerRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CashFlowReportPage(props: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  await requireOwnerRole();
  const searchParams = await props.searchParams;
  const startDate = searchParams?.startDate || undefined;
  const endDate = searchParams?.endDate || undefined;

  const report = await getCashFlowReport({ startDate, endDate });

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Laporan Arus Kas (Cash Flow)"
        subtitle={`Arus kas masuk vs kas keluar periode ${formatIndonesianDate(report.period.startDate)} s/d ${formatIndonesianDate(report.period.endDate)}`}
      />

      <div className="p-6 space-y-6 max-w-5xl">
        {/* KPI Top Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-emerald-600">
            <CardHeader className="pb-2">
              <span className="text-xs text-stone-500 font-medium">Total Kas Masuk (Inflow)</span>
              <CardTitle className="text-2xl font-bold text-emerald-800 mt-1">
                {formatRupiah(report.totalCashIn)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-stone-500">Hasil pembayaran pesanan pelanggan</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-rose-500">
            <CardHeader className="pb-2">
              <span className="text-xs text-stone-500 font-medium">Total Kas Keluar (Outflow)</span>
              <CardTitle className="text-2xl font-bold text-rose-800 mt-1">
                {formatRupiah(report.totalCashOut)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-stone-500">Beli bahan baku + beban operasional</p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${report.netCashFlow >= 0 ? "border-l-emerald-600 bg-emerald-50/30" : "border-l-rose-600 bg-rose-50/30"}`}>
            <CardHeader className="pb-2">
              <span className="text-xs text-stone-600 font-medium">Arus Kas Bersih (Net Cash)</span>
              <CardTitle className={`text-2xl font-bold mt-1 ${report.netCashFlow >= 0 ? "text-emerald-900" : "text-rose-900"}`}>
                {formatRupiah(report.netCashFlow)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-stone-500">Surplus / Defisit Kas Berjalan</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cash Inflow Breakdown */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#F2DBE3]">
              <CardTitle className="text-base font-semibold text-emerald-800 flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>Rincian Kas Masuk</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-[#FFF5F8]/70 border border-[#F2DBE3]">
                <span className="text-[#4A3B41]">Penerimaan Shopee</span>
                <span className="font-bold text-[#231C20]">{formatRupiah(report.breakdown.cashIn.shopee)}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#FFF5F8]/70 border border-[#F2DBE3]">
                <span className="text-[#4A3B41]">Penerimaan Kasir Offline</span>
                <span className="font-bold text-[#231C20]">{formatRupiah(report.breakdown.cashIn.offline)}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#FFF5F8]/70 border border-[#F2DBE3]">
                <span className="text-[#4A3B41]">Penerimaan WhatsApp / Direct</span>
                <span className="font-bold text-[#231C20]">{formatRupiah(report.breakdown.cashIn.whatsapp)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Cash Outflow Breakdown */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#F2DBE3]">
              <CardTitle className="text-base font-semibold text-rose-800 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>Rincian Kas Keluar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-[#FFF5F8]/70 border border-[#F2DBE3]">
                <span className="text-[#4A3B41]">Pembelian Bahan Baku (Pengadaan)</span>
                <span className="font-bold text-[#231C20]">{formatRupiah(report.breakdown.cashOut.rawMaterialPurchases)}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#FFF5F8]/70 border border-[#F2DBE3]">
                <span className="text-[#4A3B41]">Beban Operasional (Listrik, Kemasan, Iklan)</span>
                <span className="font-bold text-[#231C20]">{formatRupiah(report.breakdown.cashOut.operatingExpenses)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Cash Flow Transactions */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#F2DBE3]">
            <CardTitle className="text-base font-semibold text-[#231C20]">
              Mutasi Kas Terkini
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Keterangan Transaksi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-stone-400 text-xs">
                      Belum ada transaksi kas pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.recentTransactions.map((tx, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Badge
                          variant={tx.type === "IN" ? "success" : "destructive"}
                          className="text-[10px]"
                        >
                          {tx.type === "IN" ? "KAS MASUK" : "KAS KELUAR"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-stone-900">
                        {tx.title}
                      </TableCell>
                      <TableCell className="text-xs text-stone-500 font-mono">
                        {formatIndonesianDate(tx.date)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold text-xs ${
                          tx.type === "IN" ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {tx.type === "IN" ? "+" : "-"}
                        {formatRupiah(tx.amount)}
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
