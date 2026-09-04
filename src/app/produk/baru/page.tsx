import prisma from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { ProductForm } from "@/components/product/product-form";
import { serializePrisma } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, rawMaterials] = await Promise.all([
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.rawMaterial.findMany({
      where: { deletedAt: null },
      include: { unit: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Tambah Produk Baru"
        subtitle="Daftarkan produk baru, tentukan mode produksi (Made-To-Order atau Stock-Based), dan susun resep bahan baku"
      />

      <div className="p-6 max-w-7xl">
        <ProductForm categories={categories} rawMaterials={serializePrisma(rawMaterials)} />
      </div>
    </div>
  );
}
