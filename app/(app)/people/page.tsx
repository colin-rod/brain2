import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PeopleList } from '@/components/people/people-list';
import { Users } from 'lucide-react';
import type { Person } from '@/types/database';

export default async function PeoplePage() {
  const supabase = await createClient();

  const [peopleRes, projectsRes, domainsRes, noteDomainsRes, notePeopleRes] = await Promise.all([
    supabase.from('people').select('*, project_people(projects(id, name))').order('name'),
    supabase.from('projects').select('id, name').order('name'),
    supabase.from('domains').select('id, name').order('name'),
    supabase.from('note_domains').select('note_id, domain_id'),
    supabase.from('note_people').select('note_id, person_id'),
  ]);

  const people = (peopleRes.data ?? []) as (Person & {
    project_people: { projects: { id: string; name: string } }[];
  })[];

  const allProjects = (projectsRes.data ?? []) as { id: string; name: string }[];
  const allDomains = (domainsRes.data ?? []) as { id: string; name: string }[];
  const noteDomains = (noteDomainsRes.data ?? []) as { note_id: string; domain_id: string }[];
  const notePeople = (notePeopleRes.data ?? []) as { note_id: string; person_id: string }[];

  return (
    <div className="space-y-north-lg">
      <PageHeader
        title="People"
        description="People mentioned across your notes."
        icon={Users}
        iconColor="var(--entity-people)"
      />

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
          notePeople={notePeople}
        />
      )}
    </div>
  );
}
