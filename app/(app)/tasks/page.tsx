import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { TasksList } from '@/components/tasks/tasks-list';
import { CheckSquare } from 'lucide-react';
import type { Task } from '@/types/database';

export default async function TasksPage() {
  const supabase = await createClient();

  const [tasksRes, peopleRes, projectsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select(
        '*, notes(id, title), actionee:people!actionee_id(id, name), project:projects!project_id(id, name)',
      )
      .order('created_at', { ascending: false }),
    supabase.from('people').select('id, name').order('name'),
    supabase.from('projects').select('id, name').order('name'),
  ]);

  const tasks = (tasksRes.data ?? []) as (Task & {
    notes: { id: string; title: string } | null;
    actionee: { id: string; name: string } | null;
    project: { id: string; name: string } | null;
  })[];

  const allPeople = (peopleRes.data ?? []) as { id: string; name: string }[];
  const allProjects = (projectsRes.data ?? []) as { id: string; name: string }[];

  return (
    <div className="space-y-north-lg">
      <PageHeader
        title="Tasks"
        description="All tasks extracted from your notes."
        icon={CheckSquare}
        iconColor="var(--entity-tasks)"
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Tasks appear here after you save notes with action items."
          iconColor="var(--entity-tasks)"
          bgColor="var(--entity-tasks-tint)"
          ctaLabel="Capture something"
          ctaHref="/inbox"
        />
      ) : (
        <TasksList tasks={tasks} allPeople={allPeople} allProjects={allProjects} />
      )}
    </div>
  );
}
