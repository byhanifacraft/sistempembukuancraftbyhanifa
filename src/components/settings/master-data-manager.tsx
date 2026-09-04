"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, AlertCircle } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createUnit,
  updateUnit,
  deleteUnit,
} from "@/actions/master.actions";
import { createExpenseCategory, deleteExpenseCategory } from "@/actions/expense.actions";

export function MasterDataManager({
  categories,
  units,
  expenseCategories,
  users,
}: {
  categories: any[];
  units: any[];
  expenseCategories: any[];
  users: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Category State
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Unit State
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [unitSymbol, setUnitSymbol] = useState("");

  // Expense Category State
  const [isAddExpCatOpen, setIsAddExpCatOpen] = useState(false);
  const [expCatName, setExpCatName] = useState("");

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await createCategory({ name: catName, description: catDesc });
      if (!res.success) {
        setErrorMessage(res.error || "Gagal menambahkan kategori.");
      } else {
        setCatName("");
        setCatDesc("");
        setIsAddCatOpen(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Hapus kategori ini?")) return;
    const res = await deleteCategory(id);
    if (!res.success) alert(res.error);
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await createUnit({ name: unitName, symbol: unitSymbol });
      if (!res.success) {
        setErrorMessage(res.error || "Gagal menambahkan satuan.");
      } else {
        setUnitName("");
        setUnitSymbol("");
        setIsAddUnitOpen(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm("Hapus satuan ini?")) return;
    const res = await deleteUnit(id);
    if (!res.success) alert(res.error);
  };

  const handleCreateExpenseCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await createExpenseCategory({ name: expCatName });
      if (!res.success) {
        setErrorMessage(res.error || "Gagal menambahkan kategori beban.");
      } else {
        setExpCatName("");
        setIsAddExpCatOpen(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpenseCategory = async (id: string) => {
    if (!confirm("Hapus kategori pengeluaran ini?")) return;
    const res = await deleteExpenseCategory(id);
    if (!res.success) alert(res.error);
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Categories */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#F2DBE3] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#231C20]">
              Kategori Produk ({categories.length})
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1 text-[#E0688A] border-[#E0688A] hover:bg-[#FFF0F4]"
              onClick={() => setIsAddCatOpen(true)}
            >
              <Plus className="w-3 h-3" />
              <span>Tambah</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isAddCatOpen && (
              <form
                onSubmit={handleCreateCategory}
                className="p-3 bg-[#FFF5F8]/70 border-b border-[#F2DBE3] space-y-2 text-xs"
              >
                <Input
                  required
                  placeholder="Nama Kategori Produk..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
                <Input
                  placeholder="Deskripsi singkat (opsional)..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setIsAddCatOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading}
                    className="h-7 text-xs bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold"
                  >
                    Simpan
                  </Button>
                </div>
              </form>
            )}

            <Table>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs font-semibold text-[#231C20]">
                      {c.name}
                      {c.description && (
                        <p className="text-[10px] text-[#75656B] font-normal">
                          {c.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDeleteCategory(c.id)}
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 2. Units */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#F2DBE3] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#231C20]">
              Satuan Pengukuran ({units.length})
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1 text-[#E0688A] border-[#E0688A] hover:bg-[#FFF0F4]"
              onClick={() => setIsAddUnitOpen(true)}
            >
              <Plus className="w-3 h-3" />
              <span>Tambah</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isAddUnitOpen && (
              <form
                onSubmit={handleCreateUnit}
                className="p-3 bg-[#FFF5F8]/70 border-b border-[#F2DBE3] space-y-2 text-xs"
              >
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    required
                    placeholder="Nama (e.g. Kilogram)"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                  <Input
                    required
                    placeholder="Simbol (e.g. kg)"
                    value={unitSymbol}
                    onChange={(e) => setUnitSymbol(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setIsAddUnitOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading}
                    className="h-7 text-xs bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold"
                  >
                    Simpan
                  </Button>
                </div>
              </form>
            )}

            <Table>
              <TableBody>
                {units.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs font-semibold text-[#231C20]">
                      {u.name}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-center">
                      <Badge variant="secondary">{u.symbol}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDeleteUnit(u.id)}
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 3. Expense Categories */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#F2DBE3] flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold text-[#231C20]">
              Kategori Beban Operasional ({expenseCategories.length})
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="h-7 px-2 text-xs gap-1 text-[#E0688A] border-[#E0688A] hover:bg-[#FFF0F4]"
              onClick={() => setIsAddExpCatOpen(true)}
            >
              <Plus className="w-3 h-3" />
              <span>Tambah</span>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isAddExpCatOpen && (
              <form
                onSubmit={handleCreateExpenseCategory}
                className="p-3 bg-[#FFF5F8]/70 border-b border-[#F2DBE3] space-y-2 text-xs"
              >
                <Input
                  required
                  placeholder="Nama Kategori Beban (e.g. Promosi & Iklan)..."
                  value={expCatName}
                  onChange={(e) => setExpCatName(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setIsAddExpCatOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading}
                    className="h-7 text-xs bg-[#E0688A] text-white hover:bg-[#D45679] shadow-xs font-semibold"
                  >
                    Simpan
                  </Button>
                </div>
              </form>
            )}

            <Table>
              <TableBody>
                {expenseCategories.map((ec) => (
                  <TableRow key={ec.id}>
                    <TableCell className="text-xs font-semibold text-[#231C20]">
                      {ec.name}
                    </TableCell>
                    <TableCell className="text-xs text-[#75656B] text-center">
                      {ec.isDefault ? "Bawaan" : "Kustom"}
                    </TableCell>
                    <TableCell className="text-right">
                      {!ec.isDefault && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-rose-600 hover:bg-rose-50"
                          onClick={() => handleDeleteExpenseCategory(ec.id)}
                          title="Hapus"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 4. Users Profile */}
        <Card>
          <CardHeader className="pb-3 border-b border-[#F2DBE3]">
            <CardTitle className="text-sm font-semibold text-[#231C20]">Pengguna & Peran ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs">
                      <p className="font-semibold text-[#231C20]">{u.name}</p>
                      <p className="text-[10px] text-[#75656B]">{u.email}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="default" className="text-[10px]">
                        {u.role}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
