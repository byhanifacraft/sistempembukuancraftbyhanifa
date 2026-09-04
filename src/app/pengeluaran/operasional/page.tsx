import { getExpenses, getExpenseCategories } from "@/actions/expense.actions";
import { Header } from "@/components/layout/header";
import { ExpenseManager } from "@/components/expense/expense-manager";
import { requireOwnerRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OperatingExpensesPage() {
  await requireOwnerRole();
  const [expensesData, categories] = await Promise.all([
    getExpenses({ limit: 50 }),
    getExpenseCategories(),
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Beban & Pengeluaran Operasional"
        subtitle="Catat biaya kemasan & packaging, listrik, iklan/ads Shopee, dan ongkir talangan"
      />

      <div className="p-6 space-y-6 max-w-7xl">
        <ExpenseManager expenses={expensesData.data} categories={categories} />
      </div>
    </div>
  );
}
