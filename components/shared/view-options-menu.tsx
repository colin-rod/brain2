'use client';

import { Popover } from '@base-ui/react/popover';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { FilterConfig } from './filter-bar';

export interface ViewSortOption {
  value: string;
  label: string;
}

export interface ViewGroupOption {
  value: string;
  label: string;
}

interface ViewOptionsMenuProps {
  filterConfigs?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onFilterClear?: () => void;
  sortOptions?: ViewSortOption[];
  sortValue?: string;
  onSortChange?: (value: string) => void;
  groupOptions?: ViewGroupOption[];
  groupValue?: string;
  onGroupChange?: (value: string) => void;
  extra?: React.ReactNode;
}

export function ViewOptionsMenu({
  filterConfigs = [],
  filterValues = {},
  onFilterChange,
  onFilterClear,
  sortOptions,
  sortValue,
  onSortChange,
  groupOptions,
  groupValue,
  onGroupChange,
  extra,
}: ViewOptionsMenuProps) {
  const hasActiveFilters = Object.values(filterValues).some(Boolean);
  const defaultSort = sortOptions?.[0]?.value;
  const hasActiveSort = !!sortValue && sortValue !== defaultSort;
  const hasActiveGroup = !!groupValue && groupValue !== 'none';
  const activeCount = (hasActiveFilters ? 1 : 0) + (hasActiveSort ? 1 : 0) + (hasActiveGroup ? 1 : 0);

  const hasSections =
    (sortOptions && sortOptions.length > 0) ||
    filterConfigs.length > 0 ||
    (groupOptions && groupOptions.length > 0);

  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5 shrink-0">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            View
            {activeCount > 0 && (
              <span className="flex items-center justify-center h-4 min-w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1 leading-none">
                {activeCount}
              </span>
            )}
          </Button>
        }
      />

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={4}>
          <Popover.Popup className="z-50 w-64 rounded-lg border border-border bg-popover p-north-md text-popover-foreground shadow-md outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            {hasSections && (
              <div className="space-y-north-md">
                {/* Sort */}
                {sortOptions && sortOptions.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-foreground-muted mb-north-xs">
                      Sort
                    </p>
                    <Select value={sortValue || defaultSort} onValueChange={onSortChange}>
                      <SelectTrigger size="sm" className="w-full text-metadata">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Filters */}
                {filterConfigs.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-foreground-muted mb-north-xs">
                      Filter
                    </p>
                    <div className="space-y-north-xs">
                      {filterConfigs.map((filter) => {
                        if (filter.type === 'select' && filter.options) {
                          return (
                            <div
                              key={filter.key}
                              className="grid grid-cols-[72px_1fr] gap-north-xs items-center"
                            >
                              <span className="text-metadata text-foreground-muted text-right">
                                {filter.label}
                              </span>
                              <Select
                                value={filterValues[filter.key] || ''}
                                onValueChange={(val) =>
                                  onFilterChange?.(filter.key, val === '__all__' ? '' : val)
                                }
                              >
                                <SelectTrigger size="sm" className="w-full text-metadata">
                                  <span>
                                    {filterValues[filter.key]
                                      ? (filter.options.find(
                                          (o) => o.value === filterValues[filter.key],
                                        )?.label ?? filter.label)
                                      : 'All'}
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__all__">All</SelectItem>
                                  {filter.options.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          );
                        }

                        if (filter.type === 'date-range') {
                          return (
                            <div key={filter.key}>
                              <span className="text-metadata text-foreground-muted block mb-north-xs">
                                {filter.label}
                              </span>
                              <div className="flex items-center gap-north-xs">
                                <Input
                                  type="date"
                                  value={filterValues[`${filter.key}_from`] || ''}
                                  onChange={(e) =>
                                    onFilterChange?.(`${filter.key}_from`, e.target.value)
                                  }
                                  className="h-7 text-metadata flex-1"
                                />
                                <span className="text-metadata text-foreground-muted shrink-0">
                                  –
                                </span>
                                <Input
                                  type="date"
                                  value={filterValues[`${filter.key}_to`] || ''}
                                  onChange={(e) =>
                                    onFilterChange?.(`${filter.key}_to`, e.target.value)
                                  }
                                  className="h-7 text-metadata flex-1"
                                />
                              </div>
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  </div>
                )}

                {/* Group by */}
                {groupOptions && groupOptions.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-foreground-muted mb-north-xs">
                      Group by
                    </p>
                    <Select value={groupValue || 'none'} onValueChange={onGroupChange}>
                      <SelectTrigger size="sm" className="w-full text-metadata">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {groupOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {extra && <div className="mt-north-xs">{extra}</div>}
                  </div>
                )}

                {!groupOptions && extra && <div>{extra}</div>}

                {/* Clear all */}
                {(hasActiveFilters || hasActiveSort || hasActiveGroup) && (
                  <button
                    type="button"
                    onClick={() => {
                      onFilterClear?.();
                      if (onSortChange && defaultSort) onSortChange(defaultSort);
                      if (onGroupChange) onGroupChange('none');
                    }}
                    className={cn(
                      'text-metadata text-foreground-muted hover:text-foreground transition-colors',
                      'font-mono text-[10px] uppercase tracking-wider',
                    )}
                  >
                    ✕ Clear all
                  </button>
                )}
              </div>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
