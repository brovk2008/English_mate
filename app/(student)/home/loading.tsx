export default function HomeLoading() {
  return (
    <div className="animate-pulse space-y-6 max-w-4xl mx-auto p-4 sm:p-6 select-none">
      {/* greeting header */}
      <div className="space-y-2">
        <div className="h-4 w-24 rounded bg-border" />
        <div className="h-8 w-64 rounded-lg bg-border" />
      </div>

      {/* quick status card */}
      <div className="h-32 rounded-2xl bg-border/40 border border-border/20" />

      {/* grid with list checklists and widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="h-8 w-48 rounded bg-border" />
          <div className="h-64 rounded-2xl bg-border/40 border border-border/20" />
        </div>
        <div className="space-y-6">
          <div className="h-36 rounded-2xl bg-border/40 border border-border/20" />
          <div className="h-40 rounded-2xl bg-border/40 border border-border/20" />
        </div>
      </div>
    </div>
  );
}
