'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { InlineEditableText } from '@/components/notes/inline-editable-text';
import { SearchBar } from '@/components/shared/search-bar';
import { SortableHeader } from '@/components/shared/sortable-header';
import { useListState, applySorting } from '@/lib/hooks/use-list-state';
import { useSearchRefresh } from '@/components/search/search-provider';
import { createDomain, updateDomain, deleteDomain } from '@/lib/actions/entity-mutations';
import { Plus, X } from 'lucide-react';
import type { Domain } from '@/types/database';

type DomainWithNotes = Domain & {
  note_domains: { note_id: string }[];
};

interface DomainsListProps {
  domains: DomainWithNotes[];
}

export function DomainsList({ domains }: DomainsListProps) {
  const router = useRouter();
  const refreshSearch = useSearchRefresh();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);

  const { sort, search, toggleSort, setSearch, searched } = useListState<DomainWithNotes>({
    items: domains,
    searchKeys: ['name', 'description'],
  });

  const filtered = useMemo(() => {
    return applySorting(searched, sort);
  }, [searched, sort]);

  function handleCreate(name: string) {
    if (!name.trim()) {
      setIsAdding(false);
      return;
    }
    startTransition(async () => {
      const result = await createDomain({ name });
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
        refreshSearch();
      }
      setIsAdding(false);
    });
  }

  function handleDelete(domainId: string) {
    startTransition(async () => {
      const result = await deleteDomain(domainId);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
        refreshSearch();
      }
    });
  }

  return (
    <div className="space-y-north-md">
      <div className="flex items-center justify-between">
        <SearchBar placeholder="Search domains..." onSearch={setSearch} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="gap-1 ml-north-md shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New Domain
        </Button>
      </div>

      <div className="flex items-center gap-north-md px-north-xs">
        <SortableHeader label="Name" field="name" currentSort={sort} onSort={toggleSort} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-north-sm">
        {isAdding && (
          <div className="rounded-lg border border-primary/30 bg-surface px-north-base py-north-md animate-scale-in">
            <InlineEditableText
              value=""
              onSave={async (v) => {
                handleCreate(v);
                return {};
              }}
              placeholder="Domain name... (Enter to save)"
              className="text-issue-title"
            />
          </div>
        )}

        {filtered.map((domain, index) => (
          <div
            key={domain.id}
            className="group relative rounded-lg border border-border bg-surface px-north-base py-north-md hover:bg-surface-subtle transition-colors border-l-[3px] border-l-(--entity-domains) animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(domain.id)}
              disabled={isPending}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-foreground-muted hover:text-destructive h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>

            <InlineEditableText
              value={domain.name}
              onSave={async (v) => {
                const r = await updateDomain(domain.id, { name: v });
                if (!r.error) {
                  router.refresh();
                  refreshSearch();
                }
                return r;
              }}
              className="text-issue-title"
            />
            <InlineEditableText
              value={domain.description || ''}
              onSave={async (v) => {
                const r = await updateDomain(domain.id, { description: v || null });
                if (!r.error) {
                  router.refresh();
                  refreshSearch();
                }
                return r;
              }}
              placeholder="Add description..."
              className="text-metadata text-foreground-muted mt-0.5"
            />

            <p className="text-[11px] text-foreground-muted mt-north-xs">
              {domain.note_domains.length} {domain.note_domains.length === 1 ? 'note' : 'notes'}
            </p>
          </div>
        ))}
      </div>

      {filtered.length === 0 && search.length >= 2 && (
        <p className="text-body text-foreground-muted text-center py-north-lg">
          No domains match &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  );
}
