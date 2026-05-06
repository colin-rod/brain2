'use client';

import { WikiSummary } from '@/components/shared/wiki-summary';
import { EntitySections } from '@/components/shared/entity-sections';
import { EntityTimeline } from '@/components/shared/entity-timeline';
import { Separator } from '@/components/ui/separator';
import type { DomainWikiData } from '@/lib/actions/wiki';

interface DomainWikiClientProps {
  data: DomainWikiData;
}

export function DomainWikiClient({ data }: DomainWikiClientProps) {
  return (
    <>
      <WikiSummary
        summary={data.domain.compiled_summary}
        generatedAt={data.domain.summary_generated_at}
        entityType="domain"
        entityId={data.domain.id}
      />

      <EntitySections
        tasks={data.tasks}
        decisions={data.decisions}
        openQuestions={data.openQuestions}
        linkedPeople={data.linkedPeople}
        linkedProjects={data.linkedProjects}
        notes={data.notes}
      />

      {data.timeline.length > 0 && (
        <>
          <Separator />
          <EntityTimeline items={data.timeline} />
        </>
      )}
    </>
  );
}
