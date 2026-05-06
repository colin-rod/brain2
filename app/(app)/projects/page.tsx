import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { ProjectsList } from '@/components/projects/projects-list';
import { FolderOpen } from 'lucide-react';
import type { Project, ProjectListRow } from '@/types/database';

export default async function ProjectsPage() {
  const supabase = await createClient();

  const [
    projectsRes,
    openTasksRes,
    noteProjectsRes,
    openQuestionsRes,
    peopleRes,
    domainsRes,
    noteDomainsRes,
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('*, project_people(people(id, name)), note_projects(count)')
      .order('name'),
    supabase.from('tasks').select('project_id').in('status', ['todo', 'in_progress']),
    supabase.from('note_projects').select('project_id, note_id, notes(updated_at)'),
    supabase.from('open_questions').select('note_id').eq('status', 'open'),
    supabase.from('people').select('id, name').order('name'),
    supabase.from('domains').select('id, name').order('name'),
    supabase.from('note_domains').select('note_id, domain_id'),
  ]);

  const rawProjects = (projectsRes.data ?? []) as (Project & {
    project_people: { people: { id: string; name: string } }[];
    note_projects: [{ count: number }];
  })[];

  const openTasks = (openTasksRes.data ?? []) as { project_id: string | null }[];
  const noteProjects = (noteProjectsRes.data ?? []) as unknown as {
    project_id: string;
    note_id: string;
    notes: { updated_at: string } | null;
  }[];
  const openQuestions = (openQuestionsRes.data ?? []) as { note_id: string }[];
  const allPeople = (peopleRes.data ?? []) as { id: string; name: string }[];
  const allDomains = (domainsRes.data ?? []) as { id: string; name: string }[];
  const noteDomains = (noteDomainsRes.data ?? []) as { note_id: string; domain_id: string }[];

  // Open task count by project (direct assignment via project_id)
  const openTasksByProject = new Map<string, number>();
  for (const t of openTasks) {
    if (t.project_id)
      openTasksByProject.set(t.project_id, (openTasksByProject.get(t.project_id) ?? 0) + 1);
  }

  const openQNoteIds = new Set(openQuestions.map((q) => q.note_id));

  const npByProject = new Map<string, typeof noteProjects>();
  for (const np of noteProjects) {
    const arr = npByProject.get(np.project_id) ?? [];
    arr.push(np);
    npByProject.set(np.project_id, arr);
  }

  const projects: ProjectListRow[] = rawProjects.map((p) => {
    const nps = npByProject.get(p.id) ?? [];
    const lastActivity = nps.reduce<string | null>((max, np) => {
      const d = np.notes?.updated_at ?? null;
      return d && (!max || d > max) ? d : max;
    }, null);

    return {
      ...p,
      note_count: p.note_projects[0]?.count ?? 0,
      open_task_count: openTasksByProject.get(p.id) ?? 0,
      open_question_count: nps.filter((np) => openQNoteIds.has(np.note_id)).length,
      last_activity: lastActivity ?? p.updated_at,
    };
  });

  // noteProjects reused for domain filter
  const noteProjectsForFilter = noteProjects.map(({ project_id, note_id }) => ({
    project_id,
    note_id,
  }));

  return (
    <div className="space-y-north-lg">
      <PageHeader title="Projects" icon={FolderOpen} iconColor="var(--entity-projects)" />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects tracked yet."
          description="Mention a project by name in any capture and Brain2 starts tracking it here."
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
          noteProjects={noteProjectsForFilter}
        />
      )}
    </div>
  );
}
