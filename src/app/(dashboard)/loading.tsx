export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="space-y-8">
      <span className="sr-only">Loading your financial dashboard.</span>

      <header className="space-y-3">
        <div className="skeleton-shimmer h-7 w-36 rounded-full" />

        <div className="skeleton-shimmer h-10 w-full max-w-sm rounded-xl" />

        <div className="skeleton-shimmer h-5 w-full max-w-2xl rounded-lg" />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-4">
                <div className="skeleton-shimmer h-4 w-28 rounded-md" />

                <div className="skeleton-shimmer h-8 w-36 rounded-lg" />

                <div className="skeleton-shimmer h-3.5 w-44 max-w-full rounded-md" />
              </div>

              <div className="skeleton-shimmer size-10 rounded-xl" />
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
        <div className="skeleton-shimmer h-6 w-48 rounded-lg" />

        <div className="mt-3 skeleton-shimmer h-4 w-full max-w-xl rounded-md" />

        <div className="mt-8 skeleton-shimmer h-[320px] w-full rounded-xl" />
      </section>
    </div>
  );
}
