export default function ImportShopeeLoading() {
  return (
    <div className="flex-1 flex flex-col animate-pulse">
      {/* Skeleton Header */}
      <div className="bg-white/80 border-b border-[#F2DBE3] px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-56 bg-pink-100/60 rounded-md" />
          <div className="h-3 w-80 bg-pink-50 rounded-md" />
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-5xl">
        {/* Upload Box Skeleton */}
        <div className="p-8 rounded-xl bg-white border-2 border-dashed border-[#F2DBE3] text-center space-y-4">
          <div className="w-12 h-12 bg-pink-100/60 rounded-full mx-auto" />
          <div className="h-5 w-64 bg-stone-200 rounded mx-auto" />
          <div className="h-3 w-80 bg-stone-100 rounded mx-auto" />
          <div className="h-9 w-40 bg-pink-200/60 rounded-md mx-auto mt-4" />
        </div>

        {/* History Section Skeleton */}
        <div className="rounded-xl bg-white border border-[#F2DBE3] p-5 space-y-3">
          <div className="h-4 w-44 bg-stone-200 rounded" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 w-full bg-stone-50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
