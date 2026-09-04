export default function ProductionLoading() {
  return (
    <div className="flex-1 flex flex-col animate-pulse">
      {/* Skeleton Header */}
      <div className="bg-white/80 border-b border-[#F2DBE3] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-pink-100/60 rounded-md" />
          <div className="h-3 w-80 bg-pink-50 rounded-md" />
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Skeleton */}
          <div className="lg:col-span-1 p-5 rounded-xl bg-white border border-[#F2DBE3] space-y-4">
            <div className="h-5 w-40 bg-pink-100/60 rounded" />
            <div className="space-y-3">
              <div className="h-10 w-full bg-stone-100 rounded-md" />
              <div className="h-10 w-full bg-stone-100 rounded-md" />
              <div className="h-10 w-full bg-stone-100 rounded-md" />
              <div className="h-10 w-full bg-pink-200/60 rounded-md mt-4" />
            </div>
          </div>

          {/* History Table Skeleton */}
          <div className="lg:col-span-2 rounded-xl bg-white border border-[#F2DBE3] overflow-hidden">
            <div className="p-4 border-b border-[#F2DBE3]">
              <div className="h-4 w-44 bg-stone-200 rounded" />
            </div>
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="flex justify-between items-center py-3 border-b border-stone-100">
                  <div className="space-y-1.5 w-1/3">
                    <div className="h-4 w-40 bg-stone-200 rounded" />
                    <div className="h-3 w-24 bg-stone-100 rounded" />
                  </div>
                  <div className="h-4 w-20 bg-stone-100 rounded" />
                  <div className="h-4 w-24 bg-stone-200 rounded" />
                  <div className="h-4 w-24 bg-stone-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
