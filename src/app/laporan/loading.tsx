export default function ReportsLoading() {
  return (
    <div className="flex-1 flex flex-col animate-pulse">
      {/* Skeleton Header */}
      <div className="bg-white/80 border-b border-[#F2DBE3] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-64 bg-pink-100/60 rounded-md" />
          <div className="h-3 w-72 bg-pink-50 rounded-md" />
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-5xl">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-white border border-[#F2DBE3] space-y-2">
              <div className="h-3 w-24 bg-pink-100/60 rounded" />
              <div className="h-6 w-28 bg-pink-200/60 rounded" />
              <div className="h-2.5 w-20 bg-pink-50 rounded" />
            </div>
          ))}
        </div>

        {/* Financial Statement Card Skeleton */}
        <div className="p-6 rounded-xl bg-white border border-[#F2DBE3] space-y-6 shadow-2xs">
          <div className="flex justify-between items-center pb-4 border-b border-stone-100">
            <div className="space-y-1.5">
              <div className="h-3 w-36 bg-[#E0688A]/20 rounded" />
              <div className="h-5 w-48 bg-stone-200 rounded" />
            </div>
            <div className="h-3 w-32 bg-stone-100 rounded" />
          </div>

          <div className="space-y-4">
            <div className="h-4 w-40 bg-stone-200 rounded" />
            <div className="pl-4 space-y-2">
              <div className="flex justify-between"><div className="h-3 w-32 bg-stone-100 rounded" /><div className="h-3 w-20 bg-stone-200 rounded" /></div>
              <div className="flex justify-between"><div className="h-3 w-36 bg-stone-100 rounded" /><div className="h-3 w-20 bg-stone-200 rounded" /></div>
            </div>
            <div className="h-10 w-full bg-stone-100 rounded-lg" />
            <div className="h-12 w-full bg-emerald-50 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
