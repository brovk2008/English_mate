export default function DayLoading() {
  return (
    <div className="animate-pulse space-y-6 max-w-4xl mx-auto p-4 sm:p-6 select-none">
      {/* lesson day title banner */}
      <div className="flex justify-between items-center pb-4 border-b border-border">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-border" />
          <div className="h-8 w-56 rounded-lg bg-border" />
        </div>
        <div className="h-10 w-24 rounded-xl bg-border" />
      </div>

      {/* study pacing timeline tracker skeleton */}
      <div className="h-12 rounded-xl bg-border/40 border border-border/20" />

      {/* curriculum blocks layout skeletons */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-border/40 border border-border/20" />
        ))}
      </div>
    </div>
  );
}
