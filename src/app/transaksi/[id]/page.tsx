import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIndonesianDate, formatIndonesianDateTime, formatRupiah } from "@/lib/utils";
import { OrderStatus, SalesChannel } from "@prisma/client";
import { ArrowLeft, Printer, Sparkles, Layers, Receipt, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { OrderActionControls } from "@/components/order/order-action-controls";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { id } = params;

  const order = await prisma.order.findUnique({
    where: { id, deletedAt: null },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
      importLog: true,
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={`Rincian Faktur: ${order.orderNumber}`}
        subtitle={`Kanal: ${order.channel} • Waktu: ${formatIndonesianDateTime(order.orderDate)}`}
      />

      <div className="p-6 space-y-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link href="/transaksi">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Daftar Transaksi</span>
            </Button>
          </Link>

          <OrderActionControls
            orderId={order.id}
            currentStatus={order.status}
          />
        </div>

        {/* Invoice Header Card */}
        <Card className="border-t-4 border-t-[#E0688A] shadow-xs">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-[#F2DBE3] pb-6">
              <div>
                <span className="text-[11px] font-bold text-[#E0688A] uppercase tracking-wider">
                  FAKTUR PENJUALAN RESMI
                </span>
                <h3 className="text-2xl font-bold text-[#231C20] mt-1">
                  {order.orderNumber}
                </h3>
                {order.externalOrderSn && (
                  <p className="text-xs text-[#75656B] font-mono mt-0.5">
                    No. Pesanan Shopee: {order.externalOrderSn}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={
                      order.channel === SalesChannel.SHOPEE
                        ? "shopee"
                        : order.channel === SalesChannel.OFFLINE
                        ? "offline"
                        : "secondary"
                    }
                  >
                    {order.channel}
                  </Badge>
                  <Badge variant="success">Status: {order.status}</Badge>
                  <Badge variant="outline">Metode: {order.paymentMethod}</Badge>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-[#75656B] space-y-1">
                <p className="font-bold text-[#231C20] text-sm">CraftByHanifa Studio</p>
                <p>Desa Bogem, Kec. Kawedanan</p>
                <p>Kabupaten Magetan, Jawa Timur</p>
                <p className="text-[#75656B]/80 text-[11px]">
                  Tanggal: {formatIndonesianDate(order.orderDate)}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="py-4 border-b border-[#F2DBE3] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#75656B] font-medium">Data Pembeli:</span>
                <p className="font-bold text-[#231C20] text-sm mt-0.5">
                  {order.customerName || "Pelanggan Offline"}
                </p>
                {order.customerPhone && (
                  <p className="text-stone-600 font-mono">{order.customerPhone}</p>
                )}
              </div>
              <div>
                <span className="text-stone-400 font-medium">Catatan Pesanan:</span>
                <p className="text-stone-700 mt-0.5">{order.notes || "Tidak ada catatan tambahan."}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="pt-4">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
                Rincian Item & Snapshot HPP
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk & Catatan Kustom</TableHead>
                    <TableHead className="text-center">Jumlah</TableHead>
                    <TableHead className="text-right">Harga Jual</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Snapshot HPP</TableHead>
                    <TableHead className="text-right">Margin Bersih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.orderItems.map((item) => {
                    const itemTotalHpp = item.unitHpp * item.quantity;
                    const itemMargin = item.subtotal - itemTotalHpp;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-bold text-stone-900 text-sm">
                            {item.productName}
                          </p>
                          {item.variantName && (
                            <p className="text-xs text-stone-500">
                              Variasi: {item.variantName}
                            </p>
                          )}
                          {item.customNote && (
                            <div className="mt-1.5 p-2 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs">
                              <strong>🎨 Catatan Kustom:</strong> {item.customNote}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-bold text-stone-800">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-medium text-stone-800">
                          {formatRupiah(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-stone-900">
                          {formatRupiah(item.subtotal)}
                        </TableCell>
                        <TableCell className="text-right text-stone-600 text-xs font-mono">
                          {formatRupiah(itemTotalHpp)}
                          <span className="text-[10px] text-stone-400 block">
                            (@ {formatRupiah(item.unitHpp)})
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-700 text-xs">
                          {formatRupiah(itemMargin)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Calculation Totals */}
            <div className="mt-6 pt-4 border-t border-[#F2DBE3] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="p-3.5 rounded-xl bg-[#FFF5F8] border border-[#F2DBE3] text-xs text-[#75656B] max-w-sm space-y-1">
                <div className="flex items-center gap-1.5 text-[#231C20] font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Jejak Audit HPP Terkunci</span>
                </div>
                <p className="text-[11px] text-[#75656B]">
                  Nilai HPP di atas adalah snapshot pada saat order dicatat. Laporan laba-rugi historis tidak akan berubah meskipun harga bahan baku naik/turun di masa depan.
                </p>
              </div>

              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-[#75656B]">
                  <span>Subtotal Produk:</span>
                  <span className="font-semibold text-[#231C20]">
                    {formatRupiah(order.subtotalAmount)}
                  </span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(order.discountAmount)}</span>
                  </div>
                )}
                {order.shippingFee > 0 && (
                  <div className="flex justify-between text-[#75656B]">
                    <span>Ongkos Kirim:</span>
                    <span>+{formatRupiah(order.shippingFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#75656B] pt-1 border-t border-[#F2DBE3]/60">
                  <span>Total HPP Terpakai:</span>
                  <span className="font-mono text-[#231C20]">
                    {formatRupiah(order.totalHppAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#231C20] pt-2 border-t border-[#F2DBE3]">
                  <span>Total Pembayaran:</span>
                  <span className="text-[#E0688A] text-xl">
                    {formatRupiah(order.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  <span>Estimasi Laba Kotor:</span>
                  <span>{formatRupiah(order.netMarginAmount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
