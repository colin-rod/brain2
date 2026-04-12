import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PeopleList } from '@/components/people/people-list';
import { Users } from 'lucide-react';
import type { Person, PersonListRow } from '@/types/database';

export default async function PeoplePage() {
  const supabase = await createClient();

  const [
    peopleRes,
    openTasksRes,
    notePeopleRes,
    openQuestionsRes,
    projectsRes,
    domainsRes,
    noteDomainsRes,
  ] = await Promise.all([
    supabase
      .from('people')
      .select('*, project_people(projects(id, name)), note_people(count)')
      .order('name'),
    supabase.from('tasks').select('actionee_id').in('status', ['todo', 'in_progress']),
    supabase.from('note_people').select('person_id, note_id, notes(updated_at)'),
    supabase.from('open_questions').select('note_id').eq('status', 'open'),
    supabase.from('projects').select('id, name').order('name'),
    supabase.from('domains').select('id, name').order('name'),
    supabase.from('note_domains').select('note_id, domain_id'),
  ]);

  const rawPeople = (peopleRes.data ?? []) as (Person & {
    project_people: { projects: { id: string; name: string } }[];
    note_people: [{ count: number }];
  })[];

  const openTasks = (openTasksRes.data ?? []) as { actionee_id: string | null }[];
  const notePeople = (notePeopleRes.data ?? []) as unknown as {
    person_id: string;
    note_id: string;
    notes: { updated_at: string } | null;
  }[];
  const openQuestions = (openQuestionsRes.data ?? []) as { note_id: string }[];
  const allProjects = (projectsRes.data ?? []) as { id: string; name: string }[];
  const allDomains = (domainsRes.data ?? []) as { id: string; name: string }[];
  const noteDomains = (noteDomainsRes.data ?? []) as { note_id: string; domain_id: string }[];

  // Build lookup maps for stat computation
  const openTasksByPerson = new Map<string, number>();
  for (const t of openTasks) {
    if (t.actionee_id)
      openTasksByPerson.set(t.actionee_id, (openTasksByPerson.get(t.actionee_id) ?? 0) + 1);
  }

  const openQNoteIds = new Set(openQuestions.map((q) => q.note_id));

  const npByPerson = new Map<string, typeof notePeople>();
  for (const np of notePeople) {
    const arr = npByPerson.get(np.person_id) ?? [];
    arr.push(np);
    npByPerson.set(np.person_id, arr);
  }

  const people: PersonListRow[] = rawPeople.map((p) => {
    const nps = npByPerson.get(p.id) ?? [];
    const lastActivity = nps.reduce<string | null>((max, np) => {
      const d = np.notes?.updated_at ?? null;
      return d && (!max || d > max) ? d : max;
    }, null);

    return {
      ...p,
      note_count: p.note_people[0]?.count ?? 0,
      open_task_count: openTasksByPerson.get(p.id) ?? 0,
      open_question_count: nps.filter((np) => openQNoteIds.has(np.note_id)).length,
      last_activity: lastActivity ?? p.updated_at,
    };
  });

  // notePeople reused for domain filter (person_id + note_id mapping)
  const notePeopleForFilter = notePeople.map(({ person_id, note_id }) => ({ person_id, note_id }));

  return (
    <div className="space-y-north-lg">
      <PageHeader title="People" icon={Users} iconColor="var(--entity-people)" />

      {people.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No people yet"
          description="People appear here after you save notes that mention them."
          iconColor="var(--entity-people)"
          bgColor="var(--entity-people-tint)"
          ctaLabel="Capture something"
          ctaHref="/inbox"
        />
      ) : (
        <PeopleList
          people={people}
          allProjects={allProjects}
          allDomains={allDomains}
          noteDomains={noteDomains}
          notePeople={notePeopleForFilter}
        />
      )}
    </div>
  );
}
