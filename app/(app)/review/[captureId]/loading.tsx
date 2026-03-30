import { Skeleton } from '@/components/ui/skeleton';

export default function ReviewLoading() {
  return (
    <div className="space-y-north-lg">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-5 w-64 mt-north-xs" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-north-lg">
        <div className="lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="lg:col-span-3 space-y-north-lg">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
