import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { DomainsList } from '@/components/domains/domains-list';
import { Layers } from 'lucide-react';
import type { Domain, DomainListRow } from '@/types/database';

export default async function DomainsPage() {
  const supabase = await createClient();

  const [domainsRes, noteDomainsRes, openQuestionsRes] = await Promise.all([
    supabase.from('domains').select('*, note_domains(count)').order('name'),
    supabase.from('note_domains').select('domain_id, note_id, notes(updated_at)'),
    supabase.from('open_questions').select('note_id').eq('status', 'open'),
  ]);

  const rawDomains = (domainsRes.data ?? []) as (Domain & {
    note_domains: [{ count: number }];
  })[];

  const noteDomains = (noteDomainsRes.data ?? []) as unknown as {
    domain_id: string;
    note_id: string;
    notes: { updated_at: string } | null;
  }[];
  const openQuestions = (openQuestionsRes.data ?? []) as { note_id: string }[];

  const openQNoteIds = new Set(openQuestions.map((q) => q.note_id));

  const ndByDomain = new Map<string, typeof noteDomains>();
  for (const nd of noteDomains) {
    const arr = ndByDomain.get(nd.domain_id) ?? [];
    arr.push(nd);
    ndByDomain.set(nd.domain_id, arr);
  }

  const domains: DomainListRow[] = rawDomains.map((d) => {
    const nds = ndByDomain.get(d.id) ?? [];
    const lastActivity = nds.reduce<string | null>((max, nd) => {
      const date = nd.notes?.updated_at ?? null;
      return date && (!max || date > max) ? date : max;
    }, null);

    return {
      ...d,
      note_count: d.note_domains[0]?.count ?? 0,
      open_question_count: nds.filter((nd) => openQNoteIds.has(nd.note_id)).length,
      last_activity: lastActivity ?? d.updated_at,
    };
  });

  return (
    <div className="space-y-north-lg">
      <PageHeader title="Domains" icon={Layers} iconColor="var(--entity-domains)" />

      {domains.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No domains yet"
          description="Domains appear here after you save notes that reference them."
          iconColor="var(--entity-domains)"
          bgColor="var(--entity-domains-tint)"
          ctaLabel="Capture something"
          ctaHref="/inbox"
        />
      ) : (
        <DomainsList domains={domains} />
      )}
    </div>
  );
}
