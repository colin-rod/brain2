'use client';

import { WikiSummary } from '@/components/shared/wiki-summary';
import { EntitySections } from '@/components/shared/entity-sections';
import { EntityTimeline } from '@/components/shared/entity-timeline';
import { Separator } from '@/components/ui/separator';
import type { PersonWikiData } from '@/lib/actions/wiki';

interface PersonWikiClientProps {
  data: PersonWikiData;
}

export function PersonWikiClient({ data }: PersonWikiClientProps) {
  return (
    <>
      <WikiSummary
        summary={data.person.compiled_summary}
        generatedAt={data.person.summary_generated_at}
        entityType="person"
        entityId={data.person.id}
      />

      <EntitySections
        assignedTasks={data.assignedTasks}
        linkedProjects={data.linkedProjects}
        decisions={data.linkedDecisions}
        openQuestions={data.openQuestions}
        linkedDomains={data.linkedDomains}
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
