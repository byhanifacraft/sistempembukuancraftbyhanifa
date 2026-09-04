"use server";

import prisma from "@/lib/prisma";
import { categorySchema, unitSchema } from "@/lib/validations";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { serializePrisma } from "@/lib/serialize";
import { formatErrorMessage } from "@/lib/utils";
import { requireOwnerRole } from "@/lib/auth";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// ==============================================================================
// CATEGORY ACTIONS
// ==============================================================================

async function fetchCategoriesRaw() {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: { products: { where: { deletedAt: null } } },
      },
    },
    orderBy: { name: "asc" },
  });
  return serializePrisma(categories);
}

const getCachedCategories = unstable_cache(
  fetchCategoriesRaw,
  ["master_categories_list"],
  { tags: ["categories"], revalidate: 3600 }
);

export async function getCategories() {
  try {
    return await getCachedCategories();
  } catch {
    return await fetchCategoriesRaw();
  }
}

export async function createCategory(formData: unknown) {
  try {
    await requireOwnerRole();
    const validated = categorySchema.parse(formData);
    const slug = slugify(validated.name);

    const category = await prisma.category.create({
      data: {
        name: validated.name.trim(),
        slug,
        description: validated.description?.trim() || null,
      },
    });

    try {
      (revalidateTag as any)("categories", "max");
      revalidatePath("/pengaturan");
      revalidatePath("/produk");
      revalidatePath("/produk/baru");
    } catch {}

    return { success: true, data: serializePrisma(category) };
  } catch (error: any) {
    console.error("Error creating category:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal menambahkan kategori."),
    };
  }
}

export async function updateCategory(id: string, formData: unknown) {
  try {
    await requireOwnerRole();
    const validated = categorySchema.parse(formData);
    const slug = slugify(validated.name);

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        slug,
        description: validated.description?.trim() || null,
      },
    });

    try {
      (revalidateTag as any)("categories", "max");
      revalidatePath("/pengaturan");
      revalidatePath("/produk");
    } catch {}

    return { success: true, data: serializePrisma(updated) };
  } catch (error: any) {
    console.error("Error updating category:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal memperbarui kategori."),
    };
  }
}

export async function deleteCategory(id: string) {
  try {
    await requireOwnerRole();
    const activeProducts = await prisma.product.count({
      where: { categoryId: id, deletedAt: null },
    });

    if (activeProducts > 0) {
      return {
        success: false,
        error: `Kategori tidak dapat dihapus karena masih digunakan oleh ${activeProducts} produk aktif.`,
      };
    }

    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    try {
      (revalidateTag as any)("categories", "max");
      revalidatePath("/pengaturan");
      revalidatePath("/produk");
    } catch {}

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal menghapus kategori."),
    };
  }
}

// ==============================================================================
// UNIT ACTIONS
// ==============================================================================

async function fetchUnitsRaw() {
  const units = await prisma.unit.findMany({
    include: {
      _count: {
        select: { rawMaterials: { where: { deletedAt: null } } },
      },
    },
    orderBy: { name: "asc" },
  });
  return serializePrisma(units);
}

const getCachedUnits = unstable_cache(
  fetchUnitsRaw,
  ["master_units_list"],
  { tags: ["units"], revalidate: 3600 }
);

export async function getUnits() {
  try {
    return await getCachedUnits();
  } catch {
    return await fetchUnitsRaw();
  }
}

export async function createUnit(formData: unknown) {
  try {
    await requireOwnerRole();
    const validated = unitSchema.parse(formData);

    const unit = await prisma.unit.create({
      data: {
        name: validated.name.trim(),
        symbol: validated.symbol.trim(),
      },
    });

    try {
      (revalidateTag as any)("units", "max");
      revalidatePath("/pengaturan");
      revalidatePath("/bahan-baku");
    } catch {}

    return { success: true, data: serializePrisma(unit) };
  } catch (error: any) {
    console.error("Error creating unit:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal menambahkan satuan."),
    };
  }
}

export async function updateUnit(id: string, formData: unknown) {
  try {
    await requireOwnerRole();
    const validated = unitSchema.parse(formData);

    const updated = await prisma.unit.update({
      where: { id },
      data: {
        name: validated.name.trim(),
        symbol: validated.symbol.trim(),
      },
    });

    try {
      (revalidateTag as any)("units", "max");
      revalidatePath("/pengaturan");
      revalidatePath("/bahan-baku");
    } catch {}

    return { success: true, data: serializePrisma(updated) };
  } catch (error: any) {
    console.error("Error updating unit:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal memperbarui satuan."),
    };
  }
}

export async function deleteUnit(id: string) {
  try {
    await requireOwnerRole();
    const usedMaterials = await prisma.rawMaterial.count({
      where: { unitId: id },
    });

    if (usedMaterials > 0) {
      return {
        success: false,
        error: `Satuan tidak dapat dihapus karena masih digunakan oleh ${usedMaterials} data bahan baku.`,
      };
    }

    await prisma.unit.delete({
      where: { id },
    });

    try {
      (revalidateTag as any)("units", "max");
      revalidatePath("/pengaturan");
      revalidatePath("/bahan-baku");
    } catch {}

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting unit:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal menghapus satuan."),
    };
  }
}
