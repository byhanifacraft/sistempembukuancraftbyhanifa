export default function GlobalLoading() {
  return (
    <div className="flex-1 flex flex-col animate-pulse">
      {/* Skeleton Header */}
      <div className="bg-white/80 border-b border-[#F2DBE3] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-pink-100/60 rounded-md" />
          <div className="h-3 w-72 bg-pink-50 rounded-md" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-28 bg-pink-100/60 rounded-md" />
          <div className="h-8 w-32 bg-pink-100/60 rounded-md" />
        </div>
      </div>

      {/* Skeleton Content Grid */}
      <div className="p-6 space-y-6 max-w-7xl">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-white border border-[#F2DBE3] space-y-3 shadow-2xs"
            >
              <div className="flex justify-between items-center">
                <div className="h-3 w-24 bg-pink-100/60 rounded" />
                <div className="h-4 w-4 bg-pink-100/60 rounded-full" />
              </div>
              <div className="h-7 w-36 bg-pink-200/60 rounded" />
              <div className="h-3 w-full bg-pink-50 rounded pt-1" />
            </div>
          ))}
        </div>

        {/* Big Table / Card Skeleton */}
        <div className="p-6 rounded-xl bg-white border border-[#F2DBE3] space-y-4 shadow-2xs">
          <div className="flex justify-between items-center border-b border-stone-100 pb-3">
            <div className="h-4 w-40 bg-stone-200 rounded" />
            <div className="h-7 w-20 bg-stone-200 rounded" />
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="flex justify-between items-center py-2.5 border-b border-stone-50">
                <div className="h-3.5 w-1/4 bg-stone-200 rounded" />
                <div className="h-3.5 w-1/6 bg-stone-100 rounded" />
                <div className="h-3.5 w-1/8 bg-stone-200 rounded" />
                <div className="h-3.5 w-1/12 bg-stone-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
