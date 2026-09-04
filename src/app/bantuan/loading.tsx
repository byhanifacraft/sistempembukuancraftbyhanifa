export default function HelpLoading() {
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
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-xl bg-white border border-[#F2DBE3] space-y-2">
              <div className="h-5 w-48 bg-pink-100/60 rounded" />
              <div className="h-3 w-full bg-stone-100 rounded" />
              <div className="h-3 w-3/4 bg-stone-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
