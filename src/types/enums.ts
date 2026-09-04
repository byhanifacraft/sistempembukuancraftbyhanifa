// ==============================================================================
// CLIENT-SAFE ENUMS (Mirroring Prisma Schema Enums)
// Menggunakan 'const as const' + type union agar 100% kompatibel dengan Prisma
// tanpa membebani browser bundle dengan runtime @prisma/client di Client Components.
// ==============================================================================

export const ProductionMode = {
  STOCK_BASED: "STOCK_BASED",
  MADE_TO_ORDER: "MADE_TO_ORDER",
} as const;
export type ProductionMode = (typeof ProductionMode)[keyof typeof ProductionMode];

export const OrderStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  RETURNED: "RETURNED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const SalesChannel = {
  SHOPEE: "SHOPEE",
  OFFLINE: "OFFLINE",
  WHATSAPP: "WHATSAPP",
  OTHER: "OTHER",
} as const;
export type SalesChannel = (typeof SalesChannel)[keyof typeof SalesChannel];

export const ImportStatus = {
  SUCCESS: "SUCCESS",
  PARTIAL: "PARTIAL",
  FAILED: "FAILED",
  ROLLED_BACK: "ROLLED_BACK",
} as const;
export type ImportStatus = (typeof ImportStatus)[keyof typeof ImportStatus];

export const PaymentStatus = {
  UNPAID: "UNPAID",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  SHOPEE_PAY: "SHOPEE_PAY",
  QRIS: "QRIS",
  OTHER: "OTHER",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const MutationType = {
  PURCHASE_IN: "PURCHASE_IN",
  PRODUCTION_OUT: "PRODUCTION_OUT",
  PRODUCTION_IN: "PRODUCTION_IN",
  SALE_OUT: "SALE_OUT",
  ADJUSTMENT_IN: "ADJUSTMENT_IN",
  ADJUSTMENT_OUT: "ADJUSTMENT_OUT",
  RETURN_IN: "RETURN_IN",
} as const;
export type MutationType = (typeof MutationType)[keyof typeof MutationType];

export const ItemType = {
  RAW_MATERIAL: "RAW_MATERIAL",
  FINISHED_PRODUCT: "FINISHED_PRODUCT",
} as const;
export type ItemType = (typeof ItemType)[keyof typeof ItemType];

export const UserRole = {
  OWNER: "OWNER",
  STAFF: "STAFF",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
