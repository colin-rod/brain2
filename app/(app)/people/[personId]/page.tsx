import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { TaskStatusBadge } from '@/components/shared/status-badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, CheckSquare } from 'lucide-react';
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

  // Load linked notes via junction table
  const { data: junctions } = await supabase
    .from('note_people')
    .select('note_id')
    .eq('person_id', personId);

  const noteIds = (junctions ?? []).map((j) => j.note_id);
  let notes: Note[] = [];
  let tasks: Task[] = [];

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
    tasks = (tasksRes.data ?? []) as Task[];
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
                    {new Date(note.created_at).toLocaleDateString()}
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
              Related Tasks ({tasks.length})
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
    </div>
  );
}
