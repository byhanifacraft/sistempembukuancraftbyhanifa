import prisma from "../lib/prisma";

async function main() {
  const tables = await prisma.$queryRaw<Array<{ relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }>>`
    SELECT relname, relrowsecurity, relforcerowsecurity 
    FROM pg_class 
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
    WHERE pg_namespace.nspname = 'public' AND relkind = 'r' 
    ORDER BY relname;
  `;
  console.log("=== TABLES AND RLS STATUS ===");
  console.table(tables);

  const indexes = await prisma.$queryRaw<Array<{ tablename: string; indexname: string }>>`
    SELECT tablename, indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    ORDER BY tablename, indexname;
  `;
  console.log("=== EXISTING INDEXES ===");
  console.table(indexes);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
