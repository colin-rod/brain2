import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { TaskStatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NoteDetailExport } from '@/components/notes/note-detail-export';
import { ArrowLeft, CheckSquare, Users, FolderOpen, Scale, HelpCircle } from 'lucide-react';
import type { Note, Task, Person, Project, Decision, OpenQuestion } from '@/types/database';

interface NoteDetailPageProps {
  params: Promise<{ noteId: string }>;
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { noteId } = await params;
  const supabase = await createClient();

  const { data: note, error } = await supabase.from('notes').select('*').eq('id', noteId).single();

  if (error || !note) notFound();

  const typedNote = note as Note;

  // Load all linked entities in parallel
  const [tasksRes, peopleRes, projectsRes, decisionsRes, questionsRes] = await Promise.all([
    supabase.from('tasks').select('*').eq('note_id', noteId).order('created_at'),
    supabase
      .from('note_people')
      .select('person_id')
      .eq('note_id', noteId)
      .then(async ({ data: junctions }) => {
        if (!junctions || junctions.length === 0) return { data: [] };
        const ids = junctions.map((j) => j.person_id);
        return supabase.from('people').select('*').in('id', ids);
      }),
    supabase
      .from('note_projects')
      .select('project_id')
      .eq('note_id', noteId)
      .then(async ({ data: junctions }) => {
        if (!junctions || junctions.length === 0) return { data: [] };
        const ids = junctions.map((j) => j.project_id);
        return supabase.from('projects').select('*').in('id', ids);
      }),
    supabase.from('decisions').select('*').eq('note_id', noteId).order('created_at'),
    supabase.from('open_questions').select('*').eq('note_id', noteId).order('created_at'),
  ]);

  const tasks = (tasksRes.data ?? []) as Task[];
  const people = (peopleRes.data ?? []) as Person[];
  const projects = (projectsRes.data ?? []) as Project[];
  const decisions = (decisionsRes.data ?? []) as Decision[];
  const questions = (questionsRes.data ?? []) as OpenQuestion[];

  return (
    <div className="space-y-north-lg">
      <div className="flex items-center gap-north-sm">
        <Link
          href="/notes"
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader title={typedNote.title}>
          <NoteDetailExport noteId={noteId} hasExport={!!typedNote.markdown_path} />
        </PageHeader>
      </div>

      <p className="text-metadata text-foreground-muted">
        {new Date(typedNote.created_at).toLocaleDateString()}
      </p>

      {typedNote.summary && (
        <div>
          <h2 className="text-section-header mb-north-xs">Summary</h2>
          <p className="text-body text-foreground-secondary">{typedNote.summary}</p>
        </div>
      )}

      {typedNote.cleaned_text && (
        <div>
          <h2 className="text-section-header mb-north-xs">Notes</h2>
          <p className="text-body text-foreground-secondary whitespace-pre-wrap">
            {typedNote.cleaned_text}
          </p>
        </div>
      )}

      {tasks.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
              <CheckSquare className="h-4 w-4" />
              Tasks ({tasks.length})
            </h2>
            <div className="space-y-north-xs">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-md border border-border bg-surface px-north-md py-north-sm"
                >
                  <div>
                    <p className="text-body">{task.title}</p>
                    <div className="flex items-center gap-north-sm mt-0.5">
                      {task.priority && (
                        <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                          {task.priority}
                        </Badge>
                      )}
                      {task.due_date && (
                        <span className="text-metadata text-foreground-muted">
                          Due: {task.due_date}
                        </span>
                      )}
                    </div>
                  </div>
                  <TaskStatusBadge status={task.status} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {people.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
              <Users className="h-4 w-4" />
              People ({people.length})
            </h2>
            <div className="flex flex-wrap gap-north-sm">
              {people.map((person) => (
                <Link
                  key={person.id}
                  href={`/people/${person.id}`}
                  className="rounded-md border border-border bg-surface px-north-md py-north-sm hover:bg-surface-subtle transition-colors"
                >
                  <p className="text-body font-medium">{person.name}</p>
                  {person.role && (
                    <p className="text-metadata text-foreground-muted">{person.role}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {projects.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
              <FolderOpen className="h-4 w-4" />
              Projects ({projects.length})
            </h2>
            <div className="flex flex-wrap gap-north-sm">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="rounded-md border border-border bg-surface px-north-md py-north-sm hover:bg-surface-subtle transition-colors"
                >
                  <p className="text-body font-medium">{project.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {decisions.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
              <Scale className="h-4 w-4" />
              Decisions ({decisions.length})
            </h2>
            <div className="space-y-north-sm">
              {decisions.map((d) => (
                <div
                  key={d.id}
                  className="rounded-md border border-border bg-surface px-north-md py-north-sm"
                >
                  <p className="text-body">{d.decision_text}</p>
                  {d.rationale && (
                    <p className="text-metadata text-foreground-secondary mt-0.5">
                      Rationale: {d.rationale}
                    </p>
                  )}
                  {d.decision_date && (
                    <p className="text-metadata text-foreground-muted mt-0.5">{d.decision_date}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {questions.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
              <HelpCircle className="h-4 w-4" />
              Open Questions ({questions.length})
            </h2>
            <ul className="space-y-north-xs">
              {questions.map((q) => (
                <li
                  key={q.id}
                  className="rounded-md border border-border bg-surface px-north-md py-north-sm text-body"
                >
                  {q.question_text}
                  <Badge variant="outline" className="ml-2 text-[11px] px-1.5 py-0">
                    {q.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
