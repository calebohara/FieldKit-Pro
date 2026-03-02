export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer skeleton ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
      <Skeleton className="h-8 w-8 mb-3" />
      <Skeleton className="h-5 w-32 mb-2" />
      <Skeleton className="h-4 w-48" />
    </div>
  );
}

export function PageSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="animate-fade-in">
      <Skeleton className="h-8 w-40 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
