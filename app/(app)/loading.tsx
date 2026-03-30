import { Skeleton } from '@/components/ui/skeleton';

export default function AppLoading() {
  return (
    <div className="space-y-north-lg">
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-72 mt-north-xs" />
      </div>
      <div className="space-y-north-sm">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  );
}
