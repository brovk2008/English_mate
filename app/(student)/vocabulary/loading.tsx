export default function VocabLoading() {
  return (
    <div className="animate-pulse space-y-6 max-w-4xl mx-auto p-4 sm:p-6 select-none">
      {/* page header titles */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-2">
          <div className="h-8 w-60 rounded bg-border" />
          <div className="h-4 w-80 rounded bg-border" />
        </div>
        <div className="h-10 w-64 rounded-xl bg-border" />
      </div>

      {/* cards search filters row */}
      <div className="space-y-3">
        <div className="h-11 rounded-xl bg-border/40 border border-border/20" />
        <div className="flex justify-between">
          <div className="h-8 w-44 rounded-lg bg-border" />
          <div className="h-8 w-48 rounded-lg bg-border" />
        </div>
      </div>

      {/* items lists skeletons */}
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-border/40 border border-border/20" />
        ))}
      </div>
    </div>
  );
}
