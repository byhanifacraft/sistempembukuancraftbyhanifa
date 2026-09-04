"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatRupiah, roundRupiah } from "@/lib/utils";
import { Plus, Trash2, AlertCircle, Info, Calculator, Sparkles, CheckCircle2 } from "lucide-react";
import { createProduct, updateProduct } from "@/actions/product.actions";
import { ProductionMode } from "@/types/enums";

interface BOMItemRow {
  rawMaterialId: string;
  quantityNeeded: number;
  notes?: string;
}

export function ProductForm({
  initialData,
  categories,
  rawMaterials,
  isEdit = false,
}: {
  initialData?: any;
  categories: any[];
  rawMaterials: any[];
  isEdit?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    sku: initialData?.sku || "",
    categoryId: initialData?.categoryId || categories[0]?.id || "",
    productionMode: initialData?.productionMode || ProductionMode.MADE_TO_ORDER,
    sellingPrice: initialData?.sellingPrice || 0,
    costPrice: initialData?.costPrice || 0,
    currentStock: initialData?.currentStock || 0,
    minStockAlert: initialData?.minStockAlert || 5,
    isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    description: initialData?.description || "",
  });

  const [bomItems, setBomItems] = useState<BOMItemRow[]>(
    initialData?.bomItems?.map((b: any) => ({
      rawMaterialId: b.rawMaterialId,
      quantityNeeded: Number(b.quantityNeeded),
      notes: b.notes || "",
    })) || []
  );

  // Raw material cost lookup
  const materialMap = useMemo(() => {
    return new Map(rawMaterials.map((m) => [m.id, m]));
  }, [rawMaterials]);

  // Live BOM calculated HPP
  const calculatedHpp = useMemo(() => {
    let total = 0;
    for (const item of bomItems) {
      const mat = materialMap.get(item.rawMaterialId);
      if (mat) {
        total += Number(item.quantityNeeded) * mat.avgCostPerUnit;
      }
    }
    return roundRupiah(total);
  }, [bomItems, materialMap]);

  const grossMargin = formData.sellingPrice - calculatedHpp;
  const marginPercent =
    formData.sellingPrice > 0
      ? ((grossMargin / formData.sellingPrice) * 100).toFixed(1)
      : "0";

  const handleAddBOMItem = () => {
    if (rawMaterials.length === 0) return;
    setBomItems([
      ...bomItems,
      {
        rawMaterialId: rawMaterials[0].id,
        quantityNeeded: 1,
        notes: "",
      },
    ]);
  };

  const handleRemoveBOMItem = (index: number) => {
    setBomItems(bomItems.filter((_, i) => i !== index));
  };

  const handleBOMChange = (index: number, field: keyof BOMItemRow, value: any) => {
    const updated = [...bomItems];
    updated[index] = { ...updated[index], [field]: value };
    setBomItems(updated);
  };

  const handleModeChange = (mode: ProductionMode) => {
    if (isEdit && mode !== initialData?.productionMode) {
      if (
        !confirm(
          `PERHATIAN: Mengubah mode produksi dari ${initialData?.productionMode} ke ${mode} akan mengubah cara sistem menghitung stok & HPP transaksi baru ke depannya. Lanjutkan?`
        )
      ) {
        return;
      }
    }
    setFormData({ ...formData, productionMode: mode });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const payload = {
        ...formData,
        costPrice: calculatedHpp,
        bomItems,
      };

      if (isEdit) {
        const res = await updateProduct(initialData.id, payload);
        if (!res.success) {
          setErrorMessage(res.error || "Gagal memperbarui produk.");
        } else {
          router.push("/produk");
          router.refresh();
        }
      } else {
        const res = await createProduct(payload);
        if (!res.success) {
          setErrorMessage(res.error || "Gagal menambahkan produk.");
        } else {
          router.push("/produk");
          router.refresh();
        }
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
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Informasi Produk</CardTitle>
          <CardDescription>Detail nama produk, SKU, dan kategori kerajinan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-[#231C20]">Nama Produk *</label>
              <Input
                required
                placeholder="Contoh: Gantungan Kunci Huruf Resin Custom (Nama/Warna/Glitter)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#231C20]">SKU Produk (Opsional)</label>
              <Input
                placeholder="PROD-GK-01"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="mt-1 text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#231C20]">Kategori Produk *</label>
              <select
                className="w-full mt-1 h-9 rounded-md border border-[#E8C5D1] bg-white px-3 py-1 text-xs text-[#231C20] focus:outline-none focus:ring-2 focus:ring-[#E0688A]"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#231C20]">Deskripsi / Spesifikasi</label>
              <Input
                placeholder="Keterangan ukuran, material utama, dll"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Production Mode Selection (Inti Aturan Bisnis) */}
      <Card className="border-[#E0688A]/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-[#231C20]">
                Mode Produksi & Logika Stok
              </CardTitle>
              <CardDescription>
                Pilih bagaimana barang ini diproduksi dan kapan stok bahan baku dipotong
              </CardDescription>
            </div>
            <span className="text-xs bg-[#FFF0F4] text-[#9B2C54] border border-[#F2DBE3] font-semibold px-2.5 py-1 rounded-full">
              Wajib Dipilih Sesuai Karakter Produk
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: Made To Order */}
            <div
              onClick={() => handleModeChange(ProductionMode.MADE_TO_ORDER)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.productionMode === ProductionMode.MADE_TO_ORDER
                  ? "border-pink-500 bg-pink-50/50 shadow-xs"
                  : "border-[#F2DBE3] bg-[#FFF5F8]/50 hover:border-pink-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="custom" className="text-xs">
                  MADE_TO_ORDER (Kustom / Pesanan)
                </Badge>
                {formData.productionMode === ProductionMode.MADE_TO_ORDER && (
                  <CheckCircle2 className="w-5 h-5 text-[#E0688A]" />
                )}
              </div>
              <h4 className="font-bold text-[#231C20] text-sm">Produk Pesanan Kustom</h4>
              <p className="text-xs text-[#75656B] mt-1 leading-relaxed">
                Contoh: <strong>Gantungan Kunci Custom Nama</strong>, <strong>Pouch Sablon Kustom</strong>.
                <br />
                • Tidak ada stok produk jadi.
                <br />
                • Bahan baku dipotong <strong>LANGSUNG</strong> saat pesanan disimpan.
                <br />
                • Snapshot HPP dihitung otomatis dari resep BOM saat order.
              </p>
            </div>

            {/* Option 2: Stock Based */}
            <div
              onClick={() => handleModeChange(ProductionMode.STOCK_BASED)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.productionMode === ProductionMode.STOCK_BASED
                  ? "border-[#E0688A] bg-[#FFF0F4] shadow-xs"
                  : "border-[#F2DBE3] bg-[#FFF5F8]/50 hover:border-pink-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="text-xs bg-pink-100 text-[#9B2C54] border-pink-200">
                  STOCK_BASED (Batch Produksi)
                </Badge>
                {formData.productionMode === ProductionMode.STOCK_BASED && (
                  <CheckCircle2 className="w-5 h-5 text-[#E0688A]" />
                )}
              </div>
              <h4 className="font-bold text-[#231C20] text-sm">Produk Stok Jadi Standar</h4>
              <p className="text-xs text-[#75656B] mt-1 leading-relaxed">
                Contoh: <strong>Lilin Aromaterapi Gelas 60ml</strong>, <strong>Casing Polos</strong>.
                <br />
                • Diproduksi di muka secara batch melalui menu <em>Produksi Batch</em>.
                <br />
                • Bahan baku dipotong saat produksi.
                <br />
                • Penjualan hanya memotong stok produk jadi.
              </p>
            </div>
          </div>

          {formData.productionMode === ProductionMode.STOCK_BASED && (
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#F2DBE3]">
              <div>
                <label className="text-xs font-semibold text-[#231C20]">Stok Awal Produk Jadi (pcs)</label>
                <Input
                  type="number"
                  disabled={isEdit} // Disabled on edit, use stock adjustment instead
                  value={formData.currentStock}
                  onChange={(e) =>
                    setFormData({ ...formData, currentStock: parseInt(e.target.value, 10) || 0 })
                  }
                  className="mt-1 text-xs"
                />
                {isEdit && (
                  <p className="text-[10px] text-[#75656B] mt-1">
                    Untuk mengubah stok produk jadi yang sudah ada, gunakan menu Opname / Produksi.
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-[#231C20]">Ambang Batas Alert Menipis (pcs)</label>
                <Input
                  type="number"
                  value={formData.minStockAlert}
                  onChange={(e) =>
                    setFormData({ ...formData, minStockAlert: parseInt(e.target.value, 10) || 0 })
                  }
                  className="mt-1 text-xs"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Bill of Materials (BOM Recipe) Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-[#231C20]">
                Resep / Bill of Materials (BOM)
              </CardTitle>
              <CardDescription>
                Bahan baku yang dibutuhkan untuk menghasilkan <strong>1 unit</strong> produk ini
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddBOMItem}
              className="text-xs gap-1.5 border-[#E0688A] text-[#E0688A] hover:bg-[#FFF0F4]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Bahan ke Resep</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {bomItems.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-[#F2DBE3] rounded-xl text-[#75656B] text-xs bg-[#FFF5F8]/40">
              <p>Belum ada bahan baku yang dimasukkan ke dalam resep produk ini.</p>
              <p className="mt-1">
                Klik tombol <strong>&quot;Tambah Bahan ke Resep&quot;</strong> di atas untuk menambahkan bahan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[480px] space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-[#75656B] uppercase px-2">
                  <div className="col-span-5">Bahan Baku</div>
                  <div className="col-span-2 text-right">Kebutuhan (1 unit)</div>
                  <div className="col-span-2 text-right">Harga Satuan</div>
                  <div className="col-span-2 text-right">Subtotal Biaya</div>
                  <div className="col-span-1 text-center">Hapus</div>
                </div>

              {bomItems.map((item, index) => {
                const mat = materialMap.get(item.rawMaterialId);
                const subCost = mat
                  ? roundRupiah(Number(item.quantityNeeded) * mat.avgCostPerUnit)
                  : 0;

                return (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-lg bg-[#FFF5F8]/70 border border-[#F2DBE3] text-xs"
                  >
                    <div className="col-span-5">
                      <select
                        className="w-full h-8 rounded-md border border-[#E8C5D1] bg-white px-2 text-xs text-[#231C20] focus:outline-none focus:ring-1 focus:ring-[#E0688A]"
                        value={item.rawMaterialId}
                        onChange={(e) =>
                          handleBOMChange(index, "rawMaterialId", e.target.value)
                        }
                      >
                        {rawMaterials.map((rm) => (
                          <option key={rm.id} value={rm.id}>
                            {rm.name} ({rm.unit?.symbol})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 flex items-center justify-end space-x-1">
                      <Input
                        type="number"
                        step="any"
                        min="0.001"
                        className="h-8 text-right text-xs w-20"
                        value={item.quantityNeeded}
                        onChange={(e) =>
                          handleBOMChange(
                            index,
                            "quantityNeeded",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                      <span className="text-[11px] text-[#75656B] w-7">
                        {mat?.unit?.symbol}
                      </span>
                    </div>

                    <div className="col-span-2 text-right text-[#4A3B41]">
                      {mat ? formatRupiah(mat.avgCostPerUnit) : "Rp 0"}
                    </div>

                    <div className="col-span-2 text-right font-bold text-[#231C20]">
                      {formatRupiah(subCost)}
                    </div>

                    <div className="col-span-1 text-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50"
                        onClick={() => handleRemoveBOMItem(index)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* HPP Live Summary Box */}
          <div className="p-4 rounded-xl bg-[#FFF5F8] border border-[#F2DBE3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-[#E0688A]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#231C20]">
                  Total Estimasi HPP per 1 Unit:
                </p>
                <p className="text-[11px] text-[#75656B]">
                  Kalkulasi otomatis dari akumulasi biaya bahan baku di atas
                </p>
              </div>
            </div>
            <p className="text-2xl font-bold text-[#E0688A]">
              {formatRupiah(calculatedHpp)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Pricing & Margin Simulation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#231C20]">Harga Jual & Analisis Margin</CardTitle>
          <CardDescription>Tentukan harga jual dan pantau keuntungan per unit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#231C20]">Harga Jual Satuan (Rp) *</label>
              <Input
                type="number"
                required
                min="0"
                value={formData.sellingPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sellingPrice: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="mt-1 text-base font-bold text-[#231C20]"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#FFF5F8]/70 border border-[#F2DBE3]">
              <span className="text-[11px] text-[#75656B] font-medium">Laba Kotor per Unit:</span>
              <p className={`text-lg font-bold mt-0.5 ${grossMargin >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {formatRupiah(grossMargin)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF5F8]/70 border border-[#F2DBE3]">
              <span className="text-[11px] text-[#75656B] font-medium">Margin Keuntungan (%):</span>
              <p className={`text-lg font-bold mt-0.5 ${grossMargin >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {marginPercent}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/produk")}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold px-6"
        >
          {loading ? "Menyimpan..." : isEdit ? "Perbarui Produk" : "Simpan Produk Baru"}
        </Button>
      </div>
    </form>
  );
}
