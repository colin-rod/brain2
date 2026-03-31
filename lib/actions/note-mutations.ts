'use server';

import { createClient } from '@/lib/supabase/server';
import { exportNoteMarkdown } from './export';
import type { TaskPriority, TaskStatus, QuestionStatus } from '@/types/database';

interface MutationResult {
  error?: string;
}

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// ── Note ──────────────────────────────────────────────────────────

export async function updateNote(
  noteId: string,
  updates: { title?: string; summary?: string; cleaned_text?: string },
): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const clean: Record<string, string | null> = {};
  if (updates.title !== undefined) clean.title = updates.title.trim();
  if (updates.summary !== undefined) clean.summary = updates.summary.trim() || null;
  if (updates.cleaned_text !== undefined) clean.cleaned_text = updates.cleaned_text.trim() || null;

  const { error } = await supabase
    .from('notes')
    .update(clean)
    .eq('id', noteId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  await exportNoteMarkdown(noteId).catch(() => {});
  return {};
}

// ── Tasks ─────────────────────────────────────────────────────────

export async function updateTask(
  taskId: string,
  updates: {
    title?: string;
    due_date?: string | null;
    priority?: TaskPriority | null;
    status?: TaskStatus;
  },
): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

export async function addTask(
  noteId: string,
  data: { title: string; due_date?: string | null; priority?: TaskPriority | null },
): Promise<{ id?: string; error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      note_id: noteId,
      title: data.title.trim(),
      due_date: data.due_date || null,
      priority: data.priority || null,
      status: 'todo' as TaskStatus,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: task.id };
}

export async function deleteTask(taskId: string): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

// ── Decisions ─────────────────────────────────────────────────────

export async function updateDecision(
  decisionId: string,
  updates: {
    decision_text?: string;
    rationale?: string | null;
    decision_date?: string | null;
  },
): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('decisions')
    .update(updates)
    .eq('id', decisionId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

export async function addDecision(
  noteId: string,
  data: { decision_text: string; rationale?: string | null; decision_date?: string | null },
): Promise<{ id?: string; error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      note_id: noteId,
      decision_text: data.decision_text.trim(),
      rationale: data.rationale?.trim() || null,
      decision_date: data.decision_date || null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: decision.id };
}

export async function deleteDecision(decisionId: string): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('decisions')
    .delete()
    .eq('id', decisionId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

// ── Open Questions ────────────────────────────────────────────────

export async function updateOpenQuestion(
  questionId: string,
  updates: { question_text?: string; status?: QuestionStatus },
): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('open_questions')
    .update(updates)
    .eq('id', questionId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

export async function addOpenQuestion(
  noteId: string,
  data: { question_text: string },
): Promise<{ id?: string; error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: question, error } = await supabase
    .from('open_questions')
    .insert({
      user_id: user.id,
      note_id: noteId,
      question_text: data.question_text.trim(),
      status: 'open' as QuestionStatus,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: question.id };
}

export async function deleteOpenQuestion(questionId: string): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('open_questions')
    .delete()
    .eq('id', questionId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

// ── People (junction-based) ───────────────────────────────────────

export async function linkPerson(noteId: string, personId: string): Promise<{ error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('note_people')
    .insert({ note_id: noteId, person_id: personId });

  if (error) return { error: error.message };
  return {};
}

export async function unlinkPerson(noteId: string, personId: string): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('note_people')
    .delete()
    .eq('note_id', noteId)
    .eq('person_id', personId);

  if (error) return { error: error.message };
  return {};
}

export async function createAndLinkPerson(
  noteId: string,
  data: { name: string; role?: string | null },
): Promise<{ id?: string; error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: person, error: personError } = await supabase
    .from('people')
    .insert({
      user_id: user.id,
      name: data.name.trim(),
      role: data.role?.trim() || null,
    })
    .select('id, name, role, created_at, updated_at, user_id')
    .single();

  if (personError || !person) return { error: personError?.message ?? 'Failed to create person' };

  const { error: linkError } = await supabase
    .from('note_people')
    .insert({ note_id: noteId, person_id: person.id });

  if (linkError) return { error: linkError.message };
  return { id: person.id };
}

// ── Projects (junction-based) ─────────────────────────────────────

export async function linkProject(noteId: string, projectId: string): Promise<{ error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('note_projects')
    .insert({ note_id: noteId, project_id: projectId });

  if (error) return { error: error.message };
  return {};
}

export async function unlinkProject(noteId: string, projectId: string): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('note_projects')
    .delete()
    .eq('note_id', noteId)
    .eq('project_id', projectId);

  if (error) return { error: error.message };
  return {};
}

export async function createAndLinkProject(
  noteId: string,
  data: { name: string },
): Promise<{ id?: string; error?: string }> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: data.name.trim(),
    })
    .select('id, name, status, notes, created_at, updated_at, user_id')
    .single();

  if (projectError || !project)
    return { error: projectError?.message ?? 'Failed to create project' };

  const { error: linkError } = await supabase
    .from('note_projects')
    .insert({ note_id: noteId, project_id: project.id });

  if (linkError) return { error: linkError.message };
  return { id: project.id };
}
