export default function ProgressLoading() {
  return (
    <div className="animate-pulse space-y-6 max-w-4xl mx-auto p-4 sm:p-6 select-none">
      {/* page header */}
      <div className="space-y-2 pb-4 border-b border-border">
        <div className="h-8 w-56 rounded bg-border" />
        <div className="h-4 w-72 rounded bg-border" />
      </div>

      {/* grid stat boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-border/40 border border-border/20" />
        ))}
      </div>

      {/* analytics graphs skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-72 rounded-2xl bg-border/40 border border-border/20" />
        <div className="h-72 rounded-2xl bg-border/40 border border-border/20" />
      </div>
    </div>
  );
}
