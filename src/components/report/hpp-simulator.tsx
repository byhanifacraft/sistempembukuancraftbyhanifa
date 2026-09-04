"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatRupiah, roundRupiah } from "@/lib/utils";
import { Calculator, Sparkles, TrendingUp, Info, HelpCircle } from "lucide-react";

export function HppSimulator({ products }: { products: any[] }) {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ""
  );

  const [laborCost, setLaborCost] = useState<number>(1000); // Biaya tenaga per unit
  const [packagingCost, setPackagingCost] = useState<number>(500); // Biaya plastik/box per unit
  const [marketplaceFeePercent, setMarketplaceFeePercent] = useState<number>(6.5); // Biaya admin shopee misal 6.5%
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(50); // Target laba kotor misal 50%

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId);
  }, [products, selectedProductId]);

  // BOM Raw Material Cost
  const rawMaterialCost = useMemo(() => {
    if (!selectedProduct || !selectedProduct.bomItems) return 0;
    let total = 0;
    for (const bom of selectedProduct.bomItems) {
      const unitAvgCost = bom.rawMaterial.avgCostPerUnit || 0;
      total += Number(bom.quantityNeeded) * unitAvgCost;
    }
    return roundRupiah(total);
  }, [selectedProduct]);

  // Total HPP Unit = Bahan Baku + Tenaga Kerja + Kemasan Langsung
  const totalHppPerUnit = rawMaterialCost + laborCost + packagingCost;

  // Suggested Selling Price formula based on target margin:
  // Price = Total HPP / (1 - (TargetMargin% + Fee%)/100)
  const effectiveMargin = targetMarginPercent / 100;
  const effectiveFee = marketplaceFeePercent / 100;
  const divisor = Math.max(0.05, 1 - effectiveMargin - effectiveFee);
  const suggestedPrice = roundRupiah(totalHppPerUnit / divisor);

  // Current Product Selling Price Analysis
  const currentPrice = selectedProduct?.sellingPrice || 0;
  const currentPlatformFee = roundRupiah(currentPrice * effectiveFee);
  const currentNetReceived = currentPrice - currentPlatformFee;
  const currentProfit = currentNetReceived - totalHppPerUnit;
  const currentProfitMarginPercent =
    currentPrice > 0 ? ((currentProfit / currentPrice) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Configuration Inputs */}
      <Card className="lg:col-span-1 border-t-4 border-t-[#E0688A] shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#231C20]">
            <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-[#E0688A]" />
            </div>
            <span>Parameter Biaya & Target Margin</span>
          </CardTitle>
          <CardDescription>
            Pilih produk untuk melihat rincian biaya bahan dan simulasi harga jual ideal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#231C20]">Pilih Produk Kerajinan *</label>
            <select
              className="w-full mt-1 h-9 rounded-md border border-[#E8C5D1] bg-white px-3 py-1 text-xs text-[#231C20] focus:outline-none focus:ring-2 focus:ring-[#E0688A]"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Harga Saat Ini: {formatRupiah(p.sellingPrice)})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FFF5F8] border border-[#F2DBE3] space-y-1">
            <span className="text-[11px] text-[#75656B]">Biaya Bahan Baku (BOM):</span>
            <p className="text-lg font-bold text-[#231C20]">{formatRupiah(rawMaterialCost)}</p>
          </div>

          <div>
            <label className="font-semibold text-[#231C20]">
              Estimasi Upah Tenaga Kerja per Unit (Rp)
            </label>
            <Input
              type="number"
              min="0"
              value={laborCost}
              onChange={(e) => setLaborCost(parseInt(e.target.value, 10) || 0)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="font-semibold text-[#231C20]">
              Estimasi Biaya Kemasan & Label per Unit (Rp)
            </label>
            <Input
              type="number"
              min="0"
              value={packagingCost}
              onChange={(e) => setPackagingCost(parseInt(e.target.value, 10) || 0)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="font-semibold text-[#231C20]">
              Perkiraan Potongan Fee Marketplace (%)
            </label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={marketplaceFeePercent}
              onChange={(e) => setMarketplaceFeePercent(parseFloat(e.target.value) || 0)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="font-semibold text-[#231C20]">
              Target Margin Keuntungan Bersih (%)
            </label>
            <Input
              type="number"
              min="5"
              max="90"
              value={targetMarginPercent}
              onChange={(e) => setTargetMarginPercent(parseInt(e.target.value, 10) || 0)}
              className="mt-1 font-bold text-[#E0688A]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Right: Simulation Results & Recommendation */}
      <div className="lg:col-span-2 space-y-6">
        {/* Recommendation Banner */}
        <Card className="border-2 border-[#E0688A]/30 bg-[#FFF5F8]/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#E0688A] uppercase tracking-wider">
                  HASIL SIMULASI HARGA JUAL IDEAL
                </span>
                <CardTitle className="text-xl font-bold text-[#231C20] mt-1">
                  {selectedProduct?.name}
                </CardTitle>
              </div>
              <Badge variant="default" className="text-xs py-1 px-3">
                Target Margin {targetMarginPercent}%
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-white border border-[#F2DBE3]">
                <span className="text-[11px] text-[#75656B] block">Total HPP per Unit:</span>
                <p className="text-xl font-bold text-[#231C20] mt-0.5">
                  {formatRupiah(totalHppPerUnit)}
                </p>
                <p className="text-[10px] text-[#75656B] mt-1">
                  Bahan + Upah + Kemasan
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border-2 border-emerald-500">
                <span className="text-[11px] text-emerald-800 font-semibold block">
                  Rekomendasi Harga Jual:
                </span>
                <p className="text-2xl font-bold text-emerald-700 mt-0.5">
                  {formatRupiah(suggestedPrice)}
                </p>
                <p className="text-[10px] text-[#75656B] mt-1">
                  Sudah mengcover fee {marketplaceFeePercent}%
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#F2DBE3]">
                <span className="text-[11px] text-[#75656B] block">Harga Jual Saat Ini:</span>
                <p className="text-xl font-bold text-[#231C20] mt-0.5">
                  {formatRupiah(currentPrice)}
                </p>
                <p className={`text-[11px] font-bold mt-1 ${currentProfit >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  Profit: {formatRupiah(currentProfit)} ({currentProfitMarginPercent}%)
                </p>
              </div>
            </div>

            {/* Price Health Diagnostic */}
            <div className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
              currentPrice >= suggestedPrice * 0.95
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-rose-50 border-rose-200 text-rose-900"
            }`}>
              <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-[#E0688A]" />
              <div>
                <p className="font-bold">
                  {currentPrice >= suggestedPrice * 0.95
                    ? "Harga jual saat ini sudah sangat sehat & menguntungkan!"
                    : "Peringatan: Harga jual saat ini berpotensi terlalu tipis / merugi!"}
                </p>
                <p className="text-[11px] mt-0.5 leading-relaxed">
                  {currentPrice >= suggestedPrice * 0.95
                    ? `Dengan harga jual ${formatRupiah(currentPrice)}, usaha mendapatkan keuntungan bersih sebesar ${formatRupiah(currentProfit)} per pcs setelah dipotong biaya bahan, kemasan, upah, dan biaya marketplace.`
                    : `Dengan kenaikan harga bahan baku terkini, harga jual ${formatRupiah(currentPrice)} hanya menyisakan margin ${currentProfitMarginPercent}%. Disarankan menaikkan harga jual mendekati ${formatRupiah(suggestedPrice)}.`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BOM Ingredients Breakdown */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#F2DBE3]">
            <CardTitle className="text-sm font-semibold text-[#231C20]">
              Rincian Resep Bahan Baku Produk Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            {selectedProduct?.bomItems?.map((bom: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#FFF5F8]/70 border border-[#F2DBE3]"
              >
                <div>
                  <span className="font-semibold text-[#231C20]">
                    {bom.rawMaterial.name}
                  </span>
                  <span className="text-[#75656B] text-[11px] block">
                    {bom.quantityNeeded} {bom.rawMaterial.unit?.symbol} @ {formatRupiah(bom.rawMaterial.avgCostPerUnit)}
                  </span>
                </div>
                <span className="font-bold text-[#231C20]">
                  {formatRupiah(roundRupiah(Number(bom.quantityNeeded) * bom.rawMaterial.avgCostPerUnit))}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
