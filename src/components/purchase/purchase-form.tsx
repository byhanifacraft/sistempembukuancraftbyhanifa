"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatRupiah, roundRupiah } from "@/lib/utils";
import { Plus, Trash2, Boxes, AlertCircle, CheckCircle2, Calculator, Info } from "lucide-react";
import { createPurchase } from "@/actions/purchase.actions";

interface PurchaseItemRow {
  rawMaterialId: string;
  quantity: number;
  unitCost: number;
}

export function PurchaseForm({
  rawMaterials,
}: {
  rawMaterials: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [supplierName, setSupplierName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<any>("BANK_TRANSFER");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<PurchaseItemRow[]>([
    {
      rawMaterialId: rawMaterials[0]?.id || "",
      quantity: 10,
      unitCost: rawMaterials[0]?.lastCostPerUnit || rawMaterials[0]?.avgCostPerUnit || 1000,
    },
  ]);

  const materialMap = useMemo(() => {
    return new Map(rawMaterials.map((m) => [m.id, m]));
  }, [rawMaterials]);

  const handleMaterialSelect = (index: number, id: string) => {
    const selected = materialMap.get(id);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      rawMaterialId: id,
      unitCost: selected?.lastCostPerUnit || selected?.avgCostPerUnit || 0,
    };
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof PurchaseItemRow, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleAddItem = () => {
    const defaultMat = rawMaterials[0];
    setItems([
      ...items,
      {
        rawMaterialId: defaultMat?.id || "",
        quantity: 1,
        unitCost: defaultMat?.lastCostPerUnit || defaultMat?.avgCostPerUnit || 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce(
    (sum, it) => sum + roundRupiah(it.quantity * it.unitCost || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const payload = {
        supplierName: supplierName || null,
        purchaseDate: new Date(purchaseDate),
        paymentMethod,
        notes: notes || null,
        items,
      };

      const res = await createPurchase(payload);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal menyimpan pembelian.");
      } else {
        router.push("/pengeluaran");
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      {errorMessage && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="whitespace-pre-line">{errorMessage}</span>
        </div>
      )}

      {/* Supplier & Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#231C20]">
              <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                <Boxes className="w-4 h-4 text-[#E0688A]" />
              </div>
              <span>Informasi Pembelian Bahan Baku</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#231C20]">Nama Toko / Supplier</label>
                <Input
                  placeholder="Contoh: Toko Kimia Jaya Surabaya / Toko Kain Blacu Magetan"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#231C20]">Tanggal Pembelian *</label>
                <Input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#231C20]">Metode Pembayaran</label>
                <select
                  className="w-full mt-1 h-9 rounded-md border border-[#E8C5D1] bg-white px-3 py-1 text-xs text-[#231C20] focus:outline-none focus:ring-2 focus:ring-[#E0688A]"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="BANK_TRANSFER">Transfer Bank</option>
                  <option value="CASH">Tunai / Cash</option>
                  <option value="QRIS">QRIS / E-Wallet</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#231C20]">Catatan Pembelian</label>
                <Input
                  placeholder="No resi pengiriman / no invoice supplier"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Box */}
        <Card className="border-t-4 border-t-[#E0688A] shadow-xs flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#231C20]">Total Tagihan Belanja</CardTitle>
            <CardDescription>Otomatis mengupdate rata-rata harga beli</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#FFF5F8] border border-[#F2DBE3] space-y-1">
              <span className="text-[11px] text-[#75656B] block">Total Pengeluaran Kas:</span>
              <p className="text-2xl font-bold text-[#E0688A]">
                {formatRupiah(totalAmount)}
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs py-2.5 text-xs font-bold"
            >
              {loading ? "Menyimpan..." : "Simpan & Tambah Stok"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Items Section */}
      <Card>
        <CardHeader className="pb-3 border-b border-[#F2DBE3]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-[#231C20]">
                Daftar Bahan Baku yang Dibeli
              </CardTitle>
              <CardDescription>
                Sistem akan menghitung harga rata-rata baru (Moving Weighted Average) untuk tiap bahan
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="text-xs gap-1.5 border-[#E0688A] text-[#E0688A] hover:bg-[#FFF0F4]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Baris Bahan</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {items.map((item, index) => {
            const mat = materialMap.get(item.rawMaterialId);
            const sub = roundRupiah(item.quantity * item.unitCost);

            // Simulation of new moving average
            const curStock = mat ? Number(mat.currentStock) : 0;
            const curAvg = mat ? Number(mat.avgCostPerUnit) : 0;
            const newTotalVal = curStock * curAvg + item.quantity * item.unitCost;
            const newTotalQty = curStock + item.quantity;
            const simulatedAvg = newTotalQty > 0 ? roundRupiah(newTotalVal / newTotalQty) : item.unitCost;

            return (
              <div
                key={index}
                className="p-3.5 rounded-xl bg-[#FFF5F8]/70 border border-[#F2DBE3] space-y-2 text-xs"
              >
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-12 sm:col-span-5">
                    <label className="text-[11px] font-semibold text-[#75656B] block mb-1">
                      Pilih Bahan Baku *
                    </label>
                    <select
                      className="w-full h-8 rounded-md border border-[#E8C5D1] bg-white px-2 text-xs text-[#231C20] focus:outline-none focus:ring-1 focus:ring-[#E0688A]"
                      value={item.rawMaterialId}
                      onChange={(e) => handleMaterialSelect(index, e.target.value)}
                      required
                    >
                      {rawMaterials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.unit?.symbol}) - [Stok: {Number(m.currentStock)}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-[#75656B] block mb-1">
                      Jumlah Beli ({mat?.unit?.symbol})
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      className="h-8 text-center text-xs font-bold"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-[#75656B] block mb-1">
                      Harga Beli / {mat?.unit?.symbol} (Rp)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      required
                      className="h-8 text-right text-xs"
                      value={item.unitCost}
                      onChange={(e) =>
                        handleItemChange(index, "unitCost", parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-2 text-right">
                    <span className="text-[10px] text-[#75656B] block">Subtotal</span>
                    <span className="font-bold text-[#231C20] text-sm">
                      {formatRupiah(sub)}
                    </span>
                  </div>

                  <div className="col-span-1 text-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50 mt-3"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Moving Average Live Preview */}
                <div className="pt-2 border-t border-[#F2DBE3] flex items-center justify-between text-[11px] text-[#75656B]">
                  <span>
                    Stok saat ini: <strong>{curStock} {mat?.unit?.symbol}</strong> (@ {formatRupiah(curAvg)}) &rarr; Menjadi:{" "}
                    <strong className="text-emerald-700">+{curStock + item.quantity} {mat?.unit?.symbol}</strong>
                  </span>
                  <span className="text-[#231C20]">
                    Harga Rata-rata Baru: <strong className="text-[#E0688A]">{formatRupiah(simulatedAvg)} / {mat?.unit?.symbol}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </form>
  );
}
