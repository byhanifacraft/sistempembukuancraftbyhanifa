"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OrderStatus } from "@/types/enums";
import { updateOrderStatus, deleteOrder } from "@/actions/order.actions";
import { Trash2, Check, RefreshCw } from "lucide-react";

export function OrderActionControls({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setLoadingStatus(true);
    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (!res.success) {
        alert(res.error || "Gagal memperbarui status pesanan.");
      } else {
        setStatus(newStatus);
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan.");
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Apakah Anda yakin ingin membatalkan/menghapus transaksi ini? Data penjualan akan dihapus dari laporan."
      )
    ) {
      return;
    }

    setLoadingDelete(true);
    try {
      const res = await deleteOrder(orderId);
      if (!res.success) {
        alert(res.error || "Gagal menghapus transaksi.");
      } else {
        router.push("/transaksi");
        router.refresh();
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan.");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 bg-white border border-[#F2DBE3] rounded-md px-2 py-1">
        <span className="text-[11px] text-[#75656B] font-medium">Ubah Status:</span>
        <select
          disabled={loadingStatus}
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
          className="text-xs bg-transparent text-[#231C20] font-semibold focus:outline-none cursor-pointer"
        >
          <option value="COMPLETED">Selesai (COMPLETED)</option>
          <option value="PROCESSING">Diproses (PROCESSING)</option>
          <option value="PENDING">Menunggu (PENDING)</option>
          <option value="CANCELLED">Dibatalkan (CANCELLED)</option>
          <option value="RETURNED">Retur (RETURNED)</option>
        </select>
        {loadingStatus && <RefreshCw className="w-3 h-3 animate-spin text-[#E0688A]" />}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={loadingDelete}
        onClick={handleDelete}
        className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 h-8 gap-1.5"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>{loadingDelete ? "Menghapus..." : "Hapus Transaksi"}</span>
      </Button>
    </div>
  );
}
