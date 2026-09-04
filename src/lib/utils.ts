import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

/**
 * Merge Tailwind class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format integer amount to Indonesian Rupiah (IDR)
 * Example: 15000 -> "Rp 15.000"
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "Rp 0";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format standard number with Indonesian thousand separators
 * Example: 1500.5 -> "1.500,5"
 */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0";
  }
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Parse string with potential currency or thousand separators into clean integer
 */
export function parseRupiahInput(value: string | number): number {
  if (typeof value === "number") return Math.round(value);
  const clean = value.replace(/[^0-9-]/g, "");
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Consistent Rupiah rounding policy across all calculation modules
 */
export function roundRupiah(value: number): number {
  return Math.round(value);
}

/**
 * Format date into Indonesian locale
 */
export function formatIndonesianDate(
  date: Date | string | null | undefined,
  pattern = "dd MMM yyyy"
): string {
  if (!date) return "-";
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (isNaN(parsed.getTime())) return "-";
  return format(parsed, pattern, { locale: idLocale });
}

/**
 * Format datetime into Indonesian locale with hour & minute
 */
export function formatIndonesianDateTime(date: Date | string | null | undefined): string {
  return formatIndonesianDate(date, "dd MMM yyyy, HH:mm");
}

/**
 * Generate unique internal document numbers
 * e.g., "CBH-202609-0012"
 */
export function generateDocNumber(prefix: "CBH" | "PB" | "EXP" | "PRD", sequence: number): string {
  const now = new Date();
  const dateStr = format(now, "yyyyMMdd");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const pad = String(sequence).padStart(4, "0");
  return `${prefix}-${dateStr}-${pad}-${randomSuffix}`;
}

/**
 * Fuzzy string matching using Dice coefficient (bigrams) for Shopee product matching
 * Returns a score between 0.0 (no match) and 1.0 (exact match)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim().replace(/[^a-z0-9]/g, " ");
  const s2 = str2.toLowerCase().trim().replace(/[^a-z0-9]/g, " ");

  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) {
    return s1.includes(s2) || s2.includes(s1) ? 0.8 : 0.0;
  }

  // Exact substring match bonus
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.9;
  }

  // Generate bigrams
  const getBigrams = (str: string): Map<string, number> => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bigram = str.substring(i, i + 2);
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);

  let intersection = 0;
  for (const [bigram, count1] of bigrams1.entries()) {
    if (bigrams2.has(bigram)) {
      intersection += Math.min(count1, bigrams2.get(bigram)!);
    }
  }

  const total = (s1.length - 1) + (s2.length - 1);
  return total > 0 ? (2.0 * intersection) / total : 0;
}

/**
 * Format error into user-friendly Indonesian message
 */
export function formatErrorMessage(error: any, fallback = "Terjadi kesalahan sistem."): string {
  if (!error) return fallback;

  // Zod validation error
  if (error.name === "ZodError" && Array.isArray(error.issues)) {
    return error.issues.map((i: any) => i.message).join(", ");
  }

  // Prisma unique constraint violation
  if (error.code === "P2002") {
    const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "SKU / Nama";
    return `Data dengan nilai tersebut sudah terdaftar (duplikasi pada: ${target}).`;
  }

  // Prisma record not found
  if (error.code === "P2025") {
    return "Data tidak ditemukan atau sudah dihapus.";
  }

  if (typeof error === "string") return error;
  if (error.message) return error.message;

  return fallback;
}
