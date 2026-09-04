import prisma from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { OfflineOrderForm } from "@/components/order/offline-order-form";
import { serializePrisma } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function NewOfflineOrderPage() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Kasir & Input Penjualan Offline"
        subtitle="Catat pesanan toko fisik, pesanan WhatsApp, serta request kustom nama & warna secara instan"
      />

      <div className="p-6 max-w-7xl">
        <OfflineOrderForm products={serializePrisma(products)} />
      </div>
    </div>
  );
}
