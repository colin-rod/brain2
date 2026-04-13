import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  iconColor?: string;
  bgColor?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  iconColor,
  bgColor,
  ctaLabel,
  ctaHref,
}: EmptyStateProps) {
  return (
    <div className="animate-fade-in rounded-xl border border-border-divider bg-primary-tint-subtle p-north-2xl text-center group">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full mb-north-sm animate-float transition-[transform,box-shadow] duration-300 group-hover:scale-110 group-hover:shadow-[0_0_0_4px_hsl(0_0%_0%/0.06)]"
        style={{ backgroundColor: bgColor ?? 'var(--primary-tint)' }}
      >
        <Icon className="h-6 w-6" style={{ color: iconColor ?? 'var(--primary)' }} />
      </div>
      <div className="animate-slide-in-up" style={{ animationDelay: '80ms' }}>
        <p className="text-subtitle text-foreground">{title}</p>
        {description && (
          <p className="text-metadata text-foreground-secondary mt-north-xs leading-relaxed tracking-[0.01em]">
            {description}
          </p>
        )}
        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-north-sm mt-north-base text-metadata font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {ctaLabel} <span aria-hidden="true">&rarr;</span>
          </Link>
        )}
      </div>
    </div>
  );
}
