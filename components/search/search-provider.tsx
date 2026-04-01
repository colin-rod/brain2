'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import { fetchAllSearchableEntities } from '@/lib/actions/search';
import {
  normalizeToSearchableItems,
  type AllEntities,
  type SearchableItem,
} from '@/lib/search-utils';

interface SearchContextValue {
  items: SearchableItem[];
  fuse: Fuse<SearchableItem> | null;
  isLoading: boolean;
  refresh: () => void;
}

const SearchContext = createContext<SearchContextValue>({
  items: [],
  fuse: null,
  isLoading: true,
  refresh: () => {},
});

export function useSearchData() {
  return useContext(SearchContext);
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AllEntities | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAllSearchableEntities().then((result) => {
      if (!cancelled) {
        setData(result);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = () => {
    setIsLoading(true);
    fetchAllSearchableEntities().then((result) => {
      setData(result);
      setIsLoading(false);
    });
  };

  const items = useMemo(() => (data ? normalizeToSearchableItems(data) : []), [data]);

  const fuse = useMemo(() => {
    if (items.length === 0) return null;
    return new Fuse(items, {
      keys: [
        { name: 'primary', weight: 0.5 },
        { name: 'secondary', weight: 0.3 },
        { name: 'tertiary', weight: 0.2 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [items]);

  const value = useMemo(() => ({ items, fuse, isLoading, refresh }), [items, fuse, isLoading]);

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}
