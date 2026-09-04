import { getDashboardSummary } from "@/actions/report.actions";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIndonesianDate, formatIndonesianDateTime, formatRupiah } from "@/lib/utils";
import { getCurrentAuthUser } from "@/lib/auth";
import {
  TrendingUp,
  Wallet,
  ShoppingBag,
  AlertTriangle,
  Package,
  Layers,
  ChevronRight,
  Boxes,
  Hammer,
  ShieldAlert,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { SalesChannel } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const [summary, user, params] = await Promise.all([
    getDashboardSummary(),
    getCurrentAuthUser(),
    searchParams,
  ]);

  const isOwner = user?.role === "OWNER";
  const isDenied = params?.denied === "true";

  const marginPercent =
    summary.month.revenue > 0
      ? ((summary.month.netProfit / summary.month.revenue) * 100).toFixed(1)
      : "0";

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={isOwner ? "Ringkasan Usaha & Pembukuan" : "Dashboard Operasional & Kasir"}
        subtitle={`Masuk sebagai ${user?.name || "Pengguna"} (${isOwner ? "Owner" : "Karyawan"}) • ${formatIndonesianDate(new Date(), "EEEE, dd MMMM yyyy")}`}
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl">
        {/* Access Denied Alert Banner */}
        {isDenied && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-amber-900 text-xs shadow-xs">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-sm text-amber-950">
                Akses Dibatasi (Khusus Pemilik Usaha)
              </p>
              <p className="text-amber-800">
                Halaman yang Anda coba buka (Laporan Keuangan, Pengeluaran, atau Pengaturan Sistem) hanya dapat diakses oleh akun <strong>Owner</strong>. Anda telah dialihkan kembali ke Dashboard Operasional.
              </p>
            </div>
          </div>
        )}

        {/* KPI Cards: OWNER vs KARYAWAN */}
        {isOwner ? (
          /* OWNER FINANCIAL KPI CARDS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Omzet Bulan Ini */}
            <Card className="border-l-4 border-l-[#E0688A] shadow-xs hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-[#75656B] text-xs font-medium">
                  <span>Omzet Bulan Ini</span>
                  <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-[#E0688A]" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-[#231C20] mt-1">
                  {formatRupiah(summary.month.revenue)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-[#75656B] pt-1 border-t border-[#F2DBE3]/60">
                  <span>Hari ini: <strong className="text-[#231C20]">{formatRupiah(summary.today.revenue)}</strong></span>
                  <span className="font-medium text-[#E0688A]">{summary.month.orderCount} pesanan</span>
                </div>
              </CardContent>
            </Card>

            {/* Estimasi HPP */}
            <Card className="border-l-4 border-l-[#B53D68] shadow-xs hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-[#75656B] text-xs font-medium">
                  <span>Total HPP Terpakai</span>
                  <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-[#B53D68]" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-[#231C20] mt-1">
                  {formatRupiah(summary.month.totalHpp)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-[#75656B] pt-1 border-t border-[#F2DBE3]/60">
                  <span>Laba Kotor:</span>
                  <strong className="text-[#231C20]">{formatRupiah(summary.month.grossProfit)}</strong>
                </div>
              </CardContent>
            </Card>

            {/* Beban Operasional */}
            <Card className="border-l-4 border-l-[#E0688A] shadow-xs hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-[#75656B] text-xs font-medium">
                  <span>Beban Operasional</span>
                  <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-[#E0688A]" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-[#231C20] mt-1">
                  {formatRupiah(summary.month.operatingExpenses)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-[#75656B] pt-1 border-t border-[#F2DBE3]/60">
                  <span>Kemasan, studio, iklan</span>
                  <Link href="/pengeluaran/operasional" className="text-[#E0688A] font-semibold hover:underline">
                    Rincian &rarr;
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Laba Bersih */}
            <Card className="border-l-4 border-l-emerald-600 bg-emerald-50/40 shadow-xs hover:shadow-md transition-shadow border-emerald-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-emerald-800 text-xs font-medium">
                  <span>Laba Bersih Bulan Ini</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-emerald-800 mt-1">
                  {formatRupiah(summary.month.netProfit)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-xs text-emerald-700 pt-1 border-t border-emerald-200/60">
                  <span>Net Margin:</span>
                  <strong className="bg-emerald-100/90 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    {marginPercent}%
                  </strong>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* KARYAWAN OPERATIONAL KPI CARDS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pesanan Hari Ini */}
            <Card className="border-l-4 border-l-[#E0688A] shadow-xs">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-[#75656B] text-xs font-medium">
                  <span>Pesanan Hari Ini</span>
                  <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#E0688A]" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-[#231C20] mt-1">
                  {summary.today.orderCount} Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-[#75656B] pt-1 border-t border-[#F2DBE3]/60 flex items-center justify-between">
                  <span>Kanal Kasir & Shopee</span>
                  <Link href="/transaksi/baru" className="text-[#E0688A] font-bold hover:underline">
                    + Kasir Baru
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Total Pesanan Bulan Ini */}
            <Card className="border-l-4 border-l-[#B53D68] shadow-xs">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-[#75656B] text-xs font-medium">
                  <span>Total Pesanan Bulan Ini</span>
                  <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-[#B53D68]" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-[#231C20] mt-1">
                  {summary.month.orderCount} Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-[#75656B] pt-1 border-t border-[#F2DBE3]/60 flex items-center justify-between">
                  <span>Riwayat Pesanan</span>
                  <Link href="/transaksi" className="text-[#B53D68] font-semibold hover:underline">
                    Lihat Semua &rarr;
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Peringatan Bahan Baku Kritis */}
            <Card className="border-l-4 border-l-amber-500 shadow-xs">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-amber-800 text-xs font-medium">
                  <span>Bahan Perlu Restock</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-amber-900 mt-1">
                  {summary.alerts.rawMaterialCount} Bahan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-amber-700 pt-1 border-t border-amber-200/60 flex items-center justify-between">
                  <span>Di bawah batas minimum</span>
                  <Link href="/bahan-baku" className="text-amber-800 font-semibold hover:underline">
                    Cek Stok &rarr;
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Produk Siap Produksi */}
            <Card className="border-l-4 border-l-emerald-600 shadow-xs">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-emerald-800 text-xs font-medium">
                  <span>Produk Perlu Dibuat</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Hammer className="w-4 h-4 text-emerald-700" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-emerald-900 mt-1">
                  {summary.alerts.productCount} Produk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-emerald-700 pt-1 border-t border-emerald-200/60 flex items-center justify-between">
                  <span>Stok menipis</span>
                  <Link href="/produksi" className="text-emerald-800 font-semibold hover:underline">
                    Mulai Batch &rarr;
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Middle Section: Channel Stats & Low Stock Alert */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Channel Breakdown */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Kontribusi Kanal Penjualan
                  </CardTitle>
                  <CardDescription>
                    Perbandingan pesanan Shopee vs Kasir Offline / Toko Fisik bulan ini
                  </CardDescription>
                </div>
                <Link href="/transaksi">
                  <Button variant="ghost" size="sm" className="text-xs gap-1">
                    <span>Semua Transaksi</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Shopee */}
                <div className="p-4 rounded-xl bg-[#FFF5F8]/70 border border-[#F2DBE3]">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="shopee">Shopee</Badge>
                    <span className="text-xs text-[#75656B] font-medium">
                      {summary.channelStats.shopee.count} pesanan
                    </span>
                  </div>
                  {isOwner ? (
                    <>
                      <p className="text-lg font-bold text-[#231C20]">
                        {formatRupiah(summary.channelStats.shopee.revenue)}
                      </p>
                      <p className="text-[11px] text-[#75656B] mt-1">
                        {summary.month.revenue > 0
                          ? (
                              (summary.channelStats.shopee.revenue / summary.month.revenue) *
                              100
                            ).toFixed(1)
                          : "0"}
                        % dari total omzet
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-[#4A3B41]">
                      {summary.channelStats.shopee.count} Paket Pesanan
                    </p>
                  )}
                </div>

                {/* Offline */}
                <div className="p-4 rounded-xl bg-[#FFF5F8]/70 border border-[#F2DBE3]">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="offline">Kasir Offline</Badge>
                    <span className="text-xs text-[#75656B] font-medium">
                      {summary.channelStats.offline.count} pesanan
                    </span>
                  </div>
                  {isOwner ? (
                    <>
                      <p className="text-lg font-bold text-[#231C20]">
                        {formatRupiah(summary.channelStats.offline.revenue)}
                      </p>
                      <p className="text-[11px] text-[#75656B] mt-1">
                        {summary.month.revenue > 0
                          ? (
                              (summary.channelStats.offline.revenue / summary.month.revenue) *
                              100
                            ).toFixed(1)
                          : "0"}
                        % dari total omzet
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-[#4A3B41]">
                      {summary.channelStats.offline.count} Nota Kasir
                    </p>
                  )}
                </div>

                {/* WhatsApp & Lainnya */}
                <div className="p-4 rounded-xl bg-[#FFF5F8]/70 border border-[#F2DBE3]">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">WhatsApp / Direct</Badge>
                    <span className="text-xs text-[#75656B] font-medium">
                      {summary.channelStats.whatsapp.count + summary.channelStats.other.count} pesanan
                    </span>
                  </div>
                  {isOwner ? (
                    <>
                      <p className="text-lg font-bold text-[#231C20]">
                        {formatRupiah(
                          summary.channelStats.whatsapp.revenue + summary.channelStats.other.revenue
                        )}
                      </p>
                      <p className="text-[11px] text-[#75656B] mt-1">
                        {summary.month.revenue > 0
                          ? (
                              ((summary.channelStats.whatsapp.revenue +
                                summary.channelStats.other.revenue) /
                                summary.month.revenue) *
                              100
                            ).toFixed(1)
                          : "0"}
                        % dari total omzet
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-semibold text-[#4A3B41]">
                      {summary.channelStats.whatsapp.count + summary.channelStats.other.count} Pesanan Langsung
                    </p>
                  )}
                </div>
              </div>

              {/* 7-Day Trend Quick Bar (Owner Only) */}
              {isOwner && (
                <div className="pt-3 border-t border-[#F2DBE3]">
                  <p className="text-xs font-semibold text-[#75656B] mb-2">
                    Tren Omzet 7 Hari Terakhir
                  </p>
                  <div className="grid grid-cols-7 gap-2">
                    {summary.last7Days.map((d, i) => (
                      <div
                        key={i}
                        className="text-center p-2 rounded-lg bg-[#FFF5F8]/70 border border-[#F2DBE3]"
                      >
                        <p className="text-[10px] text-[#75656B]">{d.date}</p>
                        <p className="text-xs font-bold text-[#231C20] mt-0.5">
                          {d.revenue > 0 ? `Rp ${(d.revenue / 1000).toFixed(0)}k` : "Rp 0"}
                        </p>
                        <p className="text-[9px] text-[#75656B]">{d.orders} ord</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="border-[#F2DBE3]">
            <CardHeader className="bg-[#FFF5F8]/70 pb-3 border-b border-[#F2DBE3]">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-[#E0688A]" />
                <CardTitle className="text-base font-semibold text-[#231C20]">
                  Peringatan Stok Menipis
                </CardTitle>
              </div>
              <CardDescription className="text-[#75656B]">
                {summary.alerts.rawMaterialCount} bahan baku & {summary.alerts.productCount} produk siap kirim perlu restock
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {summary.alerts.rawMaterials.length === 0 && summary.alerts.products.length === 0 ? (
                <div className="text-center py-6 text-[#75656B] text-xs">
                  Semua stok bahan baku & produk dalam kondisi aman.
                </div>
              ) : (
                <div className="space-y-2">
                  {summary.alerts.rawMaterials.map((rm) => (
                    <div
                      key={rm.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#FFF5F8]/70 border border-[#F2DBE3] text-xs"
                    >
                      <div>
                        <p className="font-semibold text-[#231C20]">{rm.name}</p>
                        <p className="text-[10px] text-rose-700 font-medium">
                          Sisa: <strong>{Number(rm.currentStock)} {rm.unit?.symbol}</strong> (Min: {Number(rm.minimumStock)} {rm.unit?.symbol})
                        </p>
                      </div>
                      <Link href="/bahan-baku">
                        <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5 border-[#E8C5D1] text-[#E0688A] hover:bg-[#FFF0F4] font-semibold">
                          Cek
                        </Button>
                      </Link>
                    </div>
                  ))}

                  {summary.alerts.products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#FFF5F8]/70 border border-[#F2DBE3] text-xs"
                    >
                      <div>
                        <p className="font-semibold text-[#231C20]">{p.name}</p>
                        <p className="text-[10px] text-rose-700 font-medium">
                          Stok Jadi: <strong>{p.currentStock} pcs</strong> (Min: {p.minStockAlert})
                        </p>
                      </div>
                      <Link href="/produksi">
                        <Button size="sm" variant="outline" className="h-7 text-[11px] px-2.5 border-[#E8C5D1] text-[#E0688A] hover:bg-[#FFF0F4] font-semibold">
                          Produksi
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Top Selling & Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Produk Terlaris Bulan Ini
                  </CardTitle>
                  <CardDescription>Berdasarkan kuantitas unit terjual</CardDescription>
                </div>
                <Link href="/produk">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Katalog &rarr;
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {summary.topSellingProducts.length === 0 ? (
                <div className="text-center py-8 text-[#75656B] text-xs">
                  Belum ada data penjualan tercatat bulan ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.topSellingProducts.map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#FFF5F8]/70 border border-[#F2DBE3] text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 rounded-full bg-[#E0688A] text-white flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-[#231C20]">{p.name}</p>
                          <p className="text-[10px] text-[#75656B]">
                            {p.qty} unit terjual
                          </p>
                        </div>
                      </div>
                      {isOwner && (
                        <span className="font-bold text-[#231C20]">
                          {formatRupiah(p.revenue)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders with Custom Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Pesanan Terbaru & Custom Order
                  </CardTitle>
                  <CardDescription>Transaksi terakhir yang masuk</CardDescription>
                </div>
                <Link href="/transaksi">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Semua &rarr;
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {summary.recentOrders.length === 0 ? (
                <div className="text-center py-8 text-[#75656B] text-xs">
                  Belum ada transaksi penjualan tercatat.
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.recentOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-lg bg-[#FFF5F8]/70 border border-[#F2DBE3] text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              ord.channel === SalesChannel.SHOPEE
                                ? "shopee"
                                : "offline"
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {ord.channel}
                          </Badge>
                          <span className="font-mono text-[#231C20] font-semibold">
                            {ord.orderNumber}
                          </span>
                        </div>
                        <span className="font-bold text-[#231C20]">
                          {formatRupiah(ord.totalAmount)}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#4A3B41]">
                        {ord.orderItems.map((it) => (
                          <div key={it.id} className="flex flex-col">
                            <span>
                              {it.quantity}x {it.productName}{" "}
                              {it.variantName ? `(${it.variantName})` : ""}
                            </span>
                            {it.customNote && (
                              <span className="text-[10px] text-[#9B2C54] bg-[#FFF0F4] border border-[#F2DBE3] px-1.5 py-0.5 rounded mt-0.5 inline-block w-fit font-medium">
                                🎨 Custom: {it.customNote}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="text-[10px] text-[#75656B] pt-1 flex justify-between border-t border-[#F2DBE3]/40">
                        <span>{formatIndonesianDateTime(ord.orderDate)}</span>
                        <span>{ord.customerName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
