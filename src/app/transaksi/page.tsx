import { getOrders } from "@/actions/order.actions";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIndonesianDate, formatIndonesianDateTime, formatRupiah } from "@/lib/utils";
import { OrderStatus, SalesChannel } from "@prisma/client";
import { Plus, ReceiptText, FileSpreadsheet, Search, Eye, Filter, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TransactionsPage(props: {
  searchParams: Promise<{
    channel?: SalesChannel;
    status?: OrderStatus;
    search?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const channel = searchParams?.channel || undefined;
  const status = searchParams?.status || undefined;
  const search = searchParams?.search || "";
  const page = parseInt(searchParams?.page || "1", 10);

  const { data: orders, pagination } = await getOrders({
    channel,
    status,
    search,
    page,
    limit: 20,
  });

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Riwayat Transaksi Penjualan"
        subtitle="Daftar gabungan pesanan dari Shopee, Kasir Offline, dan WhatsApp"
      />

      <div className="p-6 space-y-6 max-w-7xl">
        {/* Top Filter Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/transaksi">
              <Button
                variant={!channel ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                Semua Kanal
              </Button>
            </Link>
            <Link href="/transaksi?channel=SHOPEE">
              <Button
                variant={channel === SalesChannel.SHOPEE ? "default" : "outline"}
                size="sm"
                className="text-xs gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-[#E0688A]" />
                <span>Shopee</span>
              </Button>
            </Link>
            <Link href="/transaksi?channel=OFFLINE">
              <Button
                variant={channel === SalesChannel.OFFLINE ? "default" : "outline"}
                size="sm"
                className="text-xs gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-stone-700" />
                <span>Kasir Offline</span>
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/pelanggan">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 border-[#E8C5D1] text-[#9B2C54] hover:bg-[#FFF0F4]">
                <Users className="w-3.5 h-3.5" />
                <span>Data Pelanggan</span>
              </Button>
            </Link>
            <Link href="/import-shopee">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 border-[#E0688A] text-[#E0688A] hover:bg-[#FFF0F4]">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Impor File Shopee</span>
              </Button>
            </Link>
            <Link href="/transaksi/baru">
              <Button size="sm" className="text-xs gap-1.5 bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold">
                <Plus className="w-3.5 h-3.5" />
                <span>+ Kasir Offline Cepat</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#F2DBE3]">
            <CardTitle className="text-base font-semibold text-[#231C20]">
              Daftar Pesanan ({pagination.totalCount} Transaksi)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>No Faktur & Tanggal</TableHead>
                  <TableHead>Kanal</TableHead>
                  <TableHead>Pelanggan & Rincian Item</TableHead>
                  <TableHead className="text-right">Total Belanja</TableHead>
                  <TableHead className="text-right">Snapshot HPP</TableHead>
                  <TableHead className="text-right">Laba Kotor</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-stone-400 text-xs">
                      Belum ada transaksi penjualan yang sesuai dengan filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const isCancelled =
                      order.status === OrderStatus.CANCELLED ||
                      order.status === OrderStatus.RETURNED;

                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <span className="font-mono font-bold text-stone-900 text-xs block">
                            {order.orderNumber}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {formatIndonesianDateTime(order.orderDate)}
                          </span>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant={
                              order.channel === SalesChannel.SHOPEE
                                ? "shopee"
                                : order.channel === SalesChannel.OFFLINE
                                ? "offline"
                                : "secondary"
                            }
                            className="text-[10px] px-2 py-0.5"
                          >
                            {order.channel}
                          </Badge>
                        </TableCell>

                        <TableCell className="max-w-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-stone-900 text-xs">
                              {order.customerName || "Pelanggan"}
                            </p>
                            {order.customerPhone && (
                              <span className="text-[10px] text-stone-500 font-mono">
                                • {order.customerPhone}
                              </span>
                            )}
                          </div>
                          {order.customerAddress && (
                            <p className="text-[10px] text-stone-500 truncate max-w-[220px] mt-0.5" title={order.customerAddress}>
                              📍 {order.customerAddress}
                            </p>
                          )}
                          <div className="space-y-1 mt-1">
                            {order.orderItems.map((item) => (
                              <div key={item.id} className="text-[11px] text-stone-600">
                                <span>
                                  {item.quantity}x {item.productName}{" "}
                                  {item.variantName ? `(${item.variantName})` : ""}
                                </span>
                                {item.customNote && (
                                  <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded block w-fit mt-0.5">
                                    🎨 {item.customNote}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell className="text-right font-bold text-stone-900 text-sm">
                          {formatRupiah(order.totalAmount)}
                        </TableCell>

                        <TableCell className="text-right font-medium text-stone-600 text-xs">
                          {isCancelled ? "-" : formatRupiah(order.totalHppAmount)}
                        </TableCell>

                        <TableCell className="text-right font-semibold text-xs">
                          {isCancelled ? (
                            <span className="text-stone-400">-</span>
                          ) : (
                            <span
                              className={
                                order.netMarginAmount >= 0
                                  ? "text-emerald-700"
                                  : "text-rose-700"
                              }
                            >
                              {formatRupiah(order.netMarginAmount)}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          {order.status === OrderStatus.COMPLETED ? (
                            <Badge variant="success" className="text-[10px]">
                              Selesai
                            </Badge>
                          ) : order.status === OrderStatus.PROCESSING ? (
                            <Badge variant="warning" className="text-[10px]">
                              Diproses
                            </Badge>
                          ) : order.status === OrderStatus.CANCELLED ? (
                            <Badge variant="destructive" className="text-[10px]">
                              Batal
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              {order.status}
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Link href={`/transaksi/${order.id}`}>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1">
                              <Eye className="w-3 h-3" />
                              <span>Detail</span>
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
