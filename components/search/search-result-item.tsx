import type { SearchableItem } from '@/lib/search-utils';
import { getEntityMeta } from '@/lib/search-utils';

interface SearchResultItemProps {
  item: SearchableItem;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

export function SearchResultItem({ item, isActive, onClick, onMouseEnter }: SearchResultItemProps) {
  const meta = getEntityMeta(item.type);
  const Icon = meta.icon;

  return (
    <button
      type="button"
      className={`flex w-full items-center gap-north-sm px-north-base py-north-sm text-left rounded-md transition-colors ${
        isActive ? 'bg-surface-subtle' : 'hover:bg-surface-subtle'
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <Icon className="h-4 w-4 shrink-0 text-foreground-muted" />
      <div className="min-w-0 flex-1">
        <p className="text-body text-foreground truncate">{item.primary}</p>
        {item.secondary && (
          <p className="text-metadata text-foreground-muted truncate">{item.secondary}</p>
        )}
      </div>
    </button>
  );
}
