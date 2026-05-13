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
import { type FilterConfig } from '@/components/shared/filter-bar';
import { ViewOptionsMenu } from '@/components/shared/view-options-menu';
import { SortableHeader } from '@/components/shared/sortable-header';
import { GroupLabel } from '@/components/shared/group-label';
import { useListState, applySorting } from '@/lib/hooks/use-list-state';
import { useSearchRefresh } from '@/components/search/search-provider';
import {
  createPerson,
  updatePerson,
  deletePerson,
  setPersonPinned,
  mergePeople,
} from '@/lib/actions/entity-mutations';
import { summarizeSnippet, formatRelativeDate } from '@/lib/utils';
import { Plus, X, Star, GitMerge } from 'lucide-react';
import type { Project, NoteDomain, PersonListRow } from '@/types/database';

interface PeopleListProps {
  people: PersonListRow[];
  allProjects: Pick<Project, 'id' | 'name'>[];
  allDomains: { id: string; name: string }[];
  noteDomains: NoteDomain[];
  notePeople: { note_id: string; person_id: string }[];
}

const GROUP_OPTIONS = [
  { value: 'none', label: 'No grouping' },
  { value: 'role', label: 'Role' },
  { value: 'project', label: 'Project' },
  { value: 'recency', label: 'Last activity' },
];

const ACTIVITY_OPTIONS = [
  { value: 'active_7d', label: 'Active in last 7d' },
  { value: 'active_30d', label: 'Active in last 30d' },
  { value: 'active_90d', label: 'Active in last 90d' },
  { value: 'dormant_90d', label: 'Dormant (90d+)' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function recencyBucket(last: string | null, now: number): string {
  if (!last) return 'No activity';
  const ageDays = (now - new Date(last).getTime()) / DAY_MS;
  if (ageDays <= 7) return 'Active (last 7d)';
  if (ageDays <= 30) return 'Active (last 30d)';
  if (ageDays <= 90) return 'Active (last 90d)';
  return 'Dormant (90d+)';
}

const RECENCY_ORDER = [
  'Active (last 7d)',
  'Active (last 30d)',
  'Active (last 90d)',
  'Dormant (90d+)',
  'No activity',
];

export function PeopleList({
  people,
  allProjects,
  allDomains,
  noteDomains,
  notePeople,
}: PeopleListProps) {
  const router = useRouter();
  const refreshSearch = useSearchRefresh();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [groupBy, setGroupBy] = useState<string>('none');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'project',
        label: 'Project',
        type: 'select',
        options: allProjects.map((p) => ({ value: p.id, label: p.name })),
      },
      {
        key: 'domain',
        label: 'Domain',
        type: 'select',
        options: allDomains.map((d) => ({ value: d.id, label: d.name })),
      },
      {
        key: 'activity',
        label: 'Activity',
        type: 'select',
        options: ACTIVITY_OPTIONS,
      },
    ],
    [allProjects, allDomains],
  );

  const { filters, sort, search, setFilter, clearFilters, toggleSort, setSearch, searched } =
    useListState<PersonListRow>({
      items: people,
      searchKeys: ['name', 'role', 'organization'],
    });

  // Snapshot now on mount so activity buckets are stable across re-renders.
  const [nowMs] = useState(() => Date.now());

  const filtered = useMemo(() => {
    let result = searched;

    if (filters.project) {
      result = result.filter((p) =>
        p.project_people.some((pp) => pp.projects.id === filters.project),
      );
    }
    if (filters.domain) {
      const noteIdsForDomain = new Set(
        noteDomains.filter((nd) => nd.domain_id === filters.domain).map((nd) => nd.note_id),
      );
      const personIdsForDomain = new Set(
        notePeople.filter((np) => noteIdsForDomain.has(np.note_id)).map((np) => np.person_id),
      );
      result = result.filter((p) => personIdsForDomain.has(p.id));
    }
    if (filters.activity) {
      result = result.filter((p) => {
        if (!p.last_activity) return filters.activity === 'dormant_90d';
        const ageDays = (nowMs - new Date(p.last_activity).getTime()) / DAY_MS;
        switch (filters.activity) {
          case 'active_7d':
            return ageDays <= 7;
          case 'active_30d':
            return ageDays <= 30;
          case 'active_90d':
            return ageDays <= 90;
          case 'dormant_90d':
            return ageDays > 90;
          default:
            return true;
        }
      });
    }

    return applySorting(result, sort);
  }, [searched, filters, sort, noteDomains, notePeople, nowMs]);

  const pinnedRows = useMemo(() => filtered.filter((p) => p.pinned), [filtered]);
  const unpinnedRows = useMemo(() => filtered.filter((p) => !p.pinned), [filtered]);

  // Sections: ordered list of { label, rows } for the unpinned set.
  // Rows fan out for project grouping (one row per project link).
  const sections = useMemo<{ label: string | null; rows: PersonListRow[] }[]>(() => {
    if (groupBy === 'none') return [{ label: null, rows: unpinnedRows }];

    const map = new Map<string, PersonListRow[]>();
    const push = (key: string, row: PersonListRow) => {
      const arr = map.get(key) ?? [];
      arr.push(row);
      map.set(key, arr);
    };

    for (const person of unpinnedRows) {
      if (groupBy === 'role') {
        push(person.role?.trim() || 'No role', person);
      } else if (groupBy === 'project') {
        if (person.project_people.length === 0) {
          push('No project', person);
        } else {
          for (const pp of person.project_people) {
            push(pp.projects.name, person);
          }
        }
      } else if (groupBy === 'recency') {
        push(recencyBucket(person.last_activity, nowMs), person);
      }
    }

    const entries = Array.from(map.entries());
    if (groupBy === 'recency') {
      entries.sort(([a], [b]) => RECENCY_ORDER.indexOf(a) - RECENCY_ORDER.indexOf(b));
    } else {
      entries.sort(([a], [b]) => a.localeCompare(b));
    }
    return entries.map(([label, rows]) => ({ label, rows }));
  }, [unpinnedRows, groupBy, nowMs]);

  function handleCreate(name: string) {
    if (!name.trim()) {
      setIsAdding(false);
      return;
    }
    startTransition(async () => {
      const result = await createPerson({ name });
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
        refreshSearch();
      }
      setIsAdding(false);
    });
  }

  function handleDelete(personId: string) {
    startTransition(async () => {
      const result = await deletePerson(personId);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
        refreshSearch();
      }
    });
  }

  function handleTogglePinned(personId: string, current: boolean) {
    startTransition(async () => {
      const result = await setPersonPinned(personId, !current);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function toggleSelected(personId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) next.delete(personId);
      else next.add(personId);
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
      const result = await mergePeople(mergeTargetId, sources);
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

  const selectedPeople = useMemo(
    () => people.filter((p) => selectedIds.has(p.id)),
    [people, selectedIds],
  );

  const thClass =
    'text-left px-north-sm py-north-sm text-metadata font-semibold uppercase tracking-widest text-foreground-muted whitespace-nowrap';

  function renderRow(person: PersonListRow, index: number) {
    const isSelected = selectedIds.has(person.id);
    return (
      <tr
        key={`${person.id}-${index}`}
        className="group border-b border-border last:border-0 hover:bg-surface-subtle transition-colors cursor-pointer animate-slide-in-up"
        style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
        onClick={() => router.push(`/people/${person.id}`)}
      >
        <td
          onClick={(e) => e.stopPropagation()}
          className="pl-north-sm pr-north-xs py-north-sm w-8"
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelected(person.id)}
            aria-label={`Select ${person.name}`}
            className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
          />
        </td>
        <td onClick={(e) => e.stopPropagation()} className="px-north-xs py-north-sm w-8">
          <button
            type="button"
            onClick={() => handleTogglePinned(person.id, person.pinned)}
            disabled={isPending}
            aria-label={person.pinned ? `Unpin ${person.name}` : `Pin ${person.name}`}
            className="text-foreground-muted hover:text-primary transition-colors"
          >
            <Star className={`h-3.5 w-3.5 ${person.pinned ? 'fill-primary text-primary' : ''}`} />
          </button>
        </td>
        <td
          onClick={(e) => e.stopPropagation()}
          className="border-l-[3px] border-l-[--entity-people] pl-north-md pr-north-sm py-north-sm min-w-40"
        >
          <InlineEditableText
            value={person.name}
            onSave={async (v) => {
              const r = await updatePerson(person.id, { name: v });
              if (!r.error) {
                router.refresh();
                refreshSearch();
              }
              return r;
            }}
            className="text-body font-medium"
          />
        </td>
        <td onClick={(e) => e.stopPropagation()} className="px-north-sm py-north-sm min-w-25">
          <InlineEditableText
            value={person.role || ''}
            onSave={async (v) => {
              const r = await updatePerson(person.id, { role: v || null });
              if (!r.error) {
                router.refresh();
                refreshSearch();
              }
              return r;
            }}
            placeholder="Add role..."
            className="text-metadata text-foreground-muted"
          />
        </td>
        <td onClick={(e) => e.stopPropagation()} className="px-north-sm py-north-sm min-w-25">
          <InlineEditableText
            value={person.organization || ''}
            onSave={async (v) => {
              const r = await updatePerson(person.id, { organization: v || null });
              if (!r.error) {
                router.refresh();
                refreshSearch();
              }
              return r;
            }}
            placeholder="Add org..."
            className="text-metadata text-foreground-muted"
          />
        </td>
        <td className="px-north-sm py-north-sm text-center text-metadata w-16">
          {person.note_count > 0 ? (
            person.note_count
          ) : (
            <span className="text-foreground-muted">—</span>
          )}
        </td>
        <td className="px-north-sm py-north-sm text-center text-metadata w-16">
          {person.open_task_count > 0 ? (
            <span className="text-(--entity-tasks) font-medium">{person.open_task_count}</span>
          ) : (
            <span className="text-foreground-muted">—</span>
          )}
        </td>
        <td className="px-north-sm py-north-sm text-center text-metadata w-24">
          {person.open_question_count > 0 ? (
            <span className="text-(--entity-questions) font-medium">
              {person.open_question_count}
            </span>
          ) : (
            <span className="text-foreground-muted">—</span>
          )}
        </td>
        <td className="px-north-sm py-north-sm text-metadata text-foreground-muted whitespace-nowrap w-28">
          {formatRelativeDate(person.last_activity)}
        </td>
        <td className="px-north-sm py-north-sm text-metadata text-foreground-muted max-w-75 hidden md:table-cell">
          <span className="line-clamp-1">{summarizeSnippet(person.compiled_summary) || '—'}</span>
        </td>
        <td className="pr-north-sm py-north-sm w-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(person.id);
            }}
            disabled={isPending}
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 touch-reveal text-foreground-muted hover:text-destructive h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </td>
      </tr>
    );
  }

  function renderMobileCard(person: PersonListRow, index: number) {
    const isSelected = selectedIds.has(person.id);
    return (
      <div
        key={`${person.id}-${index}`}
        className={`group rounded-lg border bg-surface border-l-[3px] border-l-[--entity-people] px-north-md py-north-sm cursor-pointer hover:bg-surface-subtle transition-colors animate-slide-in-up ${isSelected ? 'border-primary' : 'border-border'}`}
        style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
        onClick={() => router.push(`/people/${person.id}`)}
      >
        <div className="flex items-start justify-between gap-north-sm">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-north-xs">
              <p className="text-body font-medium truncate">{person.name}</p>
              {person.pinned && <Star className="h-3 w-3 fill-primary text-primary shrink-0" />}
            </div>
            {(person.role || person.organization) && (
              <p className="text-metadata text-foreground-muted truncate">
                {[person.role, person.organization].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePinned(person.id, person.pinned);
            }}
            disabled={isPending}
            aria-label={person.pinned ? `Unpin ${person.name}` : `Pin ${person.name}`}
            className="text-foreground-muted hover:text-primary h-7 w-7 p-0 shrink-0"
          >
            <Star className={`h-3 w-3 ${person.pinned ? 'fill-primary text-primary' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(person.id);
            }}
            disabled={isPending}
            className="text-foreground-muted hover:text-destructive h-7 w-7 p-0 shrink-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-x-north-md gap-y-0.5 mt-north-xs">
          {person.note_count > 0 && (
            <span className="text-metadata text-foreground-muted">{person.note_count} notes</span>
          )}
          {person.open_task_count > 0 && (
            <span className="text-metadata text-(--entity-tasks)">
              {person.open_task_count} tasks
            </span>
          )}
          {person.open_question_count > 0 && (
            <span className="text-metadata text-(--entity-questions)">
              {person.open_question_count} questions
            </span>
          )}
          <span className="text-metadata text-foreground-muted ml-auto">
            {formatRelativeDate(person.last_activity)}
          </span>
        </div>
      </div>
    );
  }

  const desktopColCount = 11;

  return (
    <div className="space-y-north-md">
      <div className="flex items-center gap-north-sm">
        <div className="flex-1">
          <SearchBar placeholder="Search people..." onSearch={setSearch} />
        </div>
        <ViewOptionsMenu
          filterConfigs={filterConfigs}
          filterValues={filters}
          onFilterChange={setFilter}
          onFilterClear={clearFilters}
          groupOptions={GROUP_OPTIONS}
          groupValue={groupBy}
          onGroupChange={(v) => setGroupBy(v ?? 'none')}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="gap-1 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New Person
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
      {mergeOpen && selectedPeople.length >= 2 && (
        <div className="hidden sm:block rounded-md border border-border bg-surface p-north-md space-y-north-md animate-fade-in">
          <div>
            <h3 className="text-section-header">Merge {selectedPeople.length} people</h3>
            <p className="text-metadata text-foreground-muted mt-north-xs">
              All notes, tasks, projects, and decisions linked to the source people will be
              re-pointed to the target. The source records will be deleted. This cannot be undone.
            </p>
          </div>
          <div className="space-y-north-xs">
            <label className="text-metadata text-foreground-muted">Keep as target</label>
            <Select value={mergeTargetId ?? ''} onValueChange={(v) => setMergeTargetId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose target person…" />
              </SelectTrigger>
              <SelectContent>
                {selectedPeople.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {[p.role, p.organization].filter(Boolean).join(', ')
                      ? ` — ${[p.role, p.organization].filter(Boolean).join(', ')}`
                      : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {mergeTargetId && (
            <p className="text-metadata text-foreground-muted">
              Will delete:{' '}
              <span className="text-foreground">
                {selectedPeople
                  .filter((p) => p.id !== mergeTargetId)
                  .map((p) => p.name)
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
          <div className="rounded-lg border border-border bg-surface border-l-[3px] border-l-[--entity-people] px-north-md py-north-sm">
            <InlineEditableText
              value=""
              onSave={async (v) => {
                handleCreate(v);
                return {};
              }}
              placeholder="Person name... (Enter to save)"
              className="text-body"
            />
          </div>
        )}
        {pinnedRows.length > 0 && (
          <>
            <div className="font-mono text-label uppercase tracking-wider text-foreground-muted px-north-xs pt-north-sm">
              Pinned
            </div>
            {pinnedRows.map((p, i) => renderMobileCard(p, i))}
          </>
        )}
        {sections.map(({ label, rows }) => (
          <div key={label ?? '__all__'} className="space-y-north-xs">
            {label !== null && (
              <div className="font-mono text-label uppercase tracking-wider text-foreground-muted px-north-xs pt-north-sm">
                {label}
              </div>
            )}
            {rows.map((p, i) => renderMobileCard(p, i))}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="w-8 px-north-sm" />
              <th className="w-8" />
              <th className={thClass}>
                <SortableHeader label="Name" field="name" currentSort={sort} onSort={toggleSort} />
              </th>
              <th className={thClass}>
                <SortableHeader label="Role" field="role" currentSort={sort} onSort={toggleSort} />
              </th>
              <th className={thClass}>
                <SortableHeader
                  label="Organization"
                  field="organization"
                  currentSort={sort}
                  onSort={toggleSort}
                />
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
                  label="Tasks"
                  field="open_task_count"
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
                  colSpan={desktopColCount}
                  className="px-north-md py-north-md border-l-[3px] border-l-[--entity-people]"
                >
                  <InlineEditableText
                    value=""
                    onSave={async (v) => {
                      handleCreate(v);
                      return {};
                    }}
                    placeholder="Person name... (Enter to save)"
                    className="text-body"
                  />
                </td>
              </tr>
            )}

            {pinnedRows.length > 0 && (
              <>
                <tr key="__pinned-label">
                  <td colSpan={desktopColCount} className="p-0">
                    <GroupLabel label="Pinned" />
                  </td>
                </tr>
                {pinnedRows.map((p, i) => renderRow(p, i))}
              </>
            )}

            {sections.flatMap(({ label, rows }) => {
              const sectionRows = rows.map((p, i) => renderRow(p, i));
              if (label === null) return sectionRows;
              return [
                <tr key={`label-${label}`}>
                  <td colSpan={desktopColCount} className="p-0">
                    <GroupLabel label={label} />
                  </td>
                </tr>,
                ...sectionRows,
              ];
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (search.length >= 2 || Object.values(filters).some(Boolean)) && (
        <p className="text-body text-foreground-muted text-center py-north-lg">
          {search.length >= 2 ? (
            <>No people match &ldquo;{search}&rdquo;</>
          ) : (
            <>No people match your filters.</>
          )}
        </p>
      )}
    </div>
  );
}
