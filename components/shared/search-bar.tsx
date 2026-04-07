'use client';

import { useCallback, useState } from 'react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  defaultValue?: string;
}

export function SearchBar({
  placeholder = 'Search...',
  onSearch,
  defaultValue = '',
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setValue(v);
      onSearch(v);
    },
    [onSearch],
  );

  return (
    <div className="relative flex items-center border border-input rounded-none bg-transparent focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30">
      <span className="pl-2.5 font-mono text-sm text-primary select-none shrink-0">&gt;</span>
      <Input
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="border-0 rounded-none pl-1.5 focus-visible:border-0 focus-visible:ring-0 placeholder:uppercase placeholder:tracking-wider placeholder:font-mono placeholder:text-[12px] bg-transparent"
      />
    </div>
  );
}
