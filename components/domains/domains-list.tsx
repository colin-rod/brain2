'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InlineEditableText } from '@/components/notes/inline-editable-text';
import { SearchBar } from '@/components/shared/search-bar';
import { SortableHeader } from '@/components/shared/sortable-header';
import { useListState, applySorting } from '@/lib/hooks/use-list-state';
import { useSearchRefresh } from '@/components/search/search-provider';
import {
  createDomain,
  updateDomain,
  deleteDomain,
  mergeDomains,
} from '@/lib/actions/entity-mutations';
import { summarizeSnippet, formatRelativeDate } from '@/lib/utils';
import { Plus, X, GitMerge } from 'lucide-react';
import type { DomainListRow } from '@/types/database';

interface DomainsListProps {
  domains: DomainListRow[];
}

export function DomainsList({ domains }: DomainsListProps) {
  const router = useRouter();
  const refreshSearch = useSearchRefresh();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);

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

  function toggleSelected(domainId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(domainId)) next.delete(domainId);
      else next.add(domainId);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function openMerge() {
    if (selectedIds.size < 2) return;
    setMergeTargetId(Array.from(selectedIds)[0] ?? null);
    setMergeOpen(true);
  }

  function handleMergeConfirm() {
    if (!mergeTargetId) return;
    const sources = Array.from(selectedIds).filter((id) => id !== mergeTargetId);
    if (sources.length === 0) return;

    startTransition(async () => {
      const result = await mergeDomains(mergeTargetId, sources);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Merged ${sources.length} into target`);
        clearSelection();
        setMergeOpen(false);
        setMergeTargetId(null);
        router.refresh();
        refreshSearch();
      }
    });
  }

  const selectedDomains = useMemo(
    () => domains.filter((d) => selectedIds.has(d.id)),
    [domains, selectedIds],
  );

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

      {/* Selection action bar */}
      {selectedIds.size > 0 && (
        <div className="hidden sm:flex items-center justify-between gap-north-sm rounded-md border border-primary/40 bg-primary-tint/50 px-north-md py-north-sm animate-fade-in">
          <span className="text-metadata text-foreground">{selectedIds.size} selected</span>
          <div className="flex items-center gap-north-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={openMerge}
              disabled={selectedIds.size < 2 || isPending}
              className="gap-1"
            >
              <GitMerge className="h-3.5 w-3.5" />
              Merge…
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Merge dialog */}
      {mergeOpen && selectedDomains.length >= 2 && (
        <div className="hidden sm:block rounded-md border border-border bg-surface p-north-md space-y-north-md animate-fade-in">
          <div>
            <h3 className="text-section-header">Merge {selectedDomains.length} domains</h3>
            <p className="text-metadata text-foreground-muted mt-north-xs">
              All notes linked to the source domains will be re-pointed to the target. The source
              records will be deleted. This cannot be undone.
            </p>
          </div>
          <div className="space-y-north-xs">
            <label className="text-metadata text-foreground-muted">Keep as target</label>
            <Select value={mergeTargetId ?? ''} onValueChange={(v) => setMergeTargetId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose target domain…" />
              </SelectTrigger>
              <SelectContent>
                {selectedDomains.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {mergeTargetId && (
            <p className="text-metadata text-foreground-muted">
              Will delete:{' '}
              <span className="text-foreground">
                {selectedDomains
                  .filter((d) => d.id !== mergeTargetId)
                  .map((d) => d.name)
                  .join(', ')}
              </span>
            </p>
          )}
          <div className="flex items-center justify-end gap-north-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMergeOpen(false);
                setMergeTargetId(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleMergeConfirm} disabled={!mergeTargetId || isPending}>
              Merge
            </Button>
          </div>
        </div>
      )}

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
        {filtered.map((domain, index) => {
          const isSelected = selectedIds.has(domain.id);
          return (
            <div
              key={domain.id}
              className={`group rounded-lg border bg-surface border-l-[3px] border-l-[--entity-domains] px-north-md py-north-sm cursor-pointer hover:bg-surface-subtle transition-colors animate-slide-in-up ${isSelected ? 'border-primary' : 'border-border'}`}
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
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="w-8 px-north-sm" />
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
                  colSpan={7}
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

            {filtered.map((domain, index) => {
              const isSelected = selectedIds.has(domain.id);
              return (
                <tr
                  key={domain.id}
                  className="group border-b border-border last:border-0 hover:bg-surface-subtle transition-colors cursor-pointer animate-slide-in-up"
                  style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
                  onClick={() => router.push(`/domains/${domain.id}`)}
                >
                  <td
                    onClick={(e) => e.stopPropagation()}
                    className="pl-north-sm pr-north-xs py-north-sm w-8"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelected(domain.id)}
                      aria-label={`Select ${domain.name}`}
                      className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
                    />
                  </td>
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
              );
            })}
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
