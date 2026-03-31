import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { TaskStatusBadge } from '@/components/shared/status-badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, CheckSquare, Scale } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import type { Project, Note, Task, Decision } from '@/types/database';

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error || !project) notFound();

  const typedProject = project as Project;

  // Load linked notes via junction table
  const { data: junctions } = await supabase
    .from('note_projects')
    .select('note_id')
    .eq('project_id', projectId);

  const noteIds = (junctions ?? []).map((j) => j.note_id);
  let notes: Note[] = [];
  let tasks: Task[] = [];
  let decisions: Decision[] = [];

  if (noteIds.length > 0) {
    const [notesRes, tasksRes, decisionsRes] = await Promise.all([
      supabase
        .from('notes')
        .select('*')
        .in('id', noteIds)
        .order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').in('note_id', noteIds).order('created_at'),
      supabase.from('decisions').select('*').in('note_id', noteIds).order('created_at'),
    ]);
    notes = (notesRes.data ?? []) as Note[];
    tasks = (tasksRes.data ?? []) as Task[];
    decisions = (decisionsRes.data ?? []) as Decision[];
  }

  return (
    <div className="space-y-north-lg">
      <div className="flex items-center gap-north-sm">
        <Link
          href="/projects"
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader title={typedProject.name} />
      </div>

      {typedProject.status && (
        <p className="text-body text-foreground-secondary">Status: {typedProject.status}</p>
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
                  <p className="text-body">{task.title}</p>
                  <TaskStatusBadge status={task.status} />
                </div>
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
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
