import { getProfitLossReport } from "@/actions/report.actions";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatIndonesianDate, formatRupiah } from "@/lib/utils";
import { TrendingUp, FileText, Calendar, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { requireOwnerRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfitLossReportPage(props: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  await requireOwnerRole();
  const searchParams = await props.searchParams;
  const startDate = searchParams?.startDate || undefined;
  const endDate = searchParams?.endDate || undefined;

  const report = await getProfitLossReport({ startDate, endDate });

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Laporan Laba Rugi (Income Statement)"
        subtitle={`Periode: ${formatIndonesianDate(report.period.startDate)} s/d ${formatIndonesianDate(report.period.endDate)}`}
      />

      <div className="p-6 space-y-6 max-w-5xl">
        {/* KPI Header Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <span className="text-xs text-stone-500 font-medium">Pendapatan Bersih</span>
              <CardTitle className="text-xl font-bold text-stone-900 mt-1">
                {formatRupiah(report.revenue.total)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-stone-500">{report.orderCounts.valid} pesanan valid</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <span className="text-xs text-stone-500 font-medium">Total HPP (Bahan Baku)</span>
              <CardTitle className="text-xl font-bold text-stone-800 mt-1">
                {formatRupiah(report.cogs.totalHpp)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-stone-500">BOM terpakai</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <span className="text-xs text-stone-500 font-medium">Total Beban Operasional</span>
              <CardTitle className="text-xl font-bold text-[#231C20] mt-1">
                {formatRupiah(report.expenses.total)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-stone-500">Kemasan, listrik, iklan</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-600 bg-emerald-50/40">
            <CardHeader className="pb-2">
              <span className="text-xs text-emerald-800 font-medium">Laba Bersih Usaha</span>
              <CardTitle className="text-2xl font-bold text-emerald-900 mt-1">
                {formatRupiah(report.netProfit)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-emerald-700 font-bold">
                Net Margin: {report.netMarginPercent}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Statement Detail Card */}
        <Card className="border-t-4 border-t-[#E0688A] shadow-xs">
          <CardHeader className="border-b border-[#F2DBE3] pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-[#E0688A] uppercase tracking-wider">
                  LAPORAN LABA RUGI KOMPREHENSIF
                </span>
                <CardTitle className="text-xl font-bold text-[#231C20] mt-0.5">
                  CraftByHanifa
                </CardTitle>
              </div>
              <p className="text-xs text-[#75656B]">
                {formatIndonesianDate(report.period.startDate)} - {formatIndonesianDate(report.period.endDate)}
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6 text-sm">
            {/* 1. Pendapatan */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-bold text-[#231C20] pb-1 border-b border-[#F2DBE3]">
                <span className="text-xs uppercase tracking-wider text-[#75656B]">
                  1. Pendapatan Penjualan (Revenue)
                </span>
                <span>{formatRupiah(report.revenue.total)}</span>
              </div>
              <div className="pl-4 space-y-1.5 text-xs text-[#4A3B41]">
                <div className="flex justify-between">
                  <span>Penjualan Kanal Shopee</span>
                  <span className="font-medium">{formatRupiah(report.revenue.shopee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penjualan Kasir Offline / Toko Fisik</span>
                  <span className="font-medium">{formatRupiah(report.revenue.offline)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penjualan WhatsApp / Direct Order</span>
                  <span className="font-medium">{formatRupiah(report.revenue.whatsapp)}</span>
                </div>
              </div>
            </div>

            {/* 2. Harga Pokok Penjualan (HPP) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-bold text-[#231C20] pb-1 border-b border-[#F2DBE3]">
                <span className="text-xs uppercase tracking-wider text-[#75656B]">
                  2. Harga Pokok Penjualan (HPP / COGS)
                </span>
                <span className="text-[#231C20]">({formatRupiah(report.cogs.totalHpp)})</span>
              </div>
              <div className="pl-4 space-y-1 text-xs text-[#75656B] italic">
                <p>• Akumulasi snapshot nilai bahan baku BOM terpakai per transaksi.</p>
              </div>
            </div>

            {/* LABA KOTOR */}
            <div className="p-3.5 rounded-xl bg-[#FFF5F8] border border-[#F2DBE3] flex justify-between items-center font-bold text-base text-[#231C20]">
              <span>Laba Kotor (Gross Profit):</span>
              <span className="text-[#E0688A]">{formatRupiah(report.grossProfit)}</span>
            </div>

            {/* 3. Beban Operasional */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-bold text-stone-900 pb-1 border-b border-stone-200">
                <span className="text-xs uppercase tracking-wider text-stone-500">
                  3. Beban Operasional Usaha
                </span>
                <span className="text-rose-700">({formatRupiah(report.expenses.total)})</span>
              </div>
              <div className="pl-4 space-y-1.5 text-xs text-stone-700">
                {report.expenses.byCategory.length === 0 ? (
                  <p className="text-stone-400 italic">Tidak ada beban operasional tercatat.</p>
                ) : (
                  report.expenses.byCategory.map((cat, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{cat.name}</span>
                      <span className="font-medium">{formatRupiah(cat.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* LABA BERSIH (NET PROFIT) */}
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex justify-between items-center text-lg font-bold text-emerald-950">
              <div>
                <span>Laba Bersih Usaha (Net Profit):</span>
                <span className="text-xs text-emerald-700 block font-normal">
                  Margin Keuntungan: {report.netMarginPercent}% dari omzet
                </span>
              </div>
              <span className="text-2xl text-emerald-800">
                {formatRupiah(report.netProfit)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
