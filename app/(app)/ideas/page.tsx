import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { IdeasList } from '@/components/ideas/ideas-list';
import { Lightbulb } from 'lucide-react';
import type { Idea } from '@/types/database';

export default async function IdeasPage() {
  const supabase = await createClient();

  const ideasRes = await supabase
    .from('ideas')
    .select('*, notes(id, title)')
    .order('created_at', { ascending: false });

  const ideas = (ideasRes.data ?? []) as (Idea & {
    notes: { id: string; title: string } | null;
  })[];

  return (
    <div className="space-y-north-lg">
      <PageHeader title="Ideas" icon={Lightbulb} iconColor="var(--entity-ideas)" />

      {ideas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No ideas yet"
          description="Ideas appear here after you save notes that contain them."
          iconColor="var(--entity-ideas)"
          bgColor="var(--entity-ideas-tint)"
          ctaLabel="Capture something"
          ctaHref="/inbox"
        />
      ) : (
        <IdeasList ideas={ideas} />
      )}
    </div>
  );
}
