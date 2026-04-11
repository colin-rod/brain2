import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { ProjectsList } from '@/components/projects/projects-list';
import { FolderOpen } from 'lucide-react';
import type { Project } from '@/types/database';

export default async function ProjectsPage() {
  const supabase = await createClient();

  const [projectsRes, peopleRes, domainsRes, noteDomainsRes, noteProjectsRes] = await Promise.all([
    supabase.from('projects').select('*, project_people(people(id, name))').order('name'),
    supabase.from('people').select('id, name').order('name'),
    supabase.from('domains').select('id, name').order('name'),
    supabase.from('note_domains').select('note_id, domain_id'),
    supabase.from('note_projects').select('note_id, project_id'),
  ]);

  const projects = (projectsRes.data ?? []) as (Project & {
    project_people: { people: { id: string; name: string } }[];
  })[];

  const allPeople = (peopleRes.data ?? []) as { id: string; name: string }[];
  const allDomains = (domainsRes.data ?? []) as { id: string; name: string }[];
  const noteDomains = (noteDomainsRes.data ?? []) as { note_id: string; domain_id: string }[];
  const noteProjects = (noteProjectsRes.data ?? []) as { note_id: string; project_id: string }[];

  return (
    <div className="space-y-north-lg">
      <PageHeader title="Projects" icon={FolderOpen} iconColor="var(--entity-projects)" />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Projects appear here after you save notes that reference them."
          iconColor="var(--entity-projects)"
          bgColor="var(--entity-projects-tint)"
          ctaLabel="Capture something"
          ctaHref="/inbox"
        />
      ) : (
        <ProjectsList
          projects={projects}
          allPeople={allPeople}
          allDomains={allDomains}
          noteDomains={noteDomains}
          noteProjects={noteProjects}
        />
      )}
    </div>
  );
}
