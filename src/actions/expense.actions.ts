"use server";

import prisma from "@/lib/prisma";
import { expenseCategorySchema, expenseSchema } from "@/lib/validations";
import { format } from "date-fns";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { serializePrisma } from "@/lib/serialize";
import { getCurrentUserId, requireOwnerRole } from "@/lib/auth";
import { formatErrorMessage } from "@/lib/utils";

async function fetchExpenseCategoriesRaw() {
  const categories = await prisma.expenseCategory.findMany({
    include: {
      _count: {
        select: { expenses: { where: { deletedAt: null } } },
      },
    },
    orderBy: { name: "asc" },
  });
  return serializePrisma(categories);
}

const getCachedExpenseCategories = unstable_cache(
  fetchExpenseCategoriesRaw,
  ["master_expense_categories_list"],
  { tags: ["expense-categories"], revalidate: 3600 }
);

export async function getExpenseCategories() {
  try {
    return await getCachedExpenseCategories();
  } catch {
    return await fetchExpenseCategoriesRaw();
  }
}

export async function createExpenseCategory(formData: unknown) {
  try {
    await requireOwnerRole();
    const validated = expenseCategorySchema.parse(formData);
    const category = await prisma.expenseCategory.create({
      data: { name: validated.name.trim() },
    });
    try {
      (revalidateTag as any)("expense-categories", "max");
      revalidatePath("/pengeluaran");
      revalidatePath("/pengeluaran/operasional");
      revalidatePath("/pengaturan");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: serializePrisma(category) };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal membuat kategori pengeluaran."),
    };
  }
}

export async function deleteExpenseCategory(id: string) {
  try {
    await requireOwnerRole();
    const count = await prisma.expense.count({
      where: { categoryId: id },
    });

    if (count > 0) {
      return {
        success: false,
        error: `Kategori tidak dapat dihapus karena masih terhubung dengan ${count} data pengeluaran.`,
      };
    }

    await prisma.expenseCategory.delete({
      where: { id },
    });

    try {
      (revalidateTag as any)("expense-categories", "max");
      revalidatePath("/pengeluaran");
      revalidatePath("/pengeluaran/operasional");
      revalidatePath("/pengaturan");
    } catch {}

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal menghapus kategori pengeluaran."),
    };
  }
}

export async function getExpenses(params?: {
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params?.startDate || params?.endDate) {
      where.expenseDate = {};
      if (params.startDate) where.expenseDate.gte = new Date(params.startDate);
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    const [expenses, totalCount] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: true,
          createdBy: true,
        },
        orderBy: { expenseDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      data: serializePrisma(expenses),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw new Error("Gagal memuat daftar beban operasional.");
  }
}

export async function createExpense(formData: unknown, userId?: string) {
  try {
    await requireOwnerRole();
    const validated = expenseSchema.parse(formData);
    const validUserId = await getCurrentUserId(userId);

    const countToday = await prisma.expense.count();
    const dateStr = format(validated.expenseDate || new Date(), "yyyyMMdd");
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const expenseNumber = `EXP-${dateStr}-${String(countToday + 1).padStart(4, "0")}-${randomSuffix}`;

    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        categoryId: validated.categoryId,
        title: validated.title.trim(),
        amount: validated.amount,
        expenseDate: validated.expenseDate || new Date(),
        paymentMethod: validated.paymentMethod,
        receiptUrl: validated.receiptUrl?.trim() || null,
        notes: validated.notes?.trim() || null,
        createdById: validUserId,
      },
    });

    try {
      revalidatePath("/pengeluaran");
      revalidatePath("/pengeluaran/operasional");
      revalidatePath("/laporan/laba-rugi");
      revalidatePath("/laporan/arus-kas");
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true, data: serializePrisma(expense) };
  } catch (error: any) {
    console.error("Error creating expense:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal mencatat pengeluaran operasional."),
    };
  }
}

export async function updateExpense(id: string, formData: unknown) {
  try {
    await requireOwnerRole();
    const validated = expenseSchema.parse(formData);

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        categoryId: validated.categoryId,
        title: validated.title.trim(),
        amount: validated.amount,
        expenseDate: validated.expenseDate || new Date(),
        paymentMethod: validated.paymentMethod,
        receiptUrl: validated.receiptUrl?.trim() || null,
        notes: validated.notes?.trim() || null,
      },
    });

    try {
      revalidatePath("/pengeluaran");
      revalidatePath("/pengeluaran/operasional");
      revalidatePath("/laporan/laba-rugi");
      revalidatePath("/laporan/arus-kas");
      revalidatePath("/");
    } catch {}

    return { success: true, data: serializePrisma(updated) };
  } catch (error: any) {
    console.error("Error updating expense:", error);
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal memperbarui catatan pengeluaran."),
    };
  }
}

export async function deleteExpense(id: string) {
  try {
    await requireOwnerRole();
    await prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    try {
      revalidatePath("/pengeluaran");
      revalidatePath("/pengeluaran/operasional");
      revalidatePath("/laporan/laba-rugi");
      revalidatePath("/laporan/arus-kas");
      revalidatePath("/");
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: formatErrorMessage(error, "Gagal menghapus pengeluaran."),
    };
  }
}
