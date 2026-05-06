'use server';

import { createClient } from '@/lib/supabase/server';
import type { Note, Task } from '@/types/database';

export type OrphanedNote = Pick<Note, 'id' | 'title' | 'summary' | 'created_at'>;

export type UnassignedTask = Pick<Task, 'id' | 'title' | 'priority' | 'due_date' | 'note_id'> & {
  project_name: string | null;
};

/**
 * Get notes with no linked people, projects, or domains.
 */
export async function getOrphanedNotes(): Promise<OrphanedNote[]> {
  const supabase = await createClient();

  // Use left joins to find notes with zero connections
  const { data } = await supabase.rpc('get_orphaned_notes');

  return (data ?? []) as OrphanedNote[];
}

/**
 * Get tasks that have no actionee assigned.
 */
export async function getUnassignedTasks(): Promise<UnassignedTask[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('tasks')
    .select('id, title, priority, due_date, note_id, projects:project_id(name)')
    .is('actionee_id', null)
    .neq('status', 'done')
    .neq('status', 'canceled')
    .order('created_at', { ascending: false });

  return (data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    due_date: t.due_date,
    note_id: t.note_id,
    project_name: (t.projects as unknown as { name: string } | null)?.name ?? null,
  }));
}
