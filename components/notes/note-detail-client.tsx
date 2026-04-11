'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NoteDetailExport } from './note-detail-export';
import { InlineEditableText } from './inline-editable-text';
import { NoteTasksSection } from './note-tasks-section';
import { NotePeopleSection } from './note-people-section';
import { NoteProjectsSection } from './note-projects-section';
import { NoteDecisionsSection } from './note-decisions-section';
import { NoteQuestionsSection } from './note-questions-section';
import { useSearchRefresh } from '@/components/search/search-provider';
import { updateNote } from '@/lib/actions/note-mutations';
import { formatDate } from '@/lib/format-date';
import type { Note, Task, Person, Project, Decision, OpenQuestion } from '@/types/database';

interface NoteDetailClientProps {
  note: Note;
  tasks: Task[];
  people: Person[];
  projects: Project[];
  decisions: Decision[];
  questions: OpenQuestion[];
  allPeople: Person[];
  allProjects: Project[];
}

export function NoteDetailClient({
  note,
  tasks,
  people,
  projects,
  decisions,
  questions,
  allPeople,
  allProjects,
}: NoteDetailClientProps) {
  const router = useRouter();
  const refreshSearch = useSearchRefresh();

  function refresh() {
    router.refresh();
    refreshSearch();
  }

  return (
    <div className="space-y-north-lg">
      {/* Full-width header */}
      <div className="flex items-center gap-north-sm">
        <Link
          href="/notes"
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <InlineEditableText
            value={note.title}
            onSave={async (v) => updateNote(note.id, { title: v })}
            className="text-page-title font-accent"
            inputClassName="text-page-title font-accent"
          />
        </div>
        <NoteDetailExport noteId={note.id} hasExport={!!note.markdown_path} />
      </div>

      <p className="text-metadata text-foreground-muted">{formatDate(note.created_at)}</p>

      {/* Full-width summary */}
      <div>
        <h2 className="text-section-header mb-north-xs">Summary</h2>
        <InlineEditableText
          value={note.summary || ''}
          onSave={async (v) => updateNote(note.id, { summary: v })}
          className="text-body text-foreground-secondary"
          inputClassName="text-body"
          placeholder="Add a summary..."
          multiline
          rows={3}
        />
      </div>

      {/* Two-panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-x-north-xl gap-y-north-lg items-start">
        {/* Left: Content */}
        <div>
          <h2 className="text-section-header mb-north-xs">Content</h2>
          <InlineEditableText
            value={note.cleaned_text || ''}
            onSave={async (v) => updateNote(note.id, { cleaned_text: v })}
            className="text-body text-foreground-secondary whitespace-pre-wrap wrap-break-word"
            inputClassName="text-body"
            placeholder="Add content..."
            multiline
            rows={8}
          />
        </div>

        {/* Right: Structured data */}
        <div className="space-y-north-lg">
          <NoteTasksSection noteId={note.id} tasks={tasks} onMutate={refresh} />

          <NotePeopleSection
            noteId={note.id}
            people={people}
            allPeople={allPeople}
            onMutate={refresh}
          />

          <NoteProjectsSection
            noteId={note.id}
            projects={projects}
            allProjects={allProjects}
            onMutate={refresh}
          />

          <NoteDecisionsSection noteId={note.id} decisions={decisions} onMutate={refresh} />

          <NoteQuestionsSection noteId={note.id} questions={questions} onMutate={refresh} />
        </div>
      </div>
    </div>
  );
}
