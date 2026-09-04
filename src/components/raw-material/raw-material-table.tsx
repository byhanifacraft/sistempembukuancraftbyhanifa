"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatRupiah } from "@/lib/utils";
import { Plus, Search, SlidersHorizontal, AlertCircle, Edit, Trash2 } from "lucide-react";
import { createRawMaterial, updateRawMaterial, adjustRawMaterialStock, deleteRawMaterial } from "@/actions/raw-material.actions";

export function RawMaterialTable({
  rawMaterials,
  units,
}: {
  rawMaterials: any[];
  units: any[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // New Material Form State
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    unitId: units[0]?.id || "",
    currentStock: 0,
    minimumStock: 10,
    avgCostPerUnit: 0,
    description: "",
  });

  // Edit Material Form State
  const [editFormData, setEditFormData] = useState({
    name: "",
    sku: "",
    unitId: "",
    minimumStock: 10,
    avgCostPerUnit: 0,
    lastCostPerUnit: 0,
    description: "",
  });

  // Adjust Stock State
  const [newStockInput, setNewStockInput] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState("Koreksi Opname Fisik");
  const [adjustNotes, setAdjustNotes] = useState("");

  const filtered = rawMaterials.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.sku && m.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await createRawMaterial(formData);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal menyimpan bahan baku.");
      } else {
        setIsAddOpen(false);
        setFormData({
          name: "",
          sku: "",
          unitId: units[0]?.id || "",
          currentStock: 0,
          minimumStock: 10,
          avgCostPerUnit: 0,
          description: "",
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (material: any) => {
    setSelectedMaterial(material);
    setEditFormData({
      name: material.name,
      sku: material.sku || "",
      unitId: material.unitId,
      minimumStock: Number(material.minimumStock) || 10,
      avgCostPerUnit: Number(material.avgCostPerUnit) || 0,
      lastCostPerUnit: Number(material.lastCostPerUnit) || Number(material.avgCostPerUnit) || 0,
      description: material.description || "",
    });
    setErrorMessage("");
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await updateRawMaterial(selectedMaterial.id, editFormData);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal memperbarui bahan baku.");
      } else {
        setIsEditOpen(false);
        setSelectedMaterial(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await adjustRawMaterialStock({
        rawMaterialId: selectedMaterial.id,
        newStock: newStockInput,
        reason: adjustReason,
        notes: adjustNotes,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Gagal menyesuaikan stok.");
      } else {
        setIsAdjustOpen(false);
        setSelectedMaterial(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus bahan baku ini?")) return;
    const res = await deleteRawMaterial(id);
    if (!res.success) {
      alert(res.error);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-[#F2DBE3]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <Input
              placeholder="Cari nama bahan / SKU..."
              className="pl-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            size="sm"
            className="text-xs gap-1.5 bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold"
            onClick={() => {
              setErrorMessage("");
              setIsAddOpen(true);
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Bahan Baku</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <Table className="min-w-[680px]">
          <TableHeader>
            <TableRow>
              <TableHead>Nama Bahan Baku & SKU</TableHead>
              <TableHead>Satuan</TableHead>
              <TableHead className="text-right">Stok Saat Ini</TableHead>
              <TableHead className="text-right">Batas Minimum</TableHead>
              <TableHead className="text-right">Harga Rata-rata (HPP)</TableHead>
              <TableHead className="text-right">Harga Terakhir</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-stone-400 text-xs">
                  Tidak ada data bahan baku yang cocok.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => {
                const isLow = Number(m.currentStock) <= Number(m.minimumStock);
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <p className="font-semibold text-stone-900 text-sm">{m.name}</p>
                      <p className="text-[10px] text-stone-500 font-mono">
                        SKU: {m.sku || "-"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {m.unit?.name} ({m.unit?.symbol})
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-stone-900">
                      {formatNumber(Number(m.currentStock), 1)} {m.unit?.symbol}
                    </TableCell>
                    <TableCell className="text-right text-stone-600 text-xs">
                      {formatNumber(Number(m.minimumStock), 1)} {m.unit?.symbol}
                    </TableCell>
                    <TableCell className="text-right font-medium text-stone-800">
                      {formatRupiah(m.avgCostPerUnit)} / {m.unit?.symbol}
                    </TableCell>
                    <TableCell className="text-right text-stone-600 text-xs">
                      {formatRupiah(m.lastCostPerUnit)}
                    </TableCell>
                    <TableCell className="text-center">
                      {isLow ? (
                        <Badge variant="warning" className="text-[10px]">
                          Menipis
                        </Badge>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          Aman
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] gap-1"
                          onClick={() => {
                            setSelectedMaterial(m);
                            setNewStockInput(Number(m.currentStock));
                            setErrorMessage("");
                            setIsAdjustOpen(true);
                          }}
                          title="Sesuaikan Stok"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span>Opname</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                          onClick={() => handleOpenEdit(m)}
                          title="Edit Bahan Baku"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDelete(m.id)}
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Modal Tambah Bahan Baku */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#F2DBE3] max-w-md w-full p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F2DBE3] pb-3">
              <h3 className="font-bold text-[#231C20] text-base">
                Tambah Bahan Baku Baru
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-[#231C20]">Nama Bahan Baku *</label>
                <Input
                  required
                  placeholder="Contoh: Resin Epoxy Bening (1:1)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#231C20]">SKU / Kode (Opsional)</label>
                  <Input
                    placeholder="RM-RESIN-01"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#231C20]">Satuan *</label>
                  <select
                    className="w-full mt-1 h-9 rounded-md border border-[#E8C5D1] bg-white px-3 py-1 text-xs text-[#231C20] focus:outline-none focus:ring-2 focus:ring-[#E0688A]"
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    required
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-medium text-[#231C20]">Stok Awal</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.currentStock}
                    onChange={(e) =>
                      setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#231C20]">Batas Minimum</label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.minimumStock}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumStock: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#231C20]">Harga Beli Satuan (Rp)</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.avgCostPerUnit}
                    onChange={(e) =>
                      setFormData({ ...formData, avgCostPerUnit: parseInt(e.target.value, 10) || 0 })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[#231C20]">Deskripsi / Catatan Tambahan</label>
                <Input
                  placeholder="Keterangan merk supplier, jenis kemasan, dll"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="pt-3 border-t border-[#F2DBE3] flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold"
                >
                  {loading ? "Menyimpan..." : "Simpan Bahan Baku"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Bahan Baku */}
      {isEditOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#F2DBE3] max-w-md w-full p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F2DBE3] pb-3">
              <h3 className="font-bold text-[#231C20] text-base">
                Edit Bahan Baku
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-[#231C20]">Nama Bahan Baku *</label>
                <Input
                  required
                  placeholder="Contoh: Resin Epoxy Bening (1:1)"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#231C20]">SKU / Kode (Opsional)</label>
                  <Input
                    placeholder="RM-RESIN-01"
                    value={editFormData.sku}
                    onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#231C20]">Satuan *</label>
                  <select
                    className="w-full mt-1 h-9 rounded-md border border-[#E8C5D1] bg-white px-3 py-1 text-xs text-[#231C20] focus:outline-none focus:ring-2 focus:ring-[#E0688A]"
                    value={editFormData.unitId}
                    onChange={(e) => setEditFormData({ ...editFormData, unitId: e.target.value })}
                    required
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#231C20]">Batas Minimum Peringatan</label>
                  <Input
                    type="number"
                    step="any"
                    value={editFormData.minimumStock}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, minimumStock: parseFloat(e.target.value) || 0 })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#231C20]">Harga Beli Satuan Rata-rata (Rp)</label>
                  <Input
                    type="number"
                    min="0"
                    value={editFormData.avgCostPerUnit}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        avgCostPerUnit: parseInt(e.target.value, 10) || 0,
                        lastCostPerUnit: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[#231C20]">Deskripsi / Catatan Tambahan</label>
                <Input
                  placeholder="Keterangan merk supplier, jenis kemasan, dll"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div className="pt-3 border-t border-[#F2DBE3] flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold"
                >
                  {loading ? "Menyimpan..." : "Perbarui Bahan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sesuaikan Stok (Opname) */}
      {isAdjustOpen && selectedMaterial && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#F2DBE3] max-w-md w-full p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F2DBE3] pb-3">
              <div>
                <h3 className="font-bold text-[#231C20] text-base">
                  Opname / Penyesuaian Stok
                </h3>
                <p className="text-xs text-[#75656B]">{selectedMaterial.name}</p>
              </div>
              <button
                onClick={() => setIsAdjustOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleAdjust} className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#FFF5F8] border border-[#F2DBE3] flex justify-between">
                <span className="text-[#75656B]">Stok Tercatat Saat Ini:</span>
                <span className="font-bold text-[#231C20]">
                  {Number(selectedMaterial.currentStock)} {selectedMaterial.unit?.symbol}
                </span>
              </div>

              <div>
                <label className="font-medium text-[#231C20]">Jumlah Stok Fisik Sebenarnya *</label>
                <Input
                  type="number"
                  step="any"
                  required
                  value={newStockInput}
                  onChange={(e) => setNewStockInput(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="font-medium text-[#231C20]">Alasan Penyesuaian *</label>
                <select
                  className="w-full mt-1 h-9 rounded-md border border-[#E8C5D1] bg-white px-3 py-1 text-xs text-[#231C20] focus:outline-none focus:ring-2 focus:ring-[#E0688A]"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                >
                  <option value="Koreksi Opname Fisik">Koreksi Opname Fisik Bulanan</option>
                  <option value="Bahan Baku Rusak / Tumpah">Bahan Baku Rusak / Tumpah / Bocor</option>
                  <option value="Bahan Baku Expired">Kadaluarsa / Mengeras</option>
                  <option value="Bonus / Sample dari Supplier">Bonus / Sampel Tambahan Supplier</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-[#231C20]">Catatan Detail</label>
                <Input
                  placeholder="Tuliskan catatan tambahan..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="pt-3 border-t border-[#F2DBE3] flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdjustOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold"
                >
                  {loading ? "Menyimpan..." : "Update Stok"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
