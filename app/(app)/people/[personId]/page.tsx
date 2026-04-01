import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { TaskStatusBadge } from '@/components/shared/status-badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, CheckSquare, FolderOpen, Scale } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import type { Person, Note, Task } from '@/types/database';

interface PersonDetailPageProps {
  params: Promise<{ personId: string }>;
}

export default async function PersonDetailPage({ params }: PersonDetailPageProps) {
  const { personId } = await params;
  const supabase = await createClient();

  const { data: person, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', personId)
    .single();

  if (error || !person) notFound();

  const typedPerson = person as Person;

  // Load all related data in parallel
  const [noteJunctions, assignedTasksRes, linkedProjectsRes, linkedDecisionsRes] =
    await Promise.all([
      supabase.from('note_people').select('note_id').eq('person_id', personId),
      supabase
        .from('tasks')
        .select('*, notes(id, title)')
        .eq('actionee_id', personId)
        .order('created_at'),
      supabase
        .from('project_people')
        .select('project_id, projects(id, name, status)')
        .eq('person_id', personId),
      supabase
        .from('decision_people')
        .select('decision_id, decisions(id, decision_text, rationale, decision_date)')
        .eq('person_id', personId),
    ]);

  const assignedTasks = (assignedTasksRes.data ?? []) as (Task & {
    notes: { id: string; title: string } | null;
  })[];

  const linkedProjects = (
    (linkedProjectsRes.data ?? []) as unknown as {
      project_id: string;
      projects: { id: string; name: string; status: string | null };
    }[]
  ).map((lp) => lp.projects);

  const linkedDecisions = (
    (linkedDecisionsRes.data ?? []) as unknown as {
      decision_id: string;
      decisions: {
        id: string;
        decision_text: string;
        rationale: string | null;
        decision_date: string | null;
      };
    }[]
  ).map((ld) => ld.decisions);

  const noteIds = (noteJunctions.data ?? []).map((j) => j.note_id);
  let notes: Note[] = [];
  let relatedTasks: Task[] = [];

  if (noteIds.length > 0) {
    const [notesRes, tasksRes] = await Promise.all([
      supabase
        .from('notes')
        .select('*')
        .in('id', noteIds)
        .order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').in('note_id', noteIds).order('created_at'),
    ]);
    notes = (notesRes.data ?? []) as Note[];
    relatedTasks = (tasksRes.data ?? []) as Task[];
  }

  return (
    <div className="space-y-north-lg">
      <div className="flex items-center gap-north-sm">
        <Link
          href="/people"
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader title={typedPerson.name} />
      </div>

      {typedPerson.role && (
        <p className="text-body text-foreground-secondary">{typedPerson.role}</p>
      )}

      {assignedTasks.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
              <CheckSquare className="h-4 w-4" />
              Assigned Tasks ({assignedTasks.length})
            </h2>
            <div className="space-y-north-xs">
              {assignedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-md border border-border bg-surface px-north-md py-north-sm"
                >
                  <div>
                    <p className="text-body">{task.title}</p>
                    {task.notes && (
                      <Link
                        href={`/notes/${task.notes.id}`}
                        className="text-metadata text-primary hover:underline"
                      >
                        {task.notes.title}
                      </Link>
                    )}
                  </div>
                  <TaskStatusBadge status={task.status} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {linkedProjects.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
              <FolderOpen className="h-4 w-4" />
              Projects ({linkedProjects.length})
            </h2>
            <div className="space-y-north-xs">
              {linkedProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block rounded-md border border-border bg-surface px-north-md py-north-sm hover:bg-surface-subtle transition-colors"
                >
                  <p className="text-body font-medium">{project.name}</p>
                  {project.status && (
                    <p className="text-metadata text-foreground-muted">{project.status}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {linkedDecisions.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
              <Scale className="h-4 w-4" />
              Decisions ({linkedDecisions.length})
            </h2>
            <div className="space-y-north-sm">
              {linkedDecisions.map((d) => (
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
                    <p className="text-metadata text-foreground-muted mt-0.5">
                      {formatDate(d.decision_date)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {notes.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
              <FileText className="h-4 w-4" />
              Linked Notes ({notes.length})
            </h2>
            <div className="space-y-north-xs">
              {notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="block rounded-md border border-border bg-surface px-north-md py-north-sm hover:bg-surface-subtle transition-colors"
                >
                  <p className="text-body font-medium">{note.title}</p>
                  <p className="text-metadata text-foreground-muted">
                    {formatDate(note.created_at)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {relatedTasks.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
              <CheckSquare className="h-4 w-4" />
              Related Tasks ({relatedTasks.length})
            </h2>
            <div className="space-y-north-xs">
              {relatedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-md border border-border bg-surface px-north-md py-north-sm"
                >
                  <p className="text-body">{task.title}</p>
                  <TaskStatusBadge status={task.status} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
