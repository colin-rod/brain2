'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchBar } from '@/components/shared/search-bar';
import { FilterBar, type FilterConfig } from '@/components/shared/filter-bar';
import { useListState, applySorting } from '@/lib/hooks/use-list-state';
import { useSearchRefresh } from '@/components/search/search-provider';
import { createIdea, deleteIdea, updateIdeaStatus } from '@/lib/actions/entity-mutations';
import { Plus, X } from 'lucide-react';
import type { Idea, IdeaStatus } from '@/types/database';

type IdeaWithNote = Idea & {
  notes: { id: string; title: string } | null;
};

interface IdeasListProps {
  ideas: IdeaWithNote[];
}

const STATUS_LABELS: Record<IdeaStatus, string> = {
  raw: 'Raw',
  developing: 'Developing',
  accepted: 'Accepted',
  rejected: 'Rejected',
  archived: 'Archived',
};

const STATUS_COLORS: Record<IdeaStatus, string> = {
  raw: 'text-foreground-muted',
  developing: 'text-status-processing',
  accepted: 'text-status-saved',
  rejected: 'text-destructive',
  archived: 'text-foreground-muted opacity-50',
};

export function IdeasList({ ideas }: IdeasListProps) {
  const router = useRouter();
  const refreshSearch = useSearchRefresh();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState('');

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: (Object.keys(STATUS_LABELS) as IdeaStatus[]).map((s) => ({
          value: s,
          label: STATUS_LABELS[s],
        })),
      },
    ],
    [],
  );

  const { filters, sort, search, setFilter, clearFilters, setSearch, searched } =
    useListState<IdeaWithNote>({
      items: ideas,
      searchKeys: ['idea_text'],
    });

  const filtered = useMemo(() => {
    let result = searched;
    if (filters.status) {
      result = result.filter((i) => i.status === filters.status);
    }
    return applySorting(result, sort);
  }, [searched, filters, sort]);

  function handleStatusChange(ideaId: string, status: IdeaStatus) {
    startTransition(async () => {
      const result = await updateIdeaStatus(ideaId, status);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete(ideaId: string) {
    startTransition(async () => {
      const result = await deleteIdea(ideaId);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
        refreshSearch();
      }
    });
  }

  function handleCreate() {
    if (!newIdeaText.trim()) {
      setIsAdding(false);
      setNewIdeaText('');
      return;
    }
    startTransition(async () => {
      const result = await createIdea({ idea_text: newIdeaText });
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
        refreshSearch();
      }
      setIsAdding(false);
      setNewIdeaText('');
    });
  }

  return (
    <div className="space-y-north-md">
      <div className="flex items-center justify-between">
        <SearchBar placeholder="Search ideas..." onSearch={setSearch} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="gap-1 ml-north-md shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          New Idea
        </Button>
      </div>

      <FilterBar
        filters={filterConfigs}
        values={filters}
        onChange={setFilter}
        onClear={clearFilters}
      />

      <div className="space-y-north-sm">
        {isAdding && (
          <div className="rounded-lg border border-primary/30 bg-surface px-north-base py-north-md animate-scale-in space-y-north-xs">
            <Textarea
              autoFocus
              value={newIdeaText}
              onChange={(e) => setNewIdeaText(e.target.value)}
              placeholder="Describe the idea or possibility..."
              rows={2}
              maxLength={2000}
              className="resize-none text-body"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCreate();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewIdeaText('');
                }
              }}
            />
            <div className="flex gap-north-xs">
              <Button size="sm" onClick={handleCreate} disabled={isPending}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAdding(false);
                  setNewIdeaText('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {filtered.map((idea, index) => (
          <div
            key={idea.id}
            className="group rounded-lg border border-border bg-surface px-north-base py-north-md border-l-[3px] border-l-(--entity-ideas) animate-fade-in"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="flex items-start justify-between gap-north-sm">
              <p className="flex-1 text-body whitespace-pre-wrap break-words">{idea.idea_text}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(idea.id)}
                disabled={isPending}
                className="opacity-0 group-hover:opacity-100 shrink-0 text-foreground-muted hover:text-destructive h-7 w-7 p-0"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-north-sm mt-north-xs">
              <Select
                value={idea.status}
                onValueChange={(v) => handleStatusChange(idea.id, v as IdeaStatus)}
              >
                <SelectTrigger className="h-7 text-label w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as IdeaStatus[]).map((s) => (
                    <SelectItem key={s} value={s} className={STATUS_COLORS[s]}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {idea.notes && (
                <Link
                  href={`/notes/${idea.notes.id}`}
                  className="text-metadata text-primary hover:underline truncate max-w-[200px] inline-block"
                >
                  {idea.notes.title}
                </Link>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (search.length >= 2 || Object.values(filters).some(Boolean)) && (
          <p className="text-body text-foreground-muted text-center py-north-lg">
            {search.length >= 2 ? (
              <>No ideas match &ldquo;{search}&rdquo;</>
            ) : (
              <>No ideas match your filters.</>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
