"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatRupiah, roundRupiah } from "@/lib/utils";
import { Hammer, AlertCircle, CheckCircle2, Package, Sparkles, Layers } from "lucide-react";
import { recordProductionRun } from "@/actions/production.actions";

export function ProductionRunner({
  stockBasedProducts,
}: {
  stockBasedProducts: any[];
}) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    stockBasedProducts[0]?.id || ""
  );
  const [quantityMade, setQuantityMade] = useState<number>(10);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const selectedProduct = useMemo(() => {
    return stockBasedProducts.find((p) => p.id === selectedProductId);
  }, [stockBasedProducts, selectedProductId]);

  // Pre-calculate material requirements and check sufficiency
  const materialRequirements = useMemo(() => {
    if (!selectedProduct || !selectedProduct.bomItems) return [];

    return selectedProduct.bomItems.map((bom: any) => {
      const neededPerUnit = Number(bom.quantityNeeded);
      const totalNeeded = neededPerUnit * (quantityMade || 0);
      const availableStock = Number(bom.rawMaterial.currentStock);
      const isSufficient = availableStock >= totalNeeded;
      const unitCost = bom.rawMaterial.avgCostPerUnit || 0;
      const subtotalCost = roundRupiah(totalNeeded * unitCost);

      return {
        materialId: bom.rawMaterialId,
        materialName: bom.rawMaterial.name,
        unitSymbol: bom.rawMaterial.unit?.symbol || "unit",
        neededPerUnit,
        totalNeeded,
        availableStock,
        isSufficient,
        shortage: isSufficient ? 0 : totalNeeded - availableStock,
        unitCost,
        subtotalCost,
      };
    });
  }, [selectedProduct, quantityMade]);

  const hasShortage = materialRequirements.some((m: any) => !m.isSufficient);
  const totalBatchCost = materialRequirements.reduce((sum: number, m: any) => sum + m.subtotalCost, 0);
  const unitHppEstimate = quantityMade > 0 ? roundRupiah(totalBatchCost / quantityMade) : 0;

  const handleRunProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasShortage) {
      alert("Stok bahan baku tidak mencukupi! Silakan kurangi jumlah batch atau lakukan pembelian bahan baku terlebih dahulu.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await recordProductionRun({
        productId: selectedProductId,
        quantityMade,
        notes,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Gagal memproses produksi.");
      } else {
        setSuccessMessage(
          `Berhasil memproduksi ${res.data?.quantityMade} unit "${res.data?.productName}". HPP batch baru: ${formatRupiah(res.data?.unitCost)} / unit.`
        );
        setNotes("");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  if (stockBasedProducts.length === 0) {
    return (
      <Card className="border-[#F2DBE3] bg-[#FFF5F8]/60 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-[#E0688A] mx-auto mb-2" />
        <h3 className="font-bold text-[#231C20] text-sm">
          Belum ada produk dengan mode STOCK_BASED
        </h3>
        <p className="text-xs text-[#75656B] mt-1 max-w-md mx-auto">
          Fitur Produksi Batch khusus digunakan untuk produk standar yang dibuat di muka (mis. lilin aromaterapi, casing polos, tungku).
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Input Runner Form */}
      <Card className="lg:col-span-1 border-t-4 border-t-[#E0688A] shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#231C20]">
            <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
              <Hammer className="w-4 h-4 text-[#E0688A]" />
            </div>
            <span>Eksekusi Batch Produksi</span>
          </CardTitle>
          <CardDescription>
            Pilih produk dan tentukan jumlah unit yang selesai diproduksi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRunProduction} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[#231C20]">Pilih Produk (Stock-Based) *</label>
              <select
                className="w-full mt-1 h-9 rounded-md border border-[#E8C5D1] bg-white px-3 py-1 text-xs text-[#231C20] focus:outline-none focus:ring-2 focus:ring-[#E0688A]"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                {stockBasedProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stok Saat Ini: {p.currentStock} pcs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#231C20]">Jumlah Unit Jadi Dihasilkan *</label>
              <Input
                type="number"
                min="1"
                required
                value={quantityMade}
                onChange={(e) => setQuantityMade(parseInt(e.target.value, 10) || 0)}
                className="mt-1 text-sm font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-[#231C20]">Catatan Batch (Opsional)</label>
              <Input
                placeholder="Contoh: Batch lilin lavender 60ml aroma wangi extra"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Quick Summary Cost */}
            <div className="p-3.5 rounded-xl bg-[#FFF5F8] border border-[#F2DBE3] space-y-1.5">
              <div className="flex justify-between text-[#75656B]">
                <span>Total Biaya Bahan:</span>
                <span className="font-semibold text-[#231C20]">{formatRupiah(totalBatchCost)}</span>
              </div>
              <div className="flex justify-between text-[#231C20] font-bold text-sm pt-1 border-t border-[#F2DBE3]">
                <span>Estimasi HPP Satuan:</span>
                <span className="text-[#E0688A]">{formatRupiah(unitHppEstimate)}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="whitespace-pre-line">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || hasShortage || quantityMade <= 0}
              className={`w-full py-2.5 text-xs font-semibold ${
                hasShortage
                  ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                  : "bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs"
              }`}
            >
              {loading
                ? "Memproses Mutasi Stok..."
                : hasShortage
                ? "Stok Bahan Baku Kurang"
                : `Selesaikan Produksi ${quantityMade} Pcs`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right: Real-time BOM Requirement & Stock Check Table */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3 border-b border-[#F2DBE3]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-[#231C20]">
                Kebutuhan Bahan Baku & Verifikasi Stok
              </CardTitle>
              <CardDescription>
                Resep otomatis dikalikan kuantitas batch ({quantityMade} unit)
              </CardDescription>
            </div>
            {hasShortage ? (
              <Badge variant="destructive" className="text-xs">
                ⚠️ Ada Bahan yang Kurang
              </Badge>
            ) : (
              <Badge variant="success" className="text-xs">
                ✓ Semua Bahan Tersedia
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            {materialRequirements.length === 0 ? (
              <p className="text-xs text-[#75656B] py-6 text-center">
                Produk ini belum memiliki resep Bill of Materials (BOM).
              </p>
            ) : (
              <div className="space-y-2">
                {materialRequirements.map((req: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      req.isSufficient
                        ? "bg-[#FFF5F8]/70 border-[#F2DBE3]"
                        : "bg-rose-50/70 border-rose-200 text-rose-900"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-[#231C20] text-sm">
                        {req.materialName}
                      </p>
                      <p className="text-[11px] text-[#75656B]">
                        Kebutuhan: {req.neededPerUnit} {req.unitSymbol} × {quantityMade} ={" "}
                        <strong className="text-[#231C20]">
                          {formatNumber(req.totalNeeded, 2)} {req.unitSymbol}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="text-[10px] text-[#75656B] block">Stok Tersedia:</span>
                        <span
                          className={`font-bold ${
                            req.isSufficient ? "text-[#231C20]" : "text-rose-700"
                          }`}
                        >
                          {formatNumber(req.availableStock, 2)} {req.unitSymbol}
                        </span>
                        {!req.isSufficient && (
                          <span className="text-[10px] text-rose-600 block font-semibold">
                            (Kurang {formatNumber(req.shortage, 2)} {req.unitSymbol})
                          </span>
                        )}
                      </div>

                      <div className="text-right min-w-24">
                        <span className="text-[10px] text-[#75656B] block">Biaya Terpakai:</span>
                        <span className="font-bold text-[#231C20]">
                          {formatRupiah(req.subtotalCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
