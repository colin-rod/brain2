'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearchData } from './search-provider';
import { SearchResultItem } from './search-result-item';
import { groupResultsByType, getEntityMeta, type SearchableItem } from '@/lib/search-utils';

export function GlobalSearch() {
  const { fuse, isLoading } = useSearchData();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results =
    query.length >= 2 && fuse ? fuse.search(query, { limit: 30 }).map((r) => r.item) : [];

  const groups = groupResultsByType(results);
  const flatResults = groups.flatMap((g) => g.items);

  const navigate = useCallback(
    (item: SearchableItem) => {
      router.push(item.href);
      setQuery('');
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [router],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || flatResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((i) => (i + 1) % flatResults.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((i) => (i - 1 + flatResults.length) % flatResults.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (flatResults[activeIndex]) {
            navigate(flatResults[activeIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, flatResults, activeIndex, navigate],
  );

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  let flatIndex = 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? 'Loading...' : 'Search everything...'}
          className="pl-9 pr-16"
          disabled={isLoading}
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-surface-subtle px-1.5 py-0.5 text-[11px] font-ui text-foreground-muted">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-north-xs max-h-[400px] overflow-y-auto rounded-lg border border-border bg-surface shadow-lg">
          {flatResults.length === 0 ? (
            <div className="px-north-base py-north-lg text-center text-metadata text-foreground-muted">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="py-north-xs">
              {groups.map((group) => {
                const meta = getEntityMeta(group.type);
                return (
                  <div key={group.type}>
                    <p className="px-north-base py-north-xs text-metadata font-semibold text-foreground-muted">
                      {meta.pluralLabel}
                    </p>
                    {group.items.map((item) => {
                      const idx = flatIndex++;
                      return (
                        <SearchResultItem
                          key={item.id}
                          item={item}
                          isActive={idx === activeIndex}
                          onClick={() => navigate(item)}
                          onMouseEnter={() => setActiveIndex(idx)}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
