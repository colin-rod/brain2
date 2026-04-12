'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { InlineEditableText } from '@/components/notes/inline-editable-text';
import { SearchBar } from '@/components/shared/search-bar';
import { FilterBar, type FilterConfig } from '@/components/shared/filter-bar';
import { SortableHeader } from '@/components/shared/sortable-header';
import { useListState, applySorting } from '@/lib/hooks/use-list-state';
import { useSearchRefresh } from '@/components/search/search-provider';
import { createProject, updateProject, deleteProject } from '@/lib/actions/entity-mutations';
import { summarizeSnippet, formatRelativeDate } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import type { Person, NoteDomain, ProjectListRow } from '@/types/database';

interface ProjectsListProps {
  projects: ProjectListRow[];
  allPeople: Pick<Person, 'id' | 'name'>[];
  allDomains: { id: string; name: string }[];
  noteDomains: NoteDomain[];
  noteProjects: { note_id: string; project_id: string }[];
}

export function ProjectsList({
  projects,
  allPeople,
  allDomains,
  noteDomains,
  noteProjects,
}: ProjectsListProps) {
  const router = useRouter();
  const refreshSearch = useSearchRefresh();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(projects.map((p) => p.status).filter(Boolean) as string[]);
    return Array.from(statuses)
      .sort()
      .map((s) => ({ value: s, label: s }));
  }, [projects]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      { key: 'status', label: 'Status', type: 'select', options: uniqueStatuses },
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
    ],
    [uniqueStatuses, allPeople, allDomains],
  );

  const { filters, sort, search, setFilter, clearFilters, toggleSort, setSearch, searched } =
    useListState<ProjectListRow>({
      items: projects,
      searchKeys: ['name'],
    });

  const filtered = useMemo(() => {
    let result = searched;

    if (filters.status) {
      result = result.filter((p) => p.status === filters.status);
    }
    if (filters.person) {
      result = result.filter((p) => p.project_people.some((pp) => pp.people.id === filters.person));
    }
    if (filters.domain) {
      const noteIdsForDomain = new Set(
        noteDomains.filter((nd) => nd.domain_id === filters.domain).map((nd) => nd.note_id),
      );
      const projectIdsForDomain = new Set(
        noteProjects.filter((np) => noteIdsForDomain.has(np.note_id)).map((np) => np.project_id),
      );
      result = result.filter((p) => projectIdsForDomain.has(p.id));
    }

    return applySorting(result, sort);
  }, [searched, filters, sort, noteDomains, noteProjects]);

  function handleCreate(name: string) {
    if (!name.trim()) {
      setIsAdding(false);
      return;
    }
    startTransition(async () => {
      const result = await createProject({ name });
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
        refreshSearch();
      }
      setIsAdding(false);
    });
  }

  function handleDelete(projectId: string) {
    startTransition(async () => {
      const result = await deleteProject(projectId);
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
        <SearchBar placeholder="Search projects..." onSearch={setSearch} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="gap-1 ml-north-md shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New Project
        </Button>
      </div>

      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={setFilter}
        onClear={clearFilters}
      />

      {/* Mobile cards */}
      <div className="sm:hidden space-y-north-xs">
        {isAdding && (
          <div className="rounded-lg border border-border bg-surface border-l-[3px] border-l-[--entity-projects] px-north-md py-north-sm">
            <InlineEditableText
              value=""
              onSave={async (v) => {
                handleCreate(v);
                return {};
              }}
              placeholder="Project name... (Enter to save)"
              className="text-body"
            />
          </div>
        )}
        {filtered.map((project, index) => (
          <div
            key={project.id}
            className="group rounded-lg border border-border bg-surface border-l-[3px] border-l-[--entity-projects] px-north-md py-north-sm cursor-pointer hover:bg-surface-subtle transition-colors animate-slide-in-up"
            style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
            onClick={() => router.push(`/projects/${project.id}`)}
          >
            <div className="flex items-start justify-between gap-north-sm">
              <div className="min-w-0 flex-1">
                <p className="text-body font-medium truncate">{project.name}</p>
                {project.status && (
                  <p className="text-metadata text-foreground-muted truncate">{project.status}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(project.id);
                }}
                disabled={isPending}
                className="text-foreground-muted hover:text-destructive h-7 w-7 p-0 shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-north-md gap-y-0.5 mt-north-xs">
              {project.note_count > 0 && (
                <span className="text-metadata text-foreground-muted">
                  {project.note_count} notes
                </span>
              )}
              {project.open_task_count > 0 && (
                <span className="text-metadata text-amber-600">
                  {project.open_task_count} tasks
                </span>
              )}
              {project.open_question_count > 0 && (
                <span className="text-metadata text-blue-600">
                  {project.open_question_count} questions
                </span>
              )}
              <span className="text-metadata text-foreground-muted ml-auto">
                {formatRelativeDate(project.last_activity)}
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
              <th className={thClass}>
                <SortableHeader
                  label="Status"
                  field="status"
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
                  colSpan={8}
                  className="px-north-md py-north-md border-l-[3px] border-l-[--entity-projects]"
                >
                  <InlineEditableText
                    value=""
                    onSave={async (v) => {
                      handleCreate(v);
                      return {};
                    }}
                    placeholder="Project name... (Enter to save)"
                    className="text-body"
                  />
                </td>
              </tr>
            )}

            {filtered.map((project, index) => (
              <tr
                key={project.id}
                className="group border-b border-border last:border-0 hover:bg-surface-subtle transition-colors cursor-pointer animate-slide-in-up"
                style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <td
                  onClick={(e) => e.stopPropagation()}
                  className="border-l-[3px] border-l-[--entity-projects] pl-north-md pr-north-sm py-north-sm min-w-40"
                >
                  <InlineEditableText
                    value={project.name}
                    onSave={async (v) => {
                      const r = await updateProject(project.id, { name: v });
                      if (!r.error) {
                        router.refresh();
                        refreshSearch();
                      }
                      return r;
                    }}
                    className="text-body font-medium"
                  />
                </td>
                <td
                  onClick={(e) => e.stopPropagation()}
                  className="px-north-sm py-north-sm min-w-25"
                >
                  <InlineEditableText
                    value={project.status || ''}
                    onSave={async (v) => {
                      const r = await updateProject(project.id, { status: v || null });
                      if (!r.error) {
                        router.refresh();
                        refreshSearch();
                      }
                      return r;
                    }}
                    placeholder="Add status..."
                    className="text-metadata text-foreground-muted"
                  />
                </td>
                <td className="px-north-sm py-north-sm text-center text-metadata w-16">
                  {project.note_count > 0 ? (
                    project.note_count
                  ) : (
                    <span className="text-foreground-muted">—</span>
                  )}
                </td>
                <td className="px-north-sm py-north-sm text-center text-metadata w-16">
                  {project.open_task_count > 0 ? (
                    <span className="text-amber-600 font-medium">{project.open_task_count}</span>
                  ) : (
                    <span className="text-foreground-muted">—</span>
                  )}
                </td>
                <td className="px-north-sm py-north-sm text-center text-metadata w-24">
                  {project.open_question_count > 0 ? (
                    <span className="text-blue-600 font-medium">{project.open_question_count}</span>
                  ) : (
                    <span className="text-foreground-muted">—</span>
                  )}
                </td>
                <td className="px-north-sm py-north-sm text-metadata text-foreground-muted whitespace-nowrap w-28">
                  {formatRelativeDate(project.last_activity)}
                </td>
                <td className="px-north-sm py-north-sm text-metadata text-foreground-muted max-w-75 hidden md:table-cell">
                  <span className="line-clamp-1">
                    {summarizeSnippet(project.compiled_summary) || '—'}
                  </span>
                </td>
                <td className="pr-north-sm py-north-sm w-8">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                    disabled={isPending}
                    className="opacity-0 group-hover:opacity-100 text-foreground-muted hover:text-destructive h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (search.length >= 2 || Object.values(filters).some(Boolean)) && (
        <p className="text-body text-foreground-muted text-center py-north-lg">
          {search.length >= 2 ? (
            <>No projects match &ldquo;{search}&rdquo;</>
          ) : (
            <>No projects match your filters.</>
          )}
        </p>
      )}
    </div>
  );
}
