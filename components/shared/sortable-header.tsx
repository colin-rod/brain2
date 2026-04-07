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

  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={`flex items-center gap-0.5 text-metadata font-semibold uppercase tracking-widest text-foreground-muted hover:text-foreground transition-colors ${className}`}
    >
      {label}
      {isActive ? (
        currentSort.direction === 'asc' ? (
          <span className="font-mono text-[10px] leading-none">▲</span>
        ) : (
          <span className="font-mono text-[10px] leading-none">▼</span>
        )
      ) : (
        <span className="font-mono text-[10px] leading-none opacity-40">⇅</span>
      )}
    </button>
  );
}
