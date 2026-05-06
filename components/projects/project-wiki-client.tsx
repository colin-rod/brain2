'use client';

import { WikiSummary } from '@/components/shared/wiki-summary';
import { EntitySections } from '@/components/shared/entity-sections';
import { EntityTimeline } from '@/components/shared/entity-timeline';
import { ProjectPeopleSection } from '@/components/projects/project-people-section';
import { Separator } from '@/components/ui/separator';
import type { ProjectWikiData } from '@/lib/actions/wiki';

interface ProjectWikiClientProps {
  data: ProjectWikiData;
}

export function ProjectWikiClient({ data }: ProjectWikiClientProps) {
  return (
    <>
      <WikiSummary
        summary={data.project.compiled_summary}
        generatedAt={data.project.summary_generated_at}
        entityType="project"
        entityId={data.project.id}
      />

      <EntitySections
        peopleSection={
          <ProjectPeopleSection
            projectId={data.project.id}
            linkedPeople={data.linkedPeople}
            allPeople={data.allPeople}
          />
        }
        linkedPeople={data.linkedPeople}
        tasks={data.tasks}
        decisions={data.decisions}
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
