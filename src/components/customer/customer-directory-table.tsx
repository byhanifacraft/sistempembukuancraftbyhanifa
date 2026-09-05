"use client";

import { useState, useMemo } from "react";
import { CustomerSummary } from "@/actions/customer.actions";
import { exportCustomersToExcel } from "@/lib/excel-customer-export";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah, formatIndonesianDate } from "@/lib/utils";
import {
  Users,
  Search,
  FileSpreadsheet,
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  Receipt,
  Download,
  Building2,
} from "lucide-react";
import Link from "next/link";

export function CustomerDirectoryTable({
  initialCustomers,
}: {
  initialCustomers: CustomerSummary[];
}) {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [isExporting, setIsExporting] = useState(false);

  // Filtered data based on search and channel
  const filteredCustomers = useMemo(() => {
    return initialCustomers.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q));

      const matchChannel =
        channelFilter === "ALL" ||
        c.channels.includes(channelFilter);

      return matchSearch && matchChannel;
    });
  }, [initialCustomers, search, channelFilter]);

  // Overall Statistics
  const totalCustomers = initialCustomers.length;
  const withAddressCount = initialCustomers.filter((c) => Boolean(c.address)).length;
  const totalAllOrders = initialCustomers.reduce((sum, c) => sum + c.totalOrders, 0);
  const totalAllSpent = initialCustomers.reduce((sum, c) => sum + c.totalSpent, 0);

  const handleExportExcel = () => {
    try {
      setIsExporting(true);
      // Export either filtered list if filtered, or full list if no search
      const dataToExport = filteredCustomers.length > 0 ? filteredCustomers : initialCustomers;
      exportCustomersToExcel(dataToExport);
    } catch (err) {
      console.error("Export error:", err);
      alert("Terjadi kesalahan saat mengekspor data ke Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  const getCleanWaLink = (rawPhone: string) => {
    let clean = rawPhone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1);
    }
    return `https://wa.me/${clean}?text=${encodeURIComponent("Halo Kak, terima kasih sudah berbelanja di CraftByHanifa! ✨")}`;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#E0688A] shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs text-[#75656B] font-medium">Total Pelanggan Terdata</span>
            <CardTitle className="text-2xl font-bold text-[#231C20] mt-1">
              {totalCustomers} Orang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-[#75656B]">Akumulasi Shopee & Kasir Offline</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs text-emerald-700 font-medium">Pelanggan dengan Alamat</span>
            <CardTitle className="text-2xl font-bold text-emerald-950 mt-1">
              {withAddressCount} Orang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-[#75656B]">
              {totalCustomers > 0 ? Math.round((withAddressCount / totalCustomers) * 100) : 0}% data lengkap
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs text-indigo-700 font-medium">Total Transaksi Selesai</span>
            <CardTitle className="text-2xl font-bold text-indigo-950 mt-1">
              {totalAllOrders} Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-[#75656B]">Frekuensi order seluruh pembeli</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500 shadow-xs">
          <CardHeader className="pb-2">
            <span className="text-xs text-pink-700 font-medium">Total Akumulasi Belanja</span>
            <CardTitle className="text-xl font-bold text-pink-950 mt-1 truncate">
              {formatRupiah(totalAllSpent)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-[#75656B]">Perputaran omzet pelanggan</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-[#F2DBE3]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-[#231C20] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#E0688A]" />
                <span>Direktori Pelanggan CraftByHanifa</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#75656B] mt-0.5">
                Kelola kontak pembeli, pantau domisili pengiriman, dan unduh data ke Excel
              </CardDescription>
            </div>

            {/* Action Buttons: Export Excel */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleExportExcel}
                disabled={isExporting || initialCustomers.length === 0}
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>{isExporting ? "Mengekspor..." : "Export ke Excel (.xlsx)"}</span>
              </Button>

              <Link href="/transaksi/baru">
                <Button size="sm" className="text-xs gap-1.5 bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>+ Transaksi Kasir Baru</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="pt-3 flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-stone-400" />
              <Input
                placeholder="Cari nama pelanggan, nomor WhatsApp, atau alamat domisili..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant={channelFilter === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setChannelFilter("ALL")}
                className="text-xs h-9 px-3"
              >
                Semua
              </Button>
              <Button
                variant={channelFilter === "SHOPEE" ? "default" : "outline"}
                size="sm"
                onClick={() => setChannelFilter("SHOPEE")}
                className="text-xs h-9 px-3"
              >
                Shopee
              </Button>
              <Button
                variant={channelFilter === "OFFLINE" ? "default" : "outline"}
                size="sm"
                onClick={() => setChannelFilter("OFFLINE")}
                className="text-xs h-9 px-3"
              >
                Offline
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] text-center">No</TableHead>
                <TableHead className="w-[200px]">Nama Pelanggan</TableHead>
                <TableHead className="w-[170px]">Kontak WhatsApp</TableHead>
                <TableHead>Alamat Lengkap Customer</TableHead>
                <TableHead className="text-center w-[110px]">Transaksi</TableHead>
                <TableHead className="text-right w-[140px]">Total Belanja</TableHead>
                <TableHead className="w-[130px]">Terakhir Belanja</TableHead>
                <TableHead className="text-right w-[90px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-stone-400 text-xs">
                    {search ? "Tidak ada pelanggan yang sesuai dengan pencarian." : "Belum ada data pelanggan yang tercatat."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((c, index) => {
                  return (
                    <TableRow key={c.customerKey} className="hover:bg-[#FFF9FB]/60 transition-colors">
                      <TableCell className="text-center text-xs text-stone-400 font-mono">
                        {index + 1}
                      </TableCell>

                      <TableCell>
                        <p className="font-semibold text-[#231C20] text-xs leading-tight">
                          {c.name}
                        </p>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {c.channels.map((ch) => (
                            <Badge
                              key={ch}
                              variant={
                                ch === "SHOPEE"
                                  ? "shopee"
                                  : ch === "OFFLINE"
                                  ? "offline"
                                  : "secondary"
                              }
                              className="text-[9px] px-1.5 py-0.2"
                            >
                              {ch}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell>
                        {c.phone ? (
                          <div className="space-y-1">
                            <span className="font-mono text-xs text-[#231C20] font-medium block">
                              {c.phone}
                            </span>
                            <a
                              href={getCleanWaLink(c.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Kirim Chat WA</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">-</span>
                        )}
                      </TableCell>

                      <TableCell className="max-w-xs">
                        {c.address ? (
                          <div className="flex items-start gap-1.5 text-xs text-[#4A3B41]">
                            <MapPin className="w-3.5 h-3.5 text-[#E0688A] shrink-0 mt-0.5" />
                            <span className="leading-snug">{c.address}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400 italic">
                            Belum ada alamat
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
                          {c.totalOrders}x Order
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <span className="font-bold text-xs text-[#E0688A] font-mono block">
                          {formatRupiah(c.totalSpent)}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-stone-600">
                        {c.lastOrderDate ? formatIndonesianDate(c.lastOrderDate) : "-"}
                      </TableCell>

                      <TableCell className="text-right">
                        <Link href={`/transaksi?search=${encodeURIComponent(c.name)}`}>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1">
                            <ExternalLink className="w-3 h-3" />
                            <span>Pesanan</span>
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
  );
}
