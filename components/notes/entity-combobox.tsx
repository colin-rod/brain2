'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface EntityItem {
  id: string;
  name: string;
}

interface EntityComboboxProps {
  items: EntityItem[];
  excludeIds: string[];
  onSelect: (item: EntityItem) => void;
  onCreate: (name: string) => void;
  onClose: () => void;
  placeholder?: string;
}

export function EntityCombobox({
  items,
  excludeIds,
  onSelect,
  onCreate,
  onClose,
  placeholder = 'Search or create...',
}: EntityComboboxProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const available = useMemo(
    () => items.filter((i) => !excludeIds.includes(i.id)),
    [items, excludeIds],
  );

  const fuse = useMemo(() => new Fuse(available, { keys: ['name'], threshold: 0.4 }), [available]);

  const results = useMemo(() => {
    if (!query.trim()) return available.slice(0, 8);
    return fuse
      .search(query)
      .map((r) => r.item)
      .slice(0, 8);
  }, [query, available, fuse]);

  const exactMatch = available.some((i) => i.name.toLowerCase() === query.trim().toLowerCase());
  const showCreate = query.trim().length > 0 && !exactMatch;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && showCreate && results.length === 0) {
      onCreate(query.trim());
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="text-body"
      />
      {(results.length > 0 || showCreate) && (
        <div className="absolute z-50 top-full mt-1 w-full rounded-md border border-border bg-surface shadow-md max-h-48 overflow-y-auto">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="w-full text-left px-north-md py-north-sm text-body hover:bg-surface-subtle transition-colors"
            >
              {item.name}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onClick={() => onCreate(query.trim())}
              className="w-full text-left px-north-md py-north-sm text-body hover:bg-surface-subtle transition-colors flex items-center gap-north-xs text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Create &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
