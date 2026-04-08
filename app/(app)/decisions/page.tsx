import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { DecisionsList } from '@/components/decisions/decisions-list';
import { Scale } from 'lucide-react';
import type { Decision } from '@/types/database';

export default async function DecisionsPage() {
  const supabase = await createClient();

  const [decisionsRes, projectsRes, peopleRes] = await Promise.all([
    supabase
      .from('decisions')
      .select(
        '*, notes(id, title), project:projects!project_id(id, name), decision_people(people(id, name))',
      )
      .order('created_at', { ascending: false }),
    supabase.from('projects').select('id, name').order('name'),
    supabase.from('people').select('id, name').order('name'),
  ]);

  const decisions = (decisionsRes.data ?? []) as (Decision & {
    notes: { id: string; title: string } | null;
    project: { id: string; name: string } | null;
    decision_people: { people: { id: string; name: string } }[];
  })[];

  const allProjects = (projectsRes.data ?? []) as { id: string; name: string }[];
  const allPeople = (peopleRes.data ?? []) as { id: string; name: string }[];

  return (
    <div className="space-y-north-lg">
      <PageHeader
        title="Decisions"
        description="All decisions extracted from your notes."
        icon={Scale}
        iconColor="var(--entity-decisions)"
      />

      {decisions.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No decisions yet"
          description="Decisions appear here after you save notes that contain them."
          iconColor="var(--entity-decisions)"
          bgColor="var(--entity-decisions-tint)"
          ctaLabel="Capture something"
          ctaHref="/inbox"
        />
      ) : (
        <DecisionsList decisions={decisions} allProjects={allProjects} allPeople={allPeople} />
      )}
    </div>
  );
}
