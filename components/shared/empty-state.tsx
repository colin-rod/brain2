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
  iconColor: _iconColor,
  bgColor: _bgColor,
  ctaLabel,
  ctaHref,
}: EmptyStateProps) {
  return (
    <div className="animate-fade-in rounded-xl border border-border-divider bg-primary-tint-subtle p-north-2xl text-center group">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint mb-north-sm animate-float transition-[transform,box-shadow] duration-300 group-hover:scale-110 group-hover:shadow-[0_0_0_4px_hsl(17_90%_88%/0.5)]">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="animate-slide-in-up" style={{ animationDelay: '80ms' }}>
        <p className="font-accent text-[17px] font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-[13px] text-foreground-secondary mt-north-xs leading-relaxed tracking-[0.01em]">
            {description}
          </p>
        )}
        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-1.5 mt-north-base text-[13px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {ctaLabel} <span aria-hidden="true">&rarr;</span>
          </Link>
        )}
      </div>
    </div>
  );
}
