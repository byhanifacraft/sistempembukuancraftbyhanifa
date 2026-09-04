import { Header } from "@/components/layout/header";
import { HelpGuide } from "@/components/help/help-guide";

export const dynamic = "force-dynamic";

export default function HelpPage() {
  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Pusat Bantuan & Panduan Sistem"
        subtitle="Panduan alur kerja pembukuan, kalkulasi HPP otomatis, produksi, dan pencatatan transaksi"
      />

      <div className="p-4 md:p-6 space-y-6 max-w-5xl">
        <HelpGuide />
      </div>
    </div>
  );
}
