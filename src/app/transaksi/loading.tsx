export default function TransactionsLoading() {
  return (
    <div className="flex-1 flex flex-col animate-pulse">
      {/* Skeleton Header */}
      <div className="bg-white/80 border-b border-[#F2DBE3] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-pink-100/60 rounded-md" />
          <div className="h-3 w-80 bg-pink-50 rounded-md" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-28 bg-pink-100/60 rounded-md" />
          <div className="h-8 w-32 bg-pink-100/60 rounded-md" />
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl">
        {/* Filters Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 bg-pink-100/60 rounded-md" />
            <div className="h-8 w-20 bg-pink-100/60 rounded-md" />
            <div className="h-8 w-24 bg-pink-100/60 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-32 bg-pink-100/60 rounded-md" />
            <div className="h-8 w-32 bg-pink-100/60 rounded-md" />
          </div>
        </div>

        {/* Transactions Table Skeleton */}
        <div className="rounded-xl bg-white border border-[#F2DBE3] overflow-hidden">
          <div className="p-4 border-b border-[#F2DBE3]">
            <div className="h-4 w-48 bg-stone-200 rounded" />
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
              <div key={row} className="flex justify-between items-center py-3 border-b border-stone-100">
                <div className="space-y-1.5 w-1/4">
                  <div className="h-4 w-36 bg-stone-200 rounded" />
                  <div className="h-3 w-24 bg-stone-100 rounded" />
                </div>
                <div className="h-5 w-16 bg-stone-200 rounded-full" />
                <div className="space-y-1 w-1/4">
                  <div className="h-3.5 w-32 bg-stone-200 rounded" />
                  <div className="h-3 w-40 bg-stone-100 rounded" />
                </div>
                <div className="h-4 w-20 bg-stone-200 rounded" />
                <div className="h-4 w-20 bg-stone-200 rounded" />
                <div className="h-5 w-16 bg-stone-200 rounded-full" />
                <div className="h-7 w-16 bg-stone-200 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
