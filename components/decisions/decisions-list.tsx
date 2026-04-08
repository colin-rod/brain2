'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InlineEditableText } from '@/components/notes/inline-editable-text';
import { EntityCombobox } from '@/components/notes/entity-combobox';
import { SearchBar } from '@/components/shared/search-bar';
import { FilterBar, type FilterConfig } from '@/components/shared/filter-bar';
import { SortableHeader } from '@/components/shared/sortable-header';
import { useListState, applySorting } from '@/lib/hooks/use-list-state';
import { updateDecision, deleteDecision } from '@/lib/actions/note-mutations';
import {
  createStandaloneDecision,
  linkPersonToDecision,
  unlinkPersonFromDecision,
} from '@/lib/actions/entity-mutations';
import { Plus, X } from 'lucide-react';
import type { Decision, Person, Project } from '@/types/database';

type DecisionWithRelations = Decision & {
  notes: { id: string; title: string } | null;
  project: { id: string; name: string } | null;
  decision_people: { people: { id: string; name: string } }[];
};

interface DecisionsListProps {
  decisions: DecisionWithRelations[];
  allProjects: Pick<Project, 'id' | 'name'>[];
  allPeople: Pick<Person, 'id' | 'name'>[];
}

export function DecisionsList({ decisions, allProjects, allPeople }: DecisionsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [addingPerson, setAddingPerson] = useState<string | null>(null);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'project',
        label: 'Project',
        type: 'select',
        options: allProjects.map((p) => ({ value: p.id, label: p.name })),
      },
      { key: 'decision_date', label: 'Date', type: 'date-range' },
    ],
    [allProjects],
  );

  const { filters, sort, search, setFilter, clearFilters, toggleSort, setSearch, searched } =
    useListState<DecisionWithRelations>({
      items: decisions,
      searchKeys: ['decision_text', 'rationale'],
    });

  const filtered = useMemo(() => {
    let result = searched;

    if (filters.project) {
      result = result.filter((d) => d.project_id === filters.project);
    }
    if (filters.decision_date_from) {
      result = result.filter(
        (d) => d.decision_date && d.decision_date >= filters.decision_date_from,
      );
    }
    if (filters.decision_date_to) {
      result = result.filter((d) => d.decision_date && d.decision_date <= filters.decision_date_to);
    }

    return applySorting(result, sort);
  }, [searched, filters, sort]);

  function handleFieldUpdate(decisionId: string, updates: Record<string, unknown>) {
    startTransition(async () => {
      const result = await updateDecision(
        decisionId,
        updates as Parameters<typeof updateDecision>[1],
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete(decisionId: string) {
    startTransition(async () => {
      const result = await deleteDecision(decisionId);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleCreate(text: string) {
    if (!text.trim()) {
      setIsAdding(false);
      return;
    }
    startTransition(async () => {
      const result = await createStandaloneDecision({ decision_text: text });
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
      setIsAdding(false);
    });
  }

  function handleLinkPerson(decisionId: string, personId: string) {
    startTransition(async () => {
      const result = await linkPersonToDecision(decisionId, personId);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
      setAddingPerson(null);
    });
  }

  function handleUnlinkPerson(decisionId: string, personId: string) {
    startTransition(async () => {
      const result = await unlinkPersonFromDecision(decisionId, personId);
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
        <SearchBar placeholder="Search decisions..." onSearch={setSearch} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="gap-1 ml-north-md shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New Decision
        </Button>
      </div>

      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={setFilter}
        onClear={clearFilters}
      />

      <div className="flex items-center gap-north-lg px-north-xs">
        <SortableHeader
          label="Decision"
          field="decision_text"
          currentSort={sort}
          onSort={toggleSort}
        />
        <SortableHeader label="Date" field="decision_date" currentSort={sort} onSort={toggleSort} />
      </div>

      <div className="space-y-north-sm">
        {isAdding && (
          <div className="rounded-lg border border-primary/30 bg-surface px-north-base py-north-md animate-scale-in">
            <InlineEditableText
              value=""
              onSave={async (v) => {
                handleCreate(v);
                return {};
              }}
              placeholder="Decision text... (Enter to save)"
              className="text-body"
            />
          </div>
        )}

        {filtered.map((d, index) => (
          <div
            key={d.id}
            className="group rounded-lg border border-border bg-surface px-north-base py-north-md border-l-[3px] border-l-(--entity-decisions) animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="flex items-start justify-between gap-north-sm">
              <div className="flex-1 min-w-0">
                <InlineEditableText
                  value={d.decision_text}
                  onSave={async (v) => {
                    const r = await updateDecision(d.id, { decision_text: v });
                    if (!r.error) router.refresh();
                    return r;
                  }}
                  className="text-body"
                />
                <InlineEditableText
                  value={d.rationale || ''}
                  onSave={async (v) => {
                    const r = await updateDecision(d.id, { rationale: v || null });
                    if (!r.error) router.refresh();
                    return r;
                  }}
                  placeholder="Add rationale..."
                  className="text-metadata text-foreground-secondary mt-north-xs"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(d.id)}
                disabled={isPending}
                className="opacity-0 group-hover:opacity-100 shrink-0 text-foreground-muted hover:text-destructive h-7 w-7 p-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-north-sm mt-north-xs">
              {/* Date */}
              <Input
                type="date"
                value={d.decision_date || ''}
                onChange={(e) => handleFieldUpdate(d.id, { decision_date: e.target.value || null })}
                className="h-7 text-[11px] w-32"
              />

              {/* Project */}
              <div className="relative">
                {editingProject === d.id ? (
                  <EntityCombobox
                    items={allProjects}
                    excludeIds={[]}
                    onSelect={(item) => {
                      handleFieldUpdate(d.id, { project_id: item.id });
                      setEditingProject(null);
                    }}
                    onCreate={() => {}}
                    onClose={() => setEditingProject(null)}
                    placeholder="Search projects..."
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingProject(d.id)}
                    className="text-metadata text-foreground-muted hover:text-foreground"
                  >
                    {d.project ? (
                      <span className="text-primary">{d.project.name}</span>
                    ) : (
                      <span className="opacity-40">+ Project</span>
                    )}
                  </button>
                )}
              </div>

              {/* Source note */}
              {d.notes && (
                <Link
                  href={`/notes/${d.notes.id}`}
                  className="text-metadata text-primary hover:underline"
                >
                  {d.notes.title}
                </Link>
              )}
            </div>

            {/* Linked people */}
            <div className="flex flex-wrap items-center gap-north-xs mt-north-xs">
              {d.decision_people.map((dp) => (
                <span
                  key={dp.people.id}
                  className="inline-flex items-center gap-1 text-[11px] text-primary bg-primary-tint rounded px-1.5 py-0.5"
                >
                  <Link href={`/people/${dp.people.id}`} className="hover:underline">
                    @{dp.people.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleUnlinkPerson(d.id, dp.people.id)}
                    className="text-foreground-muted hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {addingPerson === d.id ? (
                <div className="w-40">
                  <EntityCombobox
                    items={allPeople}
                    excludeIds={d.decision_people.map((dp) => dp.people.id)}
                    onSelect={(item) => handleLinkPerson(d.id, item.id)}
                    onCreate={() => {}}
                    onClose={() => setAddingPerson(null)}
                    placeholder="Search people..."
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingPerson(d.id)}
                  className="text-[11px] text-foreground-muted hover:text-foreground opacity-0 group-hover:opacity-100"
                >
                  + Person
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && search.length >= 2 && (
          <p className="text-body text-foreground-muted text-center py-north-lg">
            No decisions match &ldquo;{search}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
