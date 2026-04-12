import { cn } from '@/lib/utils';

function Skeleton({ className, style, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('rounded-md bg-surface-subtle animate-shimmer bg-size-[200%_100%]', className)}
      style={{
        backgroundImage: 'var(--shimmer-gradient)',
        ...style,
      }}
      {...props}
    />
  );
}

export { Skeleton };
