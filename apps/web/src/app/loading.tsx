export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2 pb-6 border-b border-border/40 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-secondary/80 rounded-lg" />
          <div className="h-4 w-72 bg-secondary/50 rounded" />
        </div>
        <div className="h-9 w-32 bg-secondary/80 rounded-lg" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-secondary/60 rounded" />
              <div className="h-8 w-8 bg-secondary/80 rounded-lg" />
            </div>
            <div className="h-7 w-20 bg-secondary/90 rounded" />
            <div className="h-3 w-32 bg-secondary/40 rounded" />
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="glass-card p-6 rounded-xl space-y-4">
        <div className="h-6 w-36 bg-secondary/70 rounded" />
        <div className="space-y-2.5">
          <div className="h-12 bg-secondary/40 rounded-lg" />
          <div className="h-12 bg-secondary/30 rounded-lg" />
          <div className="h-12 bg-secondary/20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
