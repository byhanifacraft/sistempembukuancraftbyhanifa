"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatRupiah, roundRupiah } from "@/lib/utils";
import { Plus, Trash2, ShoppingCart, AlertCircle, CheckCircle2, User, CreditCard } from "lucide-react";
import { createOfflineOrder } from "@/actions/order.actions";
import { ProductionMode } from "@/types/enums";

interface OrderItemRow {
  productId?: string;
  productName: string;
  productSku?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  customNote?: string;
}

export function OfflineOrderForm({
  products,
}: {
  products: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<any>("CASH");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<OrderItemRow[]>([
    {
      productId: products[0]?.id || "",
      productName: products[0]?.name || "",
      productSku: products[0]?.sku || "",
      variantName: "",
      quantity: 1,
      unitPrice: products[0]?.sellingPrice || 0,
      customNote: "",
    },
  ]);

  const productMap = useMemo(() => {
    return new Map(products.map((p) => [p.id, p]));
  }, [products]);

  const handleProductSelect = (index: number, productId: string) => {
    const selected = productMap.get(productId);
    const updated = [...items];
    if (selected) {
      updated[index] = {
        ...updated[index],
        productId: selected.id,
        productName: selected.name,
        productSku: selected.sku || "",
        unitPrice: selected.sellingPrice,
      };
    } else {
      updated[index] = {
        ...updated[index],
        productId: undefined,
      };
    }
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof OrderItemRow, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleAddItem = () => {
    const defaultProd = products[0];
    setItems([
      ...items,
      {
        productId: defaultProd?.id || "",
        productName: defaultProd?.name || "",
        productSku: defaultProd?.sku || "",
        variantName: "",
        quantity: 1,
        unitPrice: defaultProd?.sellingPrice || 0,
        customNote: "",
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.unitPrice || 0), 0);
  const grandTotal = Math.max(0, subtotal - (discountAmount || 0) + (shippingFee || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Harap masukkan minimal 1 produk pesanan.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const payload = {
        customerName: customerName || "Pelanggan Offline",
        customerPhone: customerPhone || null,
        orderDate: new Date(),
        paymentMethod,
        discountAmount,
        shippingFee,
        notes: notes || null,
        items,
      };

      const res = await createOfflineOrder(payload);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal mencatat transaksi.");
      } else {
        router.push(`/transaksi/${res.data?.id}`);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan sistem.");
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

      {/* Customer & Payment Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#231C20]">
              <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                <User className="w-4 h-4 text-[#E0688A]" />
              </div>
              <span>Data Pelanggan & Pembayaran</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#231C20]">Nama Pelanggan / Pembeli</label>
                <Input
                  placeholder="Contoh: Kak Dinda (Magetan)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#231C20]">No. WhatsApp / Telepon (Opsional)</label>
                <Input
                  placeholder="08123456789"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1 text-xs font-mono"
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
                  <option value="CASH">Tunai / Cash</option>
                  <option value="BANK_TRANSFER">Transfer Bank (BCA / Mandiri / BRI)</option>
                  <option value="QRIS">QRIS / E-Wallet</option>
                  <option value="SHOPEE_PAY">ShopeePay</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#231C20]">Catatan Pesanan Khusus</label>
                <Input
                  placeholder="Contoh: Diambil sore hari di workshop Desa Bogem"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Calculation Summary */}
        <Card className="border-t-4 border-t-[#E0688A] shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-[#231C20]">Ringkasan Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-xs text-[#75656B]">
              <span>Subtotal Produk:</span>
              <span className="font-semibold text-[#231C20]">{formatRupiah(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-xs text-[#75656B]">
              <span>Diskon / Potongan:</span>
              <Input
                type="number"
                min="0"
                className="w-24 h-7 text-right text-xs"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseInt(e.target.value, 10) || 0)}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-[#75656B]">
              <span>Ongkos Kirim:</span>
              <Input
                type="number"
                min="0"
                className="w-24 h-7 text-right text-xs"
                value={shippingFee}
                onChange={(e) => setShippingFee(parseInt(e.target.value, 10) || 0)}
              />
            </div>

            <div className="pt-3 border-t border-[#F2DBE3] flex justify-between items-center text-base font-bold text-[#231C20]">
              <span>Total Tagihan:</span>
              <span className="text-[#E0688A] text-xl">{formatRupiah(grandTotal)}</span>
            </div>

            <Button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs mt-2 py-2.5 text-xs font-bold"
            >
              {loading ? "Menyimpan Transaksi..." : "Simpan & Cetak Nota"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Items Section */}
      <Card>
        <CardHeader className="pb-3 border-b border-[#F2DBE3]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#231C20]">
                <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-[#E0688A]" />
                </div>
                <span>Rincian Produk Belanja</span>
              </CardTitle>
              <CardDescription>
                Pilih produk master, masukkan jumlah, dan cantumkan catatan kustomisasi
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
              <span>+ Tambah Baris Produk</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {items.map((item, index) => {
            const selectedProd = item.productId ? productMap.get(item.productId) : null;
            const isMadeToOrder = selectedProd?.productionMode === ProductionMode.MADE_TO_ORDER;

            return (
              <div
                key={index}
                className="p-3.5 rounded-xl bg-[#FFF5F8]/70 border border-[#F2DBE3] space-y-2 text-xs"
              >
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-12 sm:col-span-5">
                    <label className="text-[11px] font-semibold text-[#75656B] block mb-1">
                      Pilih Produk Katalog *
                    </label>
                    <select
                      className="w-full h-8 rounded-md border border-[#E8C5D1] bg-white px-2 text-xs text-[#231C20] focus:outline-none focus:ring-1 focus:ring-[#E0688A]"
                      value={item.productId || ""}
                      onChange={(e) => handleProductSelect(index, e.target.value)}
                      required
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatRupiah(p.sellingPrice)}) - [
                          {p.productionMode === ProductionMode.MADE_TO_ORDER
                            ? "Custom"
                            : `Stok Jadi: ${p.currentStock}`}
                          ]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-[#75656B] block mb-1">
                      Kuantitas
                    </label>
                    <Input
                      type="number"
                      min="1"
                      required
                      className="h-8 text-center text-xs"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", parseInt(e.target.value, 10) || 1)
                      }
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-[#75656B] block mb-1">
                      Harga Satuan (Rp)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      required
                      className="h-8 text-right text-xs"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(index, "unitPrice", parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-2 text-right">
                    <span className="text-[10px] text-[#75656B] block">Subtotal</span>
                    <span className="font-bold text-[#231C20] text-sm">
                      {formatRupiah(item.quantity * item.unitPrice)}
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

                {/* Custom Note Input (Crucial for handmade craft custom orders) */}
                <div className="pt-2 border-t border-[#F2DBE3] flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#9B2C54] bg-[#FFF0F4] px-2 py-0.5 rounded-full border border-[#F2DBE3] shrink-0">
                    🎨 Catatan Kustom:
                  </span>
                  <Input
                    placeholder="Contoh: Custom Huruf H (Warna Lilac + Foil Emas, Nama: Hanifa)"
                    value={item.customNote || ""}
                    onChange={(e) => handleItemChange(index, "customNote", e.target.value)}
                    className="h-8 text-xs flex-1 bg-white border-[#F2DBE3] text-[#231C20] placeholder:text-stone-400"
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </form>
  );
}
