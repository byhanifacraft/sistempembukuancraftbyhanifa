import prisma from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { PurchaseForm } from "@/components/purchase/purchase-form";
import { serializePrisma } from "@/lib/serialize";
import { requireOwnerRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  await requireOwnerRole();
  const rawMaterials = await prisma.rawMaterial.findMany({
    where: { deletedAt: null },
    include: { unit: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Pencatatan Pembelian Bahan Baku"
        subtitle="Tambah stok bahan baku baru dan sistem otomatis menghitung moving weighted average harga pokok"
      />

      <div className="p-6 max-w-7xl">
        <PurchaseForm rawMaterials={serializePrisma(rawMaterials)} />
      </div>
    </div>
  );
}
