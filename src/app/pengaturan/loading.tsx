export default function SettingsLoading() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 Skeleton */}
          <div className="rounded-xl bg-white border border-[#F2DBE3] p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="h-5 w-40 bg-pink-100/60 rounded" />
              <div className="h-8 w-24 bg-pink-200/60 rounded-md" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-stone-50">
                  <div className="h-4 w-32 bg-stone-200 rounded" />
                  <div className="h-6 w-16 bg-stone-100 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 2 Skeleton */}
          <div className="rounded-xl bg-white border border-[#F2DBE3] p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <div className="h-5 w-40 bg-pink-100/60 rounded" />
              <div className="h-8 w-24 bg-pink-200/60 rounded-md" />
            </div>
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-stone-50">
                  <div className="h-4 w-32 bg-stone-200 rounded" />
                  <div className="h-6 w-16 bg-stone-100 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
