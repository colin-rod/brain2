import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { DecisionsList } from '@/components/decisions/decisions-list';
import { Scale } from 'lucide-react';
import type { Decision } from '@/types/database';

export default async function DecisionsPage() {
  const supabase = await createClient();

  const [decisionsRes, projectsRes, peopleRes, domainsRes, noteDomainsRes] = await Promise.all([
    supabase
      .from('decisions')
      .select(
        '*, notes(id, title), project:projects!project_id(id, name), decision_people(people(id, name))',
      )
      .order('created_at', { ascending: false }),
    supabase.from('projects').select('id, name').order('name'),
    supabase.from('people').select('id, name').order('name'),
    supabase.from('domains').select('id, name').order('name'),
    supabase.from('note_domains').select('note_id, domain_id'),
  ]);

  const decisions = (decisionsRes.data ?? []) as (Decision & {
    notes: { id: string; title: string } | null;
    project: { id: string; name: string } | null;
    decision_people: { people: { id: string; name: string } }[];
  })[];

  const allProjects = (projectsRes.data ?? []) as { id: string; name: string }[];
  const allPeople = (peopleRes.data ?? []) as { id: string; name: string }[];
  const allDomains = (domainsRes.data ?? []) as { id: string; name: string }[];
  const noteDomains = (noteDomainsRes.data ?? []) as { note_id: string; domain_id: string }[];

  return (
    <div className="space-y-north-lg">
      <PageHeader title="Decisions" icon={Scale} iconColor="var(--entity-decisions)" />

      {decisions.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No decisions recorded yet."
          description="Capture any meeting or discussion and Brain2 identifies the decisions made."
          iconColor="var(--entity-decisions)"
          bgColor="var(--entity-decisions-tint)"
          ctaLabel="Capture something"
          ctaHref="/inbox"
        />
      ) : (
        <DecisionsList
          decisions={decisions}
          allProjects={allProjects}
          allPeople={allPeople}
          allDomains={allDomains}
          noteDomains={noteDomains}
        />
      )}
    </div>
  );
}
