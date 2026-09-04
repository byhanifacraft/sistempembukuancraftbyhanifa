"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatRupiah } from "@/lib/utils";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  parseShopeeBuffer,
  previewShopeeData,
  executeShopeeImport,
  ShopeeParsedItem,
  ProductMappingSuggestion,
} from "@/actions/shopee-import.actions";

export function ShopeeImportWizard({
  activeProducts,
}: {
  activeProducts: any[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<"UPLOAD" | "PREVIEW" | "SUCCESS">("UPLOAD");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // File state
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [parsedData, setParsedData] = useState<{
    items: ShopeeParsedItem[];
    totalRows: number;
    totalOrders: number;
    duplicateOrderCount: number;
    duplicateOrderSns: string[];
    productSuggestions: ProductMappingSuggestion[];
  } | null>(null);

  // User confirmed mappings state
  const [confirmedMappings, setConfirmedMappings] = useState<
    Map<string, { productId: string; productName: string }>
  >(new Map());

  // Import Result Summary
  const [importResult, setImportResult] = useState<any>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMessage("");

    try {
      setFileInfo({ name: file.name, size: file.size });

      // Read as base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = (reader.result as string).split(",")[1];
          const { rows } = await parseShopeeBuffer(base64Content, file.name);

          if (!rows || rows.length === 0) {
            setErrorMessage("File kosong atau tidak memiliki data pesanan.");
            setLoading(false);
            return;
          }

          const preview = await previewShopeeData(rows);
          setParsedData(preview);

          // Pre-populate confirmed mappings with MATCHED & SUGGESTED items
          const initialMap = new Map<string, { productId: string; productName: string }>();
          for (const s of preview.productSuggestions) {
            if (s.mappedProductId && s.mappedProductName) {
              const key = `${s.shopeeProductName.trim().toLowerCase()}|||${(s.shopeeVariation || "").trim().toLowerCase()}`;
              initialMap.set(key, {
                productId: s.mappedProductId,
                productName: s.mappedProductName,
              });
            }
          }
          setConfirmedMappings(initialMap);
          setStep("PREVIEW");
        } catch (err: any) {
          setErrorMessage(err.message || "Gagal memproses file.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err.message || "Gagal mengunggah file.");
      setLoading(false);
    }
  };

  const handleMappingChange = (
    shopeeProductName: string,
    shopeeVariation: string,
    productId: string
  ) => {
    const key = `${shopeeProductName.trim().toLowerCase()}|||${(shopeeVariation || "").trim().toLowerCase()}`;
    const selectedProd = activeProducts.find((p) => p.id === productId);

    const updated = new Map(confirmedMappings);
    if (selectedProd) {
      updated.set(key, {
        productId: selectedProd.id,
        productName: selectedProd.name,
      });
    } else {
      updated.delete(key);
    }
    setConfirmedMappings(updated);
  };

  // Check if all product suggestions are mapped
  const allProductsMapped = useMemo(() => {
    if (!parsedData) return false;
    for (const s of parsedData.productSuggestions) {
      const key = `${s.shopeeProductName.trim().toLowerCase()}|||${(s.shopeeVariation || "").trim().toLowerCase()}`;
      if (!confirmedMappings.has(key)) {
        return false;
      }
    }
    return true;
  }, [parsedData, confirmedMappings]);

  const handleExecuteImport = async () => {
    if (!parsedData || !fileInfo) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const mappingPayload = Array.from(confirmedMappings.entries()).map(([key, val]) => {
        const [prodName, variation] = key.split("|||");
        return {
          shopeeProductName: prodName,
          shopeeVariation: variation || "",
          mappedProductId: val.productId,
        };
      });

      const res = await executeShopeeImport({
        fileName: fileInfo.name,
        fileSize: fileInfo.size,
        items: parsedData.items,
        confirmedMappings: mappingPayload,
        skipDuplicates: true,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Gagal menyelesaikan proses impor.");
      } else {
        setImportResult(res.data);
        setStep("SUCCESS");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {errorMessage && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="whitespace-pre-line">{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: UPLOAD SCREEN */}
      {step === "UPLOAD" && (
        <Card className="border-2 border-dashed border-[#F2DBE3] bg-[#FFF5F8]/50 p-8 text-center rounded-2xl">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-pink-100 text-[#E0688A] flex items-center justify-center mx-auto shadow-xs">
              <FileSpreadsheet className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#231C20]">
                Unggah Laporan Pesanan Shopee Seller Center
              </h3>
              <p className="text-xs text-[#75656B] mt-1 leading-relaxed">
                Mendukung format file <strong>.xlsx (Excel)</strong> dan <strong>.csv</strong> hasil unduhan menu <em>Pesanan Saya &gt; Export</em> di Shopee Seller Center.
              </p>
            </div>

            <div className="pt-2">
              <label className="inline-block">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
                <Button
                  type="button"
                  size="lg"
                  disabled={loading}
                  className="bg-[#E0688A] text-white hover:bg-[#D45679] gap-2 font-semibold shadow-xs"
                  onClick={(e) => {
                    const input = (e.currentTarget.parentElement as HTMLElement)?.querySelector("input");
                    input?.click();
                  }}
                >
                  <UploadCloud className="w-5 h-5" />
                  <span>{loading ? "Menganalisis File..." : "Pilih File Shopee (.xlsx / .csv)"}</span>
                </Button>
              </label>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#F2DBE3] text-left text-xs text-[#75656B] space-y-1">
              <p className="font-semibold text-[#231C20] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#E0688A]" />
                <span>Fitur Cerdas Impor CraftByHanifa:</span>
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-stone-500">
                <li>Deteksi otomatis kolom variasi & catatan kustom pembeli.</li>
                <li>Pencegahan duplikasi pesanan yang sudah pernah diimpor sebelumnya.</li>
                <li>Pencocokan nama produk cerdas (Fuzzy Matching).</li>
                <li>Audit trail & tombol Rollback jika ada salah impor.</li>
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: PREVIEW & CONFIRMATION SCREEN */}
      {step === "PREVIEW" && parsedData && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <span className="text-xs text-stone-500 font-medium">Total Baris File</span>
                <CardTitle className="text-xl font-bold text-stone-900">
                  {parsedData.totalRows} Baris
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <span className="text-xs text-stone-500 font-medium">Total Pesanan Unik</span>
                <CardTitle className="text-xl font-bold text-stone-900">
                  {parsedData.totalOrders} Pesanan
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className={parsedData.duplicateOrderCount > 0 ? "border-rose-300 bg-rose-50/40" : ""}>
              <CardHeader className="pb-2">
                <span className="text-xs text-rose-800 font-medium">Sudah Pernah Diimpor (Duplikat)</span>
                <CardTitle className="text-xl font-bold text-rose-950">
                  {parsedData.duplicateOrderCount} Pesanan
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="border-l-4 border-l-emerald-600">
              <CardHeader className="pb-2">
                <span className="text-xs text-emerald-800 font-medium">Pesanan Baru Siap Impor</span>
                <CardTitle className="text-xl font-bold text-emerald-900">
                  {parsedData.totalOrders - parsedData.duplicateOrderCount} Pesanan
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Product Matching & Human Confirmation Table (WAJIB MANUAL CONFIRMATION) */}
          <Card className="border-2 border-[#E0688A]/30">
            <CardHeader className="bg-[#FFF5F8] pb-3 border-b border-[#F2DBE3]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold text-[#231C20] flex items-center gap-2">
                    <span>Konfirmasi Pemetaan Produk Shopee &rarr; Katalog Master</span>
                  </CardTitle>
                  <CardDescription>
                    Pastikan setiap nama produk dari Shopee dipetakan ke produk master yang benar agar HPP dan stok terkalkulasi akurat.
                  </CardDescription>
                </div>

                {allProductsMapped ? (
                  <Badge variant="success" className="text-xs py-1 px-3">
                    ✓ Semua Produk Sudah Dipetakan
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-xs py-1 px-3">
                    ⚠️ Ada Produk Belum Dipetakan
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Produk di Shopee</TableHead>
                    <TableHead>Variasi Shopee</TableHead>
                    <TableHead>Tingkat Kecocokan</TableHead>
                    <TableHead>Petakan ke Produk Katalog Master CraftByHanifa *</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.productSuggestions.map((s, idx) => {
                    const key = `${s.shopeeProductName.trim().toLowerCase()}|||${(s.shopeeVariation || "").trim().toLowerCase()}`;
                    const currentSelected = confirmedMappings.get(key);

                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-[#231C20] text-xs">
                          {s.shopeeProductName}
                        </TableCell>
                        <TableCell className="text-xs text-[#75656B] font-mono">
                          {s.shopeeVariation || "-"}
                        </TableCell>
                        <TableCell>
                          {s.status === "MATCHED" ? (
                            <Badge variant="success" className="text-[10px]">
                              100% Cocok (Mapping Tersimpan)
                            </Badge>
                          ) : s.status === "SUGGESTED" ? (
                            <Badge variant="secondary" className="text-[10px] bg-pink-100 text-[#9B2C54] border border-pink-200">
                              Saran Otomatis ({(s.confidenceScore * 100).toFixed(0)}%)
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">
                              Belum Cocok
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="min-w-64">
                          <select
                            className="w-full h-8 rounded-md border border-[#E8C5D1] bg-white px-2 text-xs text-[#231C20] focus:outline-none focus:ring-2 focus:ring-[#E0688A]"
                            value={currentSelected?.productId || ""}
                            onChange={(e) =>
                              handleMappingChange(
                                s.shopeeProductName,
                                s.shopeeVariation,
                                e.target.value
                              )
                            }
                          >
                            <option value="">-- Pilih Produk Master yang Sesuai --</option>
                            {activeProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.productionMode})
                              </option>
                            ))}
                          </select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Sample Rows Preview */}
          <Card>
            <CardHeader className="pb-3 border-b border-[#F2DBE3]">
              <CardTitle className="text-sm font-semibold text-[#231C20]">
                Preview Data Pesanan (5 Baris Pertama)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pesanan</TableHead>
                    <TableHead>Status Shopee</TableHead>
                    <TableHead>Nama Produk & Variasi</TableHead>
                    <TableHead className="text-right">Harga Deal</TableHead>
                    <TableHead className="text-center">Jumlah</TableHead>
                    <TableHead>Pesan Pembeli (Custom Note)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.items.slice(0, 5).map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs text-stone-700">
                        {item.orderSn}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">
                          {item.orderStatus || "Selesai"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="font-semibold text-stone-900">{item.productName}</p>
                        {item.variation && (
                          <p className="text-[10px] text-stone-500 font-mono">
                            Varian: {item.variation}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs">
                        {formatRupiah(item.dealPrice)}
                      </TableCell>
                      <TableCell className="text-center text-xs font-bold">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-xs text-indigo-700 max-w-xs">
                        {item.buyerNote ? `🎨 ${item.buyerNote}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStep("UPLOAD");
                setParsedData(null);
              }}
            >
              Ganti File
            </Button>

            <Button
              size="lg"
              disabled={loading || !allProductsMapped}
              className={`text-sm px-8 font-bold ${
                allProductsMapped
                  ? "bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs"
                  : "bg-stone-300 text-stone-500 cursor-not-allowed"
              }`}
              onClick={handleExecuteImport}
            >
              {loading
                ? "Menyimpan Transaksi & Memotong Stok..."
                : allProductsMapped
                ? "Simpan & Import Transaksi Shopee"
                : "Harap Lengkapi Pemetaan Produk di Atas"}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: SUCCESS SUMMARY SCREEN */}
      {step === "SUCCESS" && importResult && (
        <Card className="border-emerald-200 bg-emerald-50/40 p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-[#231C20]">
              Impor Data Shopee Berhasil!
            </h3>
            <p className="text-xs text-[#75656B] mt-1">
              Data transaksi telah tersimpan, HPP snapshot terkunci, dan stok bahan baku / produk jadi telah diperbarui secara otomatis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto text-left">
            <div className="p-3.5 rounded-lg bg-white border border-emerald-200">
              <span className="text-[11px] text-[#75656B] block">Berhasil Diimpor:</span>
              <span className="text-xl font-bold text-emerald-800">
                {importResult.importedCount} Pesanan
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-emerald-200">
              <span className="text-[11px] text-[#75656B] block">Duplikat Dilewati:</span>
              <span className="text-xl font-bold text-rose-700">
                {importResult.skippedDuplicateCount} Pesanan
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-emerald-200">
              <span className="text-[11px] text-[#75656B] block">Gagal:</span>
              <span className="text-xl font-bold text-[#231C20]">
                {importResult.failedCount} Pesanan
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStep("UPLOAD");
                setParsedData(null);
                setImportResult(null);
              }}
            >
              Impor File Lain
            </Button>
            <Button
              size="sm"
              className="bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold"
              onClick={() => router.push("/transaksi")}
            >
              Lihat Transaksi Penjualan &rarr;
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
