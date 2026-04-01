import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { TaskStatusBadge } from '@/components/shared/status-badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, CheckSquare, Scale, Users } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import { ProjectPeopleSection } from '@/components/projects/project-people-section';
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

  // Fetch note-linked + direct-linked tasks/decisions in parallel
  const [
    notesRes,
    noteTasksRes,
    noteDecisionsRes,
    directTasksRes,
    directDecisionsRes,
    linkedPeopleRes,
    allPeopleRes,
  ] = await Promise.all([
    noteIds.length > 0
      ? supabase
          .from('notes')
          .select('*')
          .in('id', noteIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    noteIds.length > 0
      ? supabase.from('tasks').select('*').in('note_id', noteIds).order('created_at')
      : Promise.resolve({ data: [] }),
    noteIds.length > 0
      ? supabase.from('decisions').select('*').in('note_id', noteIds).order('created_at')
      : Promise.resolve({ data: [] }),
    supabase
      .from('tasks')
      .select('*, actionee:people!actionee_id(id, name)')
      .eq('project_id', projectId)
      .order('created_at'),
    supabase.from('decisions').select('*').eq('project_id', projectId).order('created_at'),
    supabase
      .from('project_people')
      .select('person_id, people(id, name, role)')
      .eq('project_id', projectId),
    supabase.from('people').select('id, name').order('name'),
  ]);

  const notes = (notesRes.data ?? []) as Note[];

  // Merge note-linked and direct-linked tasks, deduplicate by id
  const allTasks = [
    ...((noteTasksRes.data ?? []) as Task[]),
    ...((directTasksRes.data ?? []) as Task[]),
  ];
  const taskMap = new Map<string, Task>();
  for (const t of allTasks) taskMap.set(t.id, t);
  const tasks = Array.from(taskMap.values());

  // Merge decisions similarly
  const allDecisions = [
    ...((noteDecisionsRes.data ?? []) as Decision[]),
    ...((directDecisionsRes.data ?? []) as Decision[]),
  ];
  const decisionMap = new Map<string, Decision>();
  for (const d of allDecisions) decisionMap.set(d.id, d);
  const decisions = Array.from(decisionMap.values());

  const linkedPeople = (
    (linkedPeopleRes.data ?? []) as unknown as {
      person_id: string;
      people: { id: string; name: string; role: string | null };
    }[]
  ).map((lp) => lp.people);
  const allPeople = (allPeopleRes.data ?? []) as { id: string; name: string }[];

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

      {/* People section */}
      <Separator />
      <div>
        <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
          <Users className="h-4 w-4" />
          People ({linkedPeople.length})
        </h2>
        <ProjectPeopleSection
          projectId={projectId}
          linkedPeople={linkedPeople}
          allPeople={allPeople}
        />
      </div>

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
