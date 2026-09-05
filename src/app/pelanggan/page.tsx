import { getCustomers } from "@/actions/customer.actions";
import { Header } from "@/components/layout/header";
import { CustomerDirectoryTable } from "@/components/customer/customer-directory-table";

export const dynamic = "force-dynamic";

export default async function PelangganPage(props: {
  searchParams: Promise<{ search?: string }>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams?.search || "";

  const customers = await getCustomers({ search });

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Direktori Data Pelanggan"
        subtitle="Daftar lengkap pelanggan Shopee dan Kasir Offline, nomor WhatsApp, alamat domisili, dan ekspor ke Excel"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl">
        <CustomerDirectoryTable initialCustomers={customers} />
      </div>
    </div>
  );
}
