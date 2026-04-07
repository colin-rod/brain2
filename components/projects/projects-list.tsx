'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { InlineEditableText } from '@/components/notes/inline-editable-text';
import { SearchBar } from '@/components/shared/search-bar';
import { FilterBar, type FilterConfig } from '@/components/shared/filter-bar';
import { SortableHeader } from '@/components/shared/sortable-header';
import { useListState, applySorting } from '@/lib/hooks/use-list-state';
import { createProject, updateProject, deleteProject } from '@/lib/actions/entity-mutations';
import { Plus, X } from 'lucide-react';
import type { Project, Person } from '@/types/database';

type ProjectWithPeople = Project & {
  project_people: { people: { id: string; name: string } }[];
};

interface ProjectsListProps {
  projects: ProjectWithPeople[];
  allPeople: Pick<Person, 'id' | 'name'>[];
}

export function ProjectsList({ projects, allPeople }: ProjectsListProps) {
  const router = useRouter();
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
    ],
    [uniqueStatuses, allPeople],
  );

  const { filters, sort, search, setFilter, clearFilters, toggleSort, setSearch, searched } =
    useListState<ProjectWithPeople>({
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

    return applySorting(result, sort);
  }, [searched, filters, sort]);

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
      }
    });
  }

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

      <div className="flex items-center gap-north-md px-north-xs">
        <SortableHeader label="Name" field="name" currentSort={sort} onSort={toggleSort} />
        <SortableHeader label="Status" field="status" currentSort={sort} onSort={toggleSort} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-north-sm">
        {isAdding && (
          <div className="rounded-lg border border-primary/30 bg-surface px-north-base py-north-md">
            <InlineEditableText
              value=""
              onSave={async (v) => {
                handleCreate(v);
                return {};
              }}
              placeholder="Project name... (Enter to save)"
              className="text-issue-title"
            />
          </div>
        )}

        {filtered.map((project) => (
          <div
            key={project.id}
            className="group relative rounded-lg border border-border bg-surface px-north-base py-north-md hover:bg-surface-subtle transition-colors border-l-[3px] border-l-(--entity-projects)"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(project.id)}
              disabled={isPending}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-foreground-muted hover:text-destructive h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>

            <Link href={`/projects/${project.id}`} className="block">
              <InlineEditableText
                value={project.name}
                onSave={async (v) => {
                  const r = await updateProject(project.id, { name: v });
                  if (!r.error) router.refresh();
                  return r;
                }}
                className="text-issue-title"
              />
              <InlineEditableText
                value={project.status || ''}
                onSave={async (v) => {
                  const r = await updateProject(project.id, { status: v || null });
                  if (!r.error) router.refresh();
                  return r;
                }}
                placeholder="Add status..."
                className="text-metadata text-foreground-muted mt-0.5"
              />
            </Link>

            {project.project_people.length > 0 && (
              <div className="flex flex-wrap gap-north-xs mt-north-xs">
                {project.project_people.map((pp) => (
                  <Link
                    key={pp.people.id}
                    href={`/people/${pp.people.id}`}
                    className="text-[11px] text-primary hover:underline"
                  >
                    @{pp.people.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && search.length >= 2 && (
        <p className="text-body text-foreground-muted text-center py-north-lg">
          No projects match &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  );
}
