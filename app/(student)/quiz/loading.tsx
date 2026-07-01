export default function QuizLoading() {
  return (
    <div className="animate-pulse space-y-6 max-w-lg mx-auto p-4 sm:p-6 select-none mt-8">
      {/* header description */}
      <div className="space-y-2 text-center flex flex-col items-center">
        <div className="h-4 w-28 rounded bg-border" />
        <div className="h-8 w-48 rounded bg-border" />
      </div>

      {/* card question and answers lists */}
      <div className="rounded-3xl border border-border/20 bg-border/40 p-6 space-y-6">
        <div className="space-y-2 flex flex-col items-center">
          <div className="h-4 w-full rounded bg-border" />
          <div className="h-4 w-3/4 rounded bg-border" />
        </div>

        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-2xl bg-border" />
          ))}
        </div>
      </div>
    </div>
  );
}
