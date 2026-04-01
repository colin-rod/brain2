import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PeopleList } from '@/components/people/people-list';
import { Users } from 'lucide-react';
import type { Person } from '@/types/database';

export default async function PeoplePage() {
  const supabase = await createClient();

  const [peopleRes, projectsRes] = await Promise.all([
    supabase.from('people').select('*, project_people(projects(id, name))').order('name'),
    supabase.from('projects').select('id, name').order('name'),
  ]);

  const people = (peopleRes.data ?? []) as (Person & {
    project_people: { projects: { id: string; name: string } }[];
  })[];

  const allProjects = (projectsRes.data ?? []) as { id: string; name: string }[];

  return (
    <div className="space-y-north-lg">
      <PageHeader title="People" description="People mentioned across your notes." />

      {people.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No people yet"
          description="People appear here after you save notes that mention them."
        />
      ) : (
        <PeopleList people={people} allProjects={allProjects} />
      )}
    </div>
  );
}
