import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { ProductForm } from "@/components/product/product-form";
import { serializePrisma } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function EditProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const { id } = params;

  const [product, categories, rawMaterials] = await Promise.all([
    prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        bomItems: {
          include: {
            rawMaterial: { include: { unit: true } },
          },
        },
      },
    }),
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.rawMaterial.findMany({
      where: { deletedAt: null },
      include: { unit: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={`Edit Produk: ${product.name}`}
        subtitle="Ubah informasi produk, harga jual, dan resep komposisi bahan baku"
      />

      <div className="p-6 max-w-7xl">
        <ProductForm
          initialData={serializePrisma(product)}
          categories={categories}
          rawMaterials={serializePrisma(rawMaterials)}
          isEdit={true}
        />
      </div>
    </div>
  );
}
