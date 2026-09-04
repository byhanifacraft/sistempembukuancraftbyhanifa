import { Prisma } from "@prisma/client";

/**
 * Type helper to recursively convert Prisma.Decimal properties to number
 */
export type Serialized<T> = T extends Prisma.Decimal
  ? number
  : T extends Date
  ? Date
  : T extends (infer U)[]
  ? Serialized<U>[]
  : T extends readonly (infer U)[]
  ? readonly Serialized<U>[]
  : T extends Function
  ? T
  : T extends object
  ? { [K in keyof T]: Serialized<T[K]> }
  : T;

/**
 * Checks if a value is a Prisma.Decimal instance
 */
function isPrismaDecimal(val: unknown): val is Prisma.Decimal {
  if (val === null || val === undefined) return false;
  if (typeof val === "object") {
    return (
      val instanceof Prisma.Decimal ||
      ("d" in val && "e" in val && "s" in val) ||
      typeof (val as { toNumber?: unknown }).toNumber === "function"
    );
  }
  return false;
}

/**
 * Recursively converts all Prisma Decimal instances into standard JavaScript numbers.
 * Preserves Dates, Arrays, Functions, and Plain Objects without mutating the original structure.
 */
export function serializePrisma<T>(data: T): Serialized<T> {
  if (data === null || data === undefined) {
    return data as Serialized<T>;
  }

  if (isPrismaDecimal(data)) {
    return data.toNumber() as Serialized<T>;
  }

  if (data instanceof Date) {
    return data as Serialized<T>;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializePrisma(item)) as unknown as Serialized<T>;
  }

  if (typeof data === "object") {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializePrisma(value);
    }
    return result as Serialized<T>;
  }

  return data as Serialized<T>;
}
