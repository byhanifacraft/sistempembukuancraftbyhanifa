"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIndonesianDateTime } from "@/lib/utils";
import { RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { rollbackShopeeImport } from "@/actions/shopee-import.actions";
import { ImportStatus } from "@prisma/client";

export function ImportHistoryTable({ logs }: { logs: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRollback = async (logId: string, fileName: string) => {
    if (
      !confirm(
        `PERINGATAN: Batalkan impor file "${fileName}"?\n\nSemua transaksi penjualan terkait akan dibatalkan, dan seluruh stok bahan baku / produk jadi akan DIKEMBALIKAN (restored) ke posisi sebelum impor.`
      )
    ) {
      return;
    }

    setLoadingId(logId);
    try {
      const res = await rollbackShopeeImport(logId);
      if (!res.success) {
        alert(res.error || "Gagal membatalkan impor.");
      } else {
        alert(`Berhasil membatalkan impor file "${fileName}". Stok telah dikembalikan.`);
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan.");
    } finally {
      setLoadingId(null);
    }
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-10 text-stone-400 text-xs">
        Belum ada riwayat file Shopee yang diimpor.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Waktu Impor</TableHead>
          <TableHead>Nama File</TableHead>
          <TableHead className="text-center">Total Baris</TableHead>
          <TableHead className="text-center">Diimpor</TableHead>
          <TableHead className="text-center">Duplikat</TableHead>
          <TableHead className="text-center">Status</TableHead>
          <TableHead className="text-right">Aksi Rollback</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => {
          const isRolledBack = log.status === ImportStatus.ROLLED_BACK;

          return (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-xs text-stone-700">
                {formatIndonesianDateTime(log.createdAt)}
              </TableCell>
              <TableCell className="font-medium text-stone-900 text-xs">
                {log.fileName}
              </TableCell>
              <TableCell className="text-center text-xs text-stone-600">
                {log.totalRows}
              </TableCell>
              <TableCell className="text-center font-bold text-emerald-800 text-xs">
                {log.importedCount}
              </TableCell>
              <TableCell className="text-center text-rose-700 text-xs font-semibold">
                {log.skippedDuplicateCount}
              </TableCell>
              <TableCell className="text-center">
                {isRolledBack ? (
                  <Badge variant="destructive" className="text-[10px]">
                    Dibatalkan (Rolled Back)
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-[10px]">
                    Sukses
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                {!isRolledBack && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingId === log.id}
                    className="h-7 px-2.5 text-[11px] gap-1 text-rose-700 border-rose-200 hover:bg-rose-50"
                    onClick={() => handleRollback(log.id, log.fileName)}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{loadingId === log.id ? "Memproses..." : "Batalkan Impor"}</span>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
