import { useState, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import type { SortState } from '@/components/shared/sortable-header';

interface UseListStateOptions<T> {
  items: T[];
  searchKeys: string[];
  searchThreshold?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useListState<T extends Record<string, any>>({
  items,
  searchKeys,
  searchThreshold = 0.4,
}: UseListStateOptions<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<SortState | null>(null);
  const [search, setSearch] = useState('');

  const fuse = useMemo(
    () => new Fuse(items, { keys: searchKeys, threshold: searchThreshold, ignoreLocation: true }),
    [items, searchKeys, searchThreshold],
  );

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const toggleSort = useCallback((field: string) => {
    setSort((prev) => {
      if (prev?.field === field) {
        return prev.direction === 'asc' ? { field, direction: 'desc' } : null;
      }
      return { field, direction: 'asc' };
    });
  }, []);

  const searched = useMemo(() => {
    if (search.length < 2) return items;
    return fuse.search(search).map((r) => r.item);
  }, [search, items, fuse]);

  return {
    filters,
    sort,
    search,
    setFilter,
    clearFilters,
    toggleSort,
    setSearch,
    searched,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applySorting<T extends Record<string, any>>(
  items: T[],
  sort: SortState | null,
): T[] {
  if (!sort) return items;
  return [...items].sort((a, b) => {
    const aVal = a[sort.field];
    const bVal = b[sort.field];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    const cmp = String(aVal).localeCompare(String(bVal), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
    return sort.direction === 'asc' ? cmp : -cmp;
  });
}
