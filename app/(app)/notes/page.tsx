import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { NotesList } from '@/components/notes/notes-list';
import { FileText } from 'lucide-react';
import type { NoteWithMeta } from '@/types/database';

function groupByNoteId<T extends { note_id: string }>(arr: T[]): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const item of arr) {
    (map[item.note_id] ??= []).push(item);
  }
  return map;
}

function countByNoteId(arr: { note_id: string | null }[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of arr) {
    if (item.note_id) map[item.note_id] = (map[item.note_id] ?? 0) + 1;
  }
  return map;
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { archived } = await searchParams;
  const showArchived = archived === 'true';

  const supabase = await createClient();

  const [
    notesRes,
    noteProjectsRes,
    notePeopleRes,
    noteDomainsRes,
    tasksRes,
    decisionsRes,
    allProjectsRes,
    allPeopleRes,
    allDomainsRes,
  ] = await Promise.all([
    showArchived
      ? supabase
          .from('notes')
          .select('*')
          .not('archived_at', 'is', null)
          .order('created_at', { ascending: false })
      : supabase
          .from('notes')
          .select('*')
          .is('archived_at', null)
          .order('created_at', { ascending: false }),
    supabase.from('note_projects').select('note_id, project_id, projects(id, name)'),
    supabase.from('note_people').select('note_id, person_id, people(id, name)'),
    supabase.from('note_domains').select('note_id, domain_id, domains(id, name)'),
    supabase.from('tasks').select('note_id').not('note_id', 'is', null),
    supabase.from('decisions').select('note_id').not('note_id', 'is', null),
    supabase.from('projects').select('id, name').order('name'),
    supabase.from('people').select('id, name').order('name'),
    supabase.from('domains').select('id, name').order('name'),
  ]);

  type JoinedEntity = { id: string; name: string };

  const noteProjectMap = groupByNoteId(
    (noteProjectsRes.data ?? [])
      .map((r) => ({ note_id: r.note_id, project: r.projects as unknown as JoinedEntity | null }))
      .filter((r): r is { note_id: string; project: JoinedEntity } => r.project !== null),
  );
  const notePeopleMap = groupByNoteId(
    (notePeopleRes.data ?? [])
      .map((r) => ({ note_id: r.note_id, person: r.people as unknown as JoinedEntity | null }))
      .filter((r): r is { note_id: string; person: JoinedEntity } => r.person !== null),
  );
  const noteDomainMap = groupByNoteId(
    (noteDomainsRes.data ?? [])
      .map((r) => ({ note_id: r.note_id, domain: r.domains as unknown as JoinedEntity | null }))
      .filter((r): r is { note_id: string; domain: JoinedEntity } => r.domain !== null),
  );
  const taskCountMap = countByNoteId((tasksRes.data ?? []) as { note_id: string | null }[]);
  const decisionCountMap = countByNoteId((decisionsRes.data ?? []) as { note_id: string | null }[]);

  const notes: NoteWithMeta[] = (notesRes.data ?? []).map((note) => ({
    ...note,
    archived_at: note.archived_at ?? null,
    projects: (noteProjectMap[note.id] ?? []).map((r) => r.project),
    people: (notePeopleMap[note.id] ?? []).map((r) => r.person),
    domains: (noteDomainMap[note.id] ?? []).map((r) => r.domain),
    task_count: taskCountMap[note.id] ?? 0,
    decision_count: decisionCountMap[note.id] ?? 0,
  }));

  const allProjects = (allProjectsRes.data ?? []) as { id: string; name: string }[];
  const allPeople = (allPeopleRes.data ?? []) as { id: string; name: string }[];
  const allDomains = (allDomainsRes.data ?? []) as { id: string; name: string }[];

  return (
    <div className="space-y-north-lg">
      <PageHeader title="Notes" icon={FileText} iconColor="var(--entity-notes)" />

      {notes.length === 0 && !showArchived ? (
        <EmptyState
          icon={FileText}
          title="No notes yet"
          description="Notes appear here after you save a reviewed capture."
          iconColor="var(--entity-notes)"
          bgColor="var(--entity-notes-tint)"
          ctaLabel="Capture something"
          ctaHref="/inbox"
        />
      ) : (
        <NotesList
          notes={notes}
          allProjects={allProjects}
          allPeople={allPeople}
          allDomains={allDomains}
          showArchived={showArchived}
        />
      )}
    </div>
  );
}
