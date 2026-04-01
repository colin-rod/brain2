'use client';

import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

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
      className={`flex items-center gap-north-xs text-metadata font-medium text-foreground-muted hover:text-foreground transition-colors ${className}`}
    >
      {label}
      {isActive ? (
        currentSort.direction === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}
