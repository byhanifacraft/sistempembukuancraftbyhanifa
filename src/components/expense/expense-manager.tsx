"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatIndonesianDate, formatRupiah } from "@/lib/utils";
import { Plus, Trash2, Receipt, AlertCircle, Edit } from "lucide-react";
import { createExpense, updateExpense, deleteExpense } from "@/actions/expense.actions";

export function ExpenseManager({
  expenses,
  categories,
}: {
  expenses: any[];
  categories: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<any>("CASH");
  const [notes, setNotes] = useState("");

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    categoryId: "",
    title: "",
    amount: 0,
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH",
    notes: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      alert("Masukkan nominal pengeluaran yang valid.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await createExpense({
        categoryId,
        title,
        amount,
        expenseDate: new Date(expenseDate),
        paymentMethod,
        notes,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Gagal mencatat pengeluaran.");
      } else {
        setTitle("");
        setAmount(0);
        setNotes("");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (expense: any) => {
    setSelectedExpense(expense);
    const dateStr = expense.expenseDate
      ? new Date(expense.expenseDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    setEditFormData({
      categoryId: expense.categoryId,
      title: expense.title,
      amount: expense.amount,
      expenseDate: dateStr,
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || "",
    });
    setErrorMessage("");
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await updateExpense(selectedExpense.id, {
        ...editFormData,
        expenseDate: new Date(editFormData.expenseDate),
      });

      if (!res.success) {
        setErrorMessage(res.error || "Gagal memperbarui pengeluaran.");
      } else {
        setIsEditOpen(false);
        setSelectedExpense(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan pengeluaran ini?")) return;
    const res = await deleteExpense(id);
    if (!res.success) alert(res.error);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Create Form */}
      <Card className="lg:col-span-1 border-t-4 border-t-[#E0688A] shadow-xs">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#231C20]">
            <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-[#E0688A]" />
            </div>
            <span>Catat Beban Operasional</span>
          </CardTitle>
          <CardDescription>
            Pengeluaran non-bahan baku (listrik, kemasan, ongkir talangan, dll)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-3">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-[#231C20]">Kategori Pengeluaran *</label>
              <select
                className="w-full mt-1 h-9 rounded-md border border-[#E8C5D1] bg-white px-3 py-1 text-xs text-[#231C20] focus:outline-none focus:ring-2 focus:ring-[#E0688A]"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
              <label className="font-semibold text-[#231C20]">Judul / Keperluan *</label>
              <Input
                required
                placeholder="Contoh: Beli Bubble Wrap 50m + Box Karton Corrugated"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#231C20]">Nominal (Rp) *</label>
                <Input
                  type="number"
                  min="1"
                  required
                  placeholder="Rp 0"
                  value={amount || ""}
                  onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-[#231C20]">Tanggal *</label>
                <Input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#231C20]">Metode Bayar</label>
              <select
                className="w-full mt-1 h-9 rounded-md border border-[#E8C5D1] bg-white px-3 py-1 text-xs text-[#231C20] focus:outline-none focus:ring-2 focus:ring-[#E0688A]"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="CASH">Tunai / Kas Kecil</option>
                <option value="BANK_TRANSFER">Transfer Bank</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#231C20]">Catatan Tambahan</label>
              <Input
                placeholder="Keterangan nota / toko tempat beli"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs mt-2 py-2 text-xs font-semibold"
            >
              {loading ? "Menyimpan..." : "Simpan Pengeluaran"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right: Expenses Table */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3 border-b border-[#F2DBE3]">
          <CardTitle className="text-base font-semibold text-[#231C20]">
            Daftar Beban Operasional ({expenses.length} Transaksi)
          </CardTitle>
          <CardDescription>
            Pengeluaran ini akan mengurangi laba kotor pada Laporan Laba Rugi
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[480px]">
            <TableHeader>
              <TableRow>
                <TableHead>Kategori & Keperluan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-stone-400 text-xs">
                    Belum ada beban operasional tercatat.
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs">
                      <Badge variant="secondary" className="text-[10px] mb-1">
                        {e.category.name}
                      </Badge>
                      <p className="font-semibold text-stone-900 text-xs">{e.title}</p>
                      {e.notes && (
                        <p className="text-[10px] text-stone-400 mt-0.5">{e.notes}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-stone-600 font-mono">
                      {formatIndonesianDate(e.expenseDate)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-stone-900 text-xs">
                      {formatRupiah(e.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                          onClick={() => handleOpenEdit(e)}
                          title="Edit Pengeluaran"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(e.id)}
                          title="Hapus Pengeluaran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Edit Beban Operasional */}
      {isEditOpen && selectedExpense && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#F2DBE3] max-w-md w-full p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F2DBE3] pb-3">
              <h3 className="font-bold text-[#231C20] text-base">
                Edit Beban Operasional
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
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

            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#231C20]">Kategori Pengeluaran *</label>
                <select
                  className="w-full mt-1 h-9 rounded-md border border-[#E8C5D1] bg-white px-3 py-1 text-xs text-[#231C20] focus:outline-none focus:ring-2 focus:ring-[#E0688A]"
                  value={editFormData.categoryId}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, categoryId: e.target.value })
                  }
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
                <label className="font-semibold text-[#231C20]">Judul / Keperluan *</label>
                <Input
                  required
                  value={editFormData.title}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, title: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#231C20]">Nominal (Rp) *</label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={editFormData.amount}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        amount: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="mt-1 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#231C20]">Tanggal *</label>
                  <Input
                    type="date"
                    required
                    value={editFormData.expenseDate}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, expenseDate: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#231C20]">Metode Bayar</label>
                <select
                  className="w-full mt-1 h-9 rounded-md border border-[#E8C5D1] bg-white px-3 py-1 text-xs text-[#231C20] focus:outline-none focus:ring-2 focus:ring-[#E0688A]"
                  value={editFormData.paymentMethod}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      paymentMethod: e.target.value,
                    })
                  }
                >
                  <option value="CASH">Tunai / Kas Kecil</option>
                  <option value="BANK_TRANSFER">Transfer Bank</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#231C20]">Catatan Tambahan</label>
                <Input
                  placeholder="Keterangan nota / toko tempat beli"
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
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
                  {loading ? "Menyimpan..." : "Perbarui Pengeluaran"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
