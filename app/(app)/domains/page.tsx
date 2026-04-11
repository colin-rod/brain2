import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { DomainsList } from '@/components/domains/domains-list';
import { Layers } from 'lucide-react';
import type { Domain } from '@/types/database';

export default async function DomainsPage() {
  const supabase = await createClient();

  const { data: domainsRaw } = await supabase
    .from('domains')
    .select('*, note_domains(note_id)')
    .order('name');

  const domains = (domainsRaw ?? []) as (Domain & {
    note_domains: { note_id: string }[];
  })[];

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
