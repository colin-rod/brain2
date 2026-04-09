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
