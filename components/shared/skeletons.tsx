import { Skeleton } from '@/components/ui/skeleton';

export function NotesListSkeleton() {
  return (
    <div className="space-y-north-md">
      <Skeleton className="h-9 w-full rounded-md" />
      <div className="divide-y divide-border border-t border-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-baseline gap-north-md px-north-sm py-north-xs border-l-[3px] border-l-surface-subtle"
          >
            <Skeleton className="h-3 w-6 shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="hidden sm:block h-3 flex-1" />
            <Skeleton className="h-3 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaptureListSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-north-md px-north-sm py-north-xs">
          <div className="flex flex-col items-center shrink-0 w-8 gap-1">
            <Skeleton className="h-3 w-5" />
            <Skeleton className="h-1.5 w-1.5 rounded-full" />
            <Skeleton className="h-2 w-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-16 rounded-none" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WikiPageSkeleton() {
  return (
    <div className="space-y-north-lg">
      {/* Back + title */}
      <div className="flex items-center gap-north-sm">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-7 w-48" />
      </div>
      <Skeleton className="h-4 w-32" />

      {/* Summary block */}
      <div className="rounded-lg border border-border border-l-[3px] border-l-surface-subtle bg-surface-subtle px-north-base py-north-md space-y-north-sm">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Section skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <div className="flex items-center gap-north-sm mb-north-md">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-north-xs">
            {Array.from({ length: 2 }).map((_, j) => (
              <div
                key={j}
                className="rounded-md border border-border bg-surface px-north-md py-north-sm"
              >
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3 mt-1" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Timeline skeleton */}
      <div>
        <div className="flex items-center gap-north-sm mb-north-md">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-north-sm py-north-xs pl-north-md border-l-2 border-border ml-1.5"
          >
            <Skeleton className="h-3.5 w-3.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-north-sm">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PeopleGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-north-sm">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-surface px-north-base py-north-md border-l-[3px] border-l-surface-subtle"
        >
          <Skeleton className="h-4 w-2/3 mb-1.5" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
