'use client';

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSort: SortState | null;
  onSort: (field: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  field,
  currentSort,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentSort?.field === field;
  const ariaLabel = isActive
    ? `Sort by ${label}, ${currentSort.direction === 'asc' ? 'ascending' : 'descending'}`
    : `Sort by ${label}`;

  const ariaSort = isActive
    ? currentSort.direction === 'asc'
      ? ('ascending' as const)
      : ('descending' as const)
    : ('none' as const);

  return (
    <button
      type="button"
      role="columnheader"
      aria-label={ariaLabel}
      aria-sort={ariaSort}
      onClick={() => onSort(field)}
      className={`flex items-center gap-0.5 text-metadata font-semibold uppercase tracking-widest text-foreground-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      {label}
      {isActive ? (
        currentSort.direction === 'asc' ? (
          <span aria-hidden="true" className="font-mono text-[10px] leading-none">
            ▲
          </span>
        ) : (
          <span aria-hidden="true" className="font-mono text-[10px] leading-none">
            ▼
          </span>
        )
      ) : (
        <span aria-hidden="true" className="font-mono text-[10px] leading-none opacity-40">
          ⇅
        </span>
      )}
    </button>
  );
}
