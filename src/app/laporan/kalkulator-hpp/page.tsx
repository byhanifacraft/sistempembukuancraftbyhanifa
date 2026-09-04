import prisma from "@/lib/prisma";
import { Header } from "@/components/layout/header";
import { HppSimulator } from "@/components/report/hpp-simulator";
import { serializePrisma } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function HppCalculatorPage() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, isActive: true },
    include: {
      bomItems: {
        include: {
          rawMaterial: { include: { unit: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Kalkulator HPP & Simulasi Harga Jual"
        subtitle="Analisis dampak fluktuasi harga bahan baku terhadap profitabilitas produk dan rekomendasi harga jual optimal"
      />

      <div className="p-6 space-y-6 max-w-7xl">
        <HppSimulator products={serializePrisma(products)} />
      </div>
    </div>
  );
}
