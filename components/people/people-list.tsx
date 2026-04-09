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
import { createPerson, updatePerson, deletePerson } from '@/lib/actions/entity-mutations';
import { Plus, X } from 'lucide-react';
import type { Person, Project } from '@/types/database';

type PersonWithProjects = Person & {
  project_people: { projects: { id: string; name: string } }[];
};

interface PeopleListProps {
  people: PersonWithProjects[];
  allProjects: Pick<Project, 'id' | 'name'>[];
}

export function PeopleList({ people, allProjects }: PeopleListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'project',
        label: 'Project',
        type: 'select',
        options: allProjects.map((p) => ({ value: p.id, label: p.name })),
      },
    ],
    [allProjects],
  );

  const { filters, sort, search, setFilter, clearFilters, toggleSort, setSearch, searched } =
    useListState<PersonWithProjects>({
      items: people,
      searchKeys: ['name', 'role'],
    });

  const filtered = useMemo(() => {
    let result = searched;

    if (filters.project) {
      result = result.filter((p) =>
        p.project_people.some((pp) => pp.projects.id === filters.project),
      );
    }

    return applySorting(result, sort);
  }, [searched, filters, sort]);

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
      }
    });
  }

  return (
    <div className="space-y-north-md">
      <div className="flex items-center justify-between">
        <SearchBar placeholder="Search people..." onSearch={setSearch} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="gap-1 ml-north-md shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New Person
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
        <SortableHeader label="Role" field="role" currentSort={sort} onSort={toggleSort} />
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
              placeholder="Person name... (Enter to save)"
              className="text-issue-title"
            />
          </div>
        )}

        {filtered.map((person, index) => (
          <div
            key={person.id}
            className="group relative rounded-lg border border-border bg-surface px-north-base py-north-md hover:bg-surface-subtle hover:border-border-warm hover:shadow-level-1 transition-all duration-150 border-l-[3px] border-l-(--entity-people) animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(person.id)}
              disabled={isPending}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-foreground-muted hover:text-destructive h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>

            <Link href={`/people/${person.id}`} className="block">
              <InlineEditableText
                value={person.name}
                onSave={async (v) => {
                  const r = await updatePerson(person.id, { name: v });
                  if (!r.error) router.refresh();
                  return r;
                }}
                className="text-issue-title"
              />
              <InlineEditableText
                value={person.role || ''}
                onSave={async (v) => {
                  const r = await updatePerson(person.id, { role: v || null });
                  if (!r.error) router.refresh();
                  return r;
                }}
                placeholder="Add role..."
                className="text-metadata text-foreground-muted mt-0.5"
              />
            </Link>

            {person.project_people.length > 0 && (
              <div className="flex flex-wrap gap-north-xs mt-north-xs">
                {person.project_people.map((pp) => (
                  <Link
                    key={pp.projects.id}
                    href={`/projects/${pp.projects.id}`}
                    className="text-[11px] text-primary hover:underline"
                  >
                    {pp.projects.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && search.length >= 2 && (
        <p className="text-body text-foreground-muted text-center py-north-lg">
          No people match &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  );
}
