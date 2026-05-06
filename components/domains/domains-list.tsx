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
import { summarizeSnippet, formatRelativeDate } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import type { DomainListRow } from '@/types/database';

interface DomainsListProps {
  domains: DomainListRow[];
}

export function DomainsList({ domains }: DomainsListProps) {
  const router = useRouter();
  const refreshSearch = useSearchRefresh();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);

  const { sort, search, toggleSort, setSearch, searched } = useListState<DomainListRow>({
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

  const thClass =
    'text-left px-north-sm py-north-sm text-metadata font-semibold uppercase tracking-widest text-foreground-muted whitespace-nowrap';

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

      {/* Mobile cards */}
      <div className="sm:hidden space-y-north-xs">
        {isAdding && (
          <div className="rounded-lg border border-border bg-surface border-l-[3px] border-l-[--entity-domains] px-north-md py-north-sm">
            <InlineEditableText
              value=""
              onSave={async (v) => {
                handleCreate(v);
                return {};
              }}
              placeholder="Domain name... (Enter to save)"
              className="text-body"
            />
          </div>
        )}
        {filtered.map((domain, index) => (
          <div
            key={domain.id}
            className="group rounded-lg border border-border bg-surface border-l-[3px] border-l-[--entity-domains] px-north-md py-north-sm cursor-pointer hover:bg-surface-subtle transition-colors animate-slide-in-up"
            style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
            onClick={() => router.push(`/domains/${domain.id}`)}
          >
            <div className="flex items-start justify-between gap-north-sm">
              <div className="min-w-0 flex-1">
                <p className="text-body font-medium truncate">{domain.name}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(domain.id);
                }}
                disabled={isPending}
                className="relative touch-target text-foreground-muted hover:text-destructive h-7 w-7 p-0 shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-north-md gap-y-0.5 mt-north-xs">
              {domain.note_count > 0 && (
                <span className="text-metadata text-foreground-muted">
                  {domain.note_count} notes
                </span>
              )}
              {domain.open_question_count > 0 && (
                <span className="text-metadata text-(--entity-questions)">
                  {domain.open_question_count} questions
                </span>
              )}
              <span className="text-metadata text-foreground-muted ml-auto">
                {formatRelativeDate(domain.last_activity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className={thClass}>
                <SortableHeader label="Name" field="name" currentSort={sort} onSort={toggleSort} />
              </th>
              <th className={`${thClass} text-center`}>
                <SortableHeader
                  label="Notes"
                  field="note_count"
                  currentSort={sort}
                  onSort={toggleSort}
                />
              </th>
              <th className={`${thClass} text-center`}>
                <SortableHeader
                  label="Questions"
                  field="open_question_count"
                  currentSort={sort}
                  onSort={toggleSort}
                />
              </th>
              <th className={thClass}>
                <SortableHeader
                  label="Last Activity"
                  field="last_activity"
                  currentSort={sort}
                  onSort={toggleSort}
                />
              </th>
              <th className={`${thClass} hidden md:table-cell`}>Summary</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {isAdding && (
              <tr className="border-b border-border">
                <td
                  colSpan={6}
                  className="px-north-md py-north-md border-l-[3px] border-l-[--entity-domains]"
                >
                  <InlineEditableText
                    value=""
                    onSave={async (v) => {
                      handleCreate(v);
                      return {};
                    }}
                    placeholder="Domain name... (Enter to save)"
                    className="text-body"
                  />
                </td>
              </tr>
            )}

            {filtered.map((domain, index) => (
              <tr
                key={domain.id}
                className="group border-b border-border last:border-0 hover:bg-surface-subtle transition-colors cursor-pointer animate-slide-in-up"
                style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
                onClick={() => router.push(`/domains/${domain.id}`)}
              >
                <td
                  onClick={(e) => e.stopPropagation()}
                  className="border-l-[3px] border-l-[--entity-domains] pl-north-md pr-north-sm py-north-sm min-w-40"
                >
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
                    className="text-body font-medium"
                  />
                </td>
                <td className="px-north-sm py-north-sm text-center text-metadata w-16">
                  {domain.note_count > 0 ? (
                    domain.note_count
                  ) : (
                    <span className="text-foreground-muted">—</span>
                  )}
                </td>
                <td className="px-north-sm py-north-sm text-center text-metadata w-24">
                  {domain.open_question_count > 0 ? (
                    <span className="text-(--entity-questions) font-medium">
                      {domain.open_question_count}
                    </span>
                  ) : (
                    <span className="text-foreground-muted">—</span>
                  )}
                </td>
                <td className="px-north-sm py-north-sm text-metadata text-foreground-muted whitespace-nowrap w-28">
                  {formatRelativeDate(domain.last_activity)}
                </td>
                <td className="px-north-sm py-north-sm text-metadata text-foreground-muted max-w-75 hidden md:table-cell">
                  <span className="line-clamp-1">
                    {summarizeSnippet(domain.compiled_summary) || '—'}
                  </span>
                </td>
                <td className="pr-north-sm py-north-sm w-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(domain.id);
                    }}
                    disabled={isPending}
                    className="relative touch-target opacity-0 group-hover:opacity-100 focus-visible:opacity-100 touch-reveal text-foreground-muted hover:text-destructive h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && search.length >= 2 && (
        <p className="text-body text-foreground-muted text-center py-north-lg">
          No domains match &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  );
}
