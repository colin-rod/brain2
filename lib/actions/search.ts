'use server';

import { createClient } from '@/lib/supabase/server';
import type { AllEntities } from '@/lib/search-utils';
import type { Note, Person, Project, Decision, OpenQuestion, Task } from '@/types/database';

export async function fetchAllSearchableEntities(): Promise<AllEntities> {
  const supabase = await createClient();

  const [notesRes, tasksRes, peopleRes, projectsRes, decisionsRes, questionsRes] =
    await Promise.all([
      supabase.from('notes').select('*').order('created_at', { ascending: false }),
      supabase
        .from('tasks')
        .select('*, notes(id, title)')
        .order('created_at', { ascending: false }),
      supabase.from('people').select('*').order('name'),
      supabase.from('projects').select('*').order('name'),
      supabase
        .from('decisions')
        .select('*, notes(id, title)')
        .order('created_at', { ascending: false }),
      supabase.from('open_questions').select('*').order('created_at', { ascending: false }),
    ]);

  return {
    notes: (notesRes.data ?? []) as Note[],
    tasks: (tasksRes.data ?? []) as (Task & {
      notes: { id: string; title: string } | null;
    })[],
    people: (peopleRes.data ?? []) as Person[],
    projects: (projectsRes.data ?? []) as Project[],
    decisions: (decisionsRes.data ?? []) as (Decision & {
      notes: { id: string; title: string } | null;
    })[],
    openQuestions: (questionsRes.data ?? []) as OpenQuestion[],
  };
}
