'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'date-range';
  options?: FilterOption[];
}

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}

export function FilterBar({ filters, values, onChange, onClear }: FilterBarProps) {
  const hasActive = Object.values(values).some((v) => v !== '');

  return (
    <div className="flex flex-wrap items-center gap-north-sm">
      {filters.map((filter) => {
        if (filter.type === 'select' && filter.options) {
          return (
            <Select
              key={filter.key}
              value={values[filter.key] || ''}
              onValueChange={(val) =>
                onChange(filter.key, val === '__all__' ? '' : (val as string))
              }
            >
              <SelectTrigger size="sm" className="text-metadata">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All {filter.label}</SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        if (filter.type === 'date-range') {
          return (
            <div key={filter.key} className="flex items-center gap-north-xs">
              <Input
                type="date"
                value={values[`${filter.key}_from`] || ''}
                onChange={(e) => onChange(`${filter.key}_from`, e.target.value)}
                className="h-7 text-metadata w-32"
                placeholder="From"
              />
              <span className="text-metadata text-foreground-muted">to</span>
              <Input
                type="date"
                value={values[`${filter.key}_to`] || ''}
                onChange={(e) => onChange(`${filter.key}_to`, e.target.value)}
                className="h-7 text-metadata w-32"
                placeholder="To"
              />
            </div>
          );
        }

        return null;
      })}

      {hasActive && (
        <Button variant="ghost" size="xs" onClick={onClear} className="text-foreground-muted">
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
