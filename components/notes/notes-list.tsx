'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { Menu } from '@base-ui/react/menu';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { SearchBar } from '@/components/shared/search-bar';
import { type FilterConfig } from '@/components/shared/filter-bar';
import { ViewOptionsMenu } from '@/components/shared/view-options-menu';
import { GroupLabel } from '@/components/shared/group-label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format-date';
import { useListState } from '@/lib/hooks/use-list-state';
import { archiveNote, deleteNote } from '@/lib/actions/note-mutations';
import { TaskStatusBadge } from '@/components/shared/status-badge';
import type { NoteWithMeta } from '@/types/database';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title-az', label: 'Title A–Z' },
];

const GROUP_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: 'No grouping' },
  { value: 'project', label: 'Project' },
  { value: 'person', label: 'Person' },
  { value: 'domain', label: 'Domain' },
  { value: 'date', label: 'Date' },
];

type NoteSort = 'newest' | 'oldest' | 'title-az';

interface NotesListProps {
  notes: NoteWithMeta[];
  allProjects: { id: string; name: string }[];
  allPeople: { id: string; name: string }[];
  allDomains: { id: string; name: string }[];
  showArchived: boolean;
}

export function NotesList({
  notes,
  allProjects,
  allPeople,
  allDomains,
  showArchived,
}: NotesListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localNotes, setLocalNotes] = useState(notes);
  const [noteSort, setNoteSort] = useState<NoteSort>('newest');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<'none' | 'project' | 'person' | 'domain' | 'date'>('none');
  const [dateGroupMode, setDateGroupMode] = useState<'month' | 'week'>('month');

  // Keep localNotes in sync when server data changes (e.g. after router.refresh)
  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  const { filters, search, setFilter, clearFilters, setSearch, searched } =
    useListState<NoteWithMeta>({
      items: localNotes,
      searchKeys: ['title', 'summary'],
    });

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'project',
        label: 'Project',
        type: 'select',
        options: allProjects.map((p) => ({ value: p.id, label: p.name })),
      },
      {
        key: 'person',
        label: 'Person',
        type: 'select',
        options: allPeople.map((p) => ({ value: p.id, label: p.name })),
      },
      {
        key: 'domain',
        label: 'Domain',
        type: 'select',
        options: allDomains.map((d) => ({ value: d.id, label: d.name })),
      },
      {
        key: 'date',
        label: 'Date',
        type: 'date-range',
      },
    ],
    [allProjects, allPeople, allDomains],
  );

  const sorted = useMemo(() => {
    let result = searched;

    if (filters.project)
      result = result.filter((n) => n.projects.some((p) => p.id === filters.project));
    if (filters.person)
      result = result.filter((n) => n.people.some((p) => p.id === filters.person));
    if (filters.domain)
      result = result.filter((n) => n.domains.some((d) => d.id === filters.domain));
    if (filters.date_from) result = result.filter((n) => n.created_at >= filters.date_from);
    if (filters.date_to)
      result = result.filter((n) => n.created_at <= filters.date_to + 'T23:59:59Z');

    if (noteSort === 'oldest')
      return [...result].sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (noteSort === 'title-az') return [...result].sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [searched, filters, noteSort]);

  const groupedNotes = useMemo(() => {
    if (groupBy === 'none') return [{ label: null, notes: sorted }];

    const groups = new Map<string, NoteWithMeta[]>();
    for (const note of sorted) {
      let key: string;
      if (groupBy === 'project') {
        key = note.projects[0]?.name ?? 'No Project';
      } else if (groupBy === 'person') {
        key = note.people[0]?.name ?? 'No Person';
      } else if (groupBy === 'domain') {
        key = note.domains[0]?.name ?? 'No Domain';
      } else {
        const d = new Date(note.created_at);
        if (dateGroupMode === 'month') {
          key = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else {
          const day = d.getDay();
          const monday = new Date(d);
          monday.setDate(d.getDate() - ((day + 6) % 7));
          key = `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        }
      }
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(note);
    }
    return Array.from(groups.entries()).map(([label, notes]) => ({ label, notes }));
  }, [sorted, groupBy, dateGroupMode]);

  function handleArchive(noteId: string) {
    setLocalNotes((prev) => prev.filter((n) => n.id !== noteId));
    startTransition(async () => {
      const res = await archiveNote(noteId, !showArchived);
      if (res.error) {
        router.refresh();
      }
    });
  }

  function handleDelete(noteId: string) {
    setLocalNotes((prev) => prev.filter((n) => n.id !== noteId));
    setPendingDeleteId(null);
    startTransition(async () => {
      const res = await deleteNote(noteId);
      if (res.error) {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-north-md">
      {/* Archived toggle */}
      <div className="flex items-center justify-between">
        <Link
          href={showArchived ? '/notes' : '/notes?archived=true'}
          className="text-metadata text-foreground-muted hover:text-foreground transition-colors"
        >
          {showArchived ? '← Active notes' : 'View archived'}
        </Link>
      </div>

      {/* Search + View Options */}
      <div className="flex items-center gap-north-sm">
        <div className="flex-1">
          <SearchBar placeholder="Search notes..." onSearch={setSearch} />
        </div>
        <ViewOptionsMenu
          sortOptions={SORT_OPTIONS}
          sortValue={noteSort}
          onSortChange={(v) => setNoteSort(v as NoteSort)}
          filterConfigs={filterConfigs}
          filterValues={filters}
          onFilterChange={setFilter}
          onFilterClear={clearFilters}
          groupOptions={GROUP_OPTIONS}
          groupValue={groupBy}
          onGroupChange={(v) => setGroupBy(v as typeof groupBy)}
          extra={
            groupBy === 'date' ? (
              <div className="flex items-center rounded-md border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDateGroupMode('month')}
                  className={cn(
                    'px-2 h-7 text-metadata transition-colors',
                    dateGroupMode === 'month'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground-muted hover:text-foreground',
                  )}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setDateGroupMode('week')}
                  className={cn(
                    'px-2 h-7 text-metadata transition-colors',
                    dateGroupMode === 'week'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground-muted hover:text-foreground',
                  )}
                >
                  Week
                </button>
              </div>
            ) : undefined
          }
        />
      </div>

      {/* List */}
      <div className="divide-y divide-border border-t border-border">
        {groupedNotes.map(({ label, notes: groupNotes }) => (
          <div key={label ?? '__all__'}>
            {label !== null && <GroupLabel label={label} />}
            {groupNotes.map((note, index) => (
              <div
                key={note.id}
                className="group relative flex items-start gap-north-md px-north-sm py-north-sm border-l-[3px] border-l-(--entity-notes) animate-fade-in hover:bg-surface-subtle transition-colors duration-150"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Left: clickable content */}
                <div className="flex-1 min-w-0">
                  <Link href={`/notes/${note.id}`} className="block">
                    <p className="text-issue-title text-foreground">{note.title}</p>
                    {note.summary && (
                      <p className="text-body text-foreground-secondary mt-north-xs line-clamp-3">
                        {note.summary}
                      </p>
                    )}
                  </Link>
                  {/* Chips */}
                  {(note.projects.length > 0 ||
                    note.people.length > 0 ||
                    note.domains.length > 0 ||
                    note.tasks.length > 0 ||
                    note.decisions.length > 0 ||
                    note.questions.length > 0) && (
                    <div className="flex flex-wrap gap-north-xs mt-north-xs">
                      {note.projects.map((p) => (
                        <Link
                          key={p.id}
                          href={`/projects/${p.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge
                            variant="outline"
                            className="text-label cursor-pointer hover:bg-accent"
                          >
                            {p.name}
                          </Badge>
                        </Link>
                      ))}
                      {note.people.map((p) => (
                        <Link
                          key={p.id}
                          href={`/people/${p.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge
                            variant="outline"
                            className="text-label cursor-pointer hover:bg-accent"
                          >
                            {p.name}
                          </Badge>
                        </Link>
                      ))}
                      {note.domains.map((d) => (
                        <Link key={d.id} href="/domains" onClick={(e) => e.stopPropagation()}>
                          <Badge
                            variant="outline"
                            className="text-label cursor-pointer bg-primary/10 border-primary/20 hover:bg-primary/20"
                          >
                            {d.name}
                          </Badge>
                        </Link>
                      ))}
                      {note.tasks.length > 0 && (
                        <div className="relative group/tasks">
                          <Badge variant="secondary" className="text-label cursor-default">
                            {note.tasks.length} task{note.tasks.length !== 1 ? 's' : ''}
                          </Badge>
                          <div className="absolute bottom-full left-0 mb-1.5 z-50 hidden group-hover/tasks:block min-w-48 max-w-72 rounded-lg border border-border bg-popover shadow-md p-north-xs">
                            <ul className="space-y-north-xs">
                              {note.tasks.map((t) => (
                                <li key={t.id} className="flex items-center gap-north-xs">
                                  <TaskStatusBadge status={t.status} />
                                  <span className="text-label text-foreground truncate">
                                    {t.title}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      {note.decisions.length > 0 && (
                        <div className="relative group/decisions">
                          <Badge variant="secondary" className="text-label cursor-default">
                            {note.decisions.length} decision{note.decisions.length !== 1 ? 's' : ''}
                          </Badge>
                          <div className="absolute bottom-full left-0 mb-1.5 z-50 hidden group-hover/decisions:block min-w-48 max-w-72 rounded-lg border border-border bg-popover shadow-md p-north-xs">
                            <ul className="space-y-north-xs">
                              {note.decisions.map((d) => (
                                <li key={d.id} className="text-label text-foreground line-clamp-2">
                                  {d.decision_text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      {note.questions.length > 0 && (
                        <div className="relative group/questions">
                          <Badge variant="secondary" className="text-label cursor-default">
                            {note.questions.length} question{note.questions.length !== 1 ? 's' : ''}
                          </Badge>
                          <div className="absolute bottom-full left-0 mb-1.5 z-50 hidden group-hover/questions:block min-w-48 max-w-72 rounded-lg border border-border bg-popover shadow-md p-north-xs">
                            <ul className="space-y-north-xs">
                              {note.questions.map((q) => (
                                <li key={q.id} className="text-label text-foreground line-clamp-2">
                                  {q.question_text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: date + menu */}
                <div className="flex items-center gap-north-xs shrink-0 pt-north-xs">
                  <span className="font-mono text-label tabular-nums text-foreground-muted">
                    {formatDate(note.created_at)}
                  </span>
                  <Menu.Root>
                    <Menu.Trigger
                      render={
                        <button
                          className={cn(
                            'flex items-center justify-center h-6 w-6 rounded-md text-foreground-muted',
                            'opacity-0 group-hover:opacity-100 hover:bg-surface-subtle hover:text-foreground',
                            'transition-opacity duration-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          )}
                          aria-label="Note actions"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      }
                    />
                    <Menu.Portal>
                      <Menu.Positioner sideOffset={4} align="end">
                        <Menu.Popup className="z-50 min-w-32 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
                          <Menu.Item
                            className="flex w-full cursor-default select-none items-center rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            onClick={() => handleArchive(note.id)}
                          >
                            {showArchived ? 'Unarchive' : 'Archive'}
                          </Menu.Item>
                          <Menu.Item
                            className="flex w-full cursor-default select-none items-center rounded-md px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10 focus:bg-destructive/10"
                            onClick={() => setPendingDeleteId(note.id)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.Root>
                </div>
              </div>
            ))}
          </div>
        ))}

        {sorted.length === 0 && (
          <p className="font-mono text-metadata text-foreground-muted uppercase tracking-wider pt-north-md border-t border-border">
            <span className="text-primary">{'// '}</span>
            {search.length >= 2
              ? `NO RESULTS FOR "${search}"`
              : showArchived
                ? 'NO ARCHIVED NOTES'
                : 'NO NOTES'}
          </p>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog.Root
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-40 bg-black/40 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
          <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-90 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-north-lg shadow-lg data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <AlertDialog.Title className="text-issue-title text-foreground">
              Delete note?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-north-xs text-body text-foreground-secondary">
              This note will be permanently removed. This cannot be undone.
            </AlertDialog.Description>
            <div className="mt-north-md flex justify-end gap-north-sm">
              <AlertDialog.Close
                render={
                  <Button variant="outline" size="sm">
                    Cancel
                  </Button>
                }
              />
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                onClick={() => pendingDeleteId && handleDelete(pendingDeleteId)}
              >
                Delete permanently
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
