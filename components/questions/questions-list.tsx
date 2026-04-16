'use client';

import { useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/shared/search-bar';
import { type FilterConfig } from '@/components/shared/filter-bar';
import { ViewOptionsMenu } from '@/components/shared/view-options-menu';
import { QuestionStatusBadge } from '@/components/shared/status-badge';
import { InlineEditableText } from '@/components/notes/inline-editable-text';
import { useListState, applySorting } from '@/lib/hooks/use-list-state';
import { useSearchRefresh } from '@/components/search/search-provider';
import { updateOpenQuestion, deleteOpenQuestion } from '@/lib/actions/note-mutations';
import { X } from 'lucide-react';
import type { OpenQuestion, QuestionStatus } from '@/types/database';

type QuestionWithNote = OpenQuestion & {
  notes: { id: string; title: string } | null;
};

interface QuestionsListProps {
  questions: QuestionWithNote[];
}

const filterConfigs: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'open', label: 'Open' },
      { value: 'resolved', label: 'Resolved' },
    ],
  },
];

export function QuestionsList({ questions }: QuestionsListProps) {
  const router = useRouter();
  const refreshSearch = useSearchRefresh();
  const [isPending, startTransition] = useTransition();

  const { filters, sort, search, setFilter, clearFilters, setSearch, searched } =
    useListState<QuestionWithNote>({
      items: questions,
      searchKeys: ['question_text'],
    });

  const filtered = useMemo(() => {
    let result = searched;
    if (filters.status) {
      result = result.filter((q) => q.status === filters.status);
    }
    return applySorting(result, sort);
  }, [searched, filters, sort]);

  function handleToggleStatus(q: QuestionWithNote) {
    const newStatus: QuestionStatus = q.status === 'open' ? 'resolved' : 'open';
    startTransition(async () => {
      const result = await updateOpenQuestion(q.id, { status: newStatus });
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
        refreshSearch();
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteOpenQuestion(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
        refreshSearch();
      }
    });
  }

  const hasActiveFilters = search.length >= 2 || Object.values(filters).some(Boolean);

  return (
    <div className="space-y-north-md">
      <div className="flex items-center gap-north-sm">
        <div className="flex-1">
          <SearchBar onSearch={setSearch} placeholder="Search questions…" />
        </div>
        <ViewOptionsMenu
          filterConfigs={filterConfigs}
          filterValues={filters}
          onFilterChange={setFilter}
          onFilterClear={clearFilters}
        />
      </div>

      <div className="space-y-north-xs">
        {filtered.map((q) => (
          <div
            key={q.id}
            className="group rounded-lg border border-border bg-surface border-l-[3px] border-l-(--entity-questions) px-north-md py-north-sm flex items-start gap-north-sm animate-fade-in"
          >
            <div className="flex-1 min-w-0 space-y-north-xs">
              <InlineEditableText
                value={q.question_text}
                onSave={async (v) => {
                  const result = await updateOpenQuestion(q.id, { question_text: v });
                  if (!result.error) {
                    router.refresh();
                    refreshSearch();
                  }
                  return result;
                }}
                className="text-body"
              />
              <div className="flex items-center gap-north-sm flex-wrap">
                <QuestionStatusBadge status={q.status} onClick={() => handleToggleStatus(q)} />
                {q.notes && (
                  <Link
                    href={`/notes/${q.notes.id}`}
                    className="text-metadata text-foreground-muted hover:text-foreground transition-colors truncate"
                  >
                    {q.notes.title}
                  </Link>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDelete(q.id)}
              disabled={isPending}
              className="shrink-0 opacity-0 group-hover:opacity-100 touch-reveal text-foreground-muted hover:text-destructive transition-opacity"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        {filtered.length === 0 && hasActiveFilters && (
          <p className="text-body text-foreground-muted text-center py-north-lg">
            {search.length >= 2 ? (
              <>No questions match &ldquo;{search}&rdquo;</>
            ) : (
              <>No questions match your filters.</>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
