'use server';

import { createClient } from '@/lib/supabase/server';
import type { IdeaStatus, TaskPriority } from '@/types/database';

interface MutationResult {
  error?: string;
}

interface CreateResult {
  id?: string;
  error?: string;
}

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// ── Standalone Task ──────────────────────────────────────────

export async function createStandaloneTask(data: {
  title: string;
  priority?: TaskPriority | null;
  due_date?: string | null;
  actionee_id?: string | null;
  project_id?: string | null;
}): Promise<CreateResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      note_id: null,
      title: data.title.trim(),
      priority: data.priority || null,
      due_date: data.due_date || null,
      actionee_id: data.actionee_id || null,
      project_id: data.project_id || null,
      status: 'todo',
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: task.id };
}

// ── Standalone Decision ──────────────────────────────────────

export async function createStandaloneDecision(data: {
  decision_text: string;
  rationale?: string | null;
  decision_date?: string | null;
  project_id?: string | null;
}): Promise<CreateResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: decision, error } = await supabase
    .from('decisions')
    .insert({
      user_id: user.id,
      note_id: null,
      decision_text: data.decision_text.trim(),
      rationale: data.rationale?.trim() || null,
      decision_date: data.decision_date || null,
      project_id: data.project_id || null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: decision.id };
}

// ── People CRUD ──────────────────────────────────────────────

export async function createPerson(data: {
  name: string;
  role?: string | null;
}): Promise<CreateResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: person, error } = await supabase
    .from('people')
    .insert({
      user_id: user.id,
      name: data.name.trim(),
      role: data.role?.trim() || null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: person.id };
}

export async function updatePerson(
  personId: string,
  updates: { name?: string; role?: string | null },
): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const clean: Record<string, string | null> = {};
  if (updates.name !== undefined) clean.name = updates.name.trim();
  if (updates.role !== undefined) clean.role = updates.role?.trim() || null;

  const { error } = await supabase
    .from('people')
    .update(clean)
    .eq('id', personId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

export async function deletePerson(personId: string): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('people')
    .delete()
    .eq('id', personId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

export async function setPersonPinned(personId: string, pinned: boolean): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('people')
    .update({ pinned })
    .eq('id', personId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

export async function mergePeople(targetId: string, sourceIds: string[]): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  if (!targetId || sourceIds.length === 0) {
    return { error: 'Target and at least one source are required' };
  }
  if (sourceIds.includes(targetId)) {
    return { error: 'Target cannot also be a source' };
  }

  const { error } = await supabase.rpc('merge_people', {
    target_id: targetId,
    source_ids: sourceIds,
  });

  if (error) return { error: error.message };
  return {};
}

// ── Projects CRUD ────────────────────────────────────────────

export async function createProject(data: {
  name: string;
  status?: string | null;
}): Promise<CreateResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: data.name.trim(),
      status: data.status?.trim() || null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: project.id };
}

export async function updateProject(
  projectId: string,
  updates: { name?: string; status?: string | null },
): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const clean: Record<string, string | null> = {};
  if (updates.name !== undefined) clean.name = updates.name.trim();
  if (updates.status !== undefined) clean.status = updates.status?.trim() || null;

  const { error } = await supabase
    .from('projects')
    .update(clean)
    .eq('id', projectId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

export async function deleteProject(projectId: string): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

export async function mergeProjects(
  targetId: string,
  sourceIds: string[],
): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  if (!targetId || sourceIds.length === 0) {
    return { error: 'Target and at least one source are required' };
  }
  if (sourceIds.includes(targetId)) {
    return { error: 'Target cannot also be a source' };
  }

  const { error } = await supabase.rpc('merge_projects', {
    target_id: targetId,
    source_ids: sourceIds,
  });

  if (error) return { error: error.message };
  return {};
}

// ── Domains CRUD ────────────────────────────────────────────

export async function createDomain(data: {
  name: string;
  description?: string | null;
}): Promise<CreateResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: domain, error } = await supabase
    .from('domains')
    .insert({
      user_id: user.id,
      name: data.name.trim(),
      description: data.description?.trim() || null,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: domain.id };
}

export async function updateDomain(
  domainId: string,
  updates: { name?: string; description?: string | null },
): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const clean: Record<string, string | null> = {};
  if (updates.name !== undefined) clean.name = updates.name.trim();
  if (updates.description !== undefined) clean.description = updates.description?.trim() || null;

  const { error } = await supabase
    .from('domains')
    .update(clean)
    .eq('id', domainId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

export async function deleteDomain(domainId: string): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('domains')
    .delete()
    .eq('id', domainId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

export async function mergeDomains(
  targetId: string,
  sourceIds: string[],
): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  if (!targetId || sourceIds.length === 0) {
    return { error: 'Target and at least one source are required' };
  }
  if (sourceIds.includes(targetId)) {
    return { error: 'Target cannot also be a source' };
  }

  const { error } = await supabase.rpc('merge_domains', {
    target_id: targetId,
    source_ids: sourceIds,
  });

  if (error) return { error: error.message };
  return {};
}

// ── Ideas CRUD ──────────────────────────────────────────────

export async function createIdea(data: { idea_text: string }): Promise<CreateResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: idea, error } = await supabase
    .from('ideas')
    .insert({
      user_id: user.id,
      note_id: null,
      idea_text: data.idea_text.trim(),
      status: 'raw',
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  return { id: idea.id };
}

export async function updateIdeaStatus(
  ideaId: string,
  status: IdeaStatus,
): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('ideas')
    .update({ status })
    .eq('id', ideaId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

export async function updateIdeaText(ideaId: string, idea_text: string): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('ideas')
    .update({ idea_text: idea_text.trim() })
    .eq('id', ideaId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

export async function deleteIdea(ideaId: string): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('ideas').delete().eq('id', ideaId).eq('user_id', user.id);

  if (error) return { error: error.message };
  return {};
}

// ── Cross-entity linking: project_people ─────────────────────

export async function linkPersonToProject(
  projectId: string,
  personId: string,
): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('project_people')
    .insert({ project_id: projectId, person_id: personId });

  if (error) return { error: error.message };
  return {};
}

export async function unlinkPersonFromProject(
  projectId: string,
  personId: string,
): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('project_people')
    .delete()
    .eq('project_id', projectId)
    .eq('person_id', personId);

  if (error) return { error: error.message };
  return {};
}

// ── Cross-entity linking: decision_people ────────────────────

export async function linkPersonToDecision(
  decisionId: string,
  personId: string,
): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('decision_people')
    .insert({ decision_id: decisionId, person_id: personId });

  if (error) return { error: error.message };
  return {};
}

export async function unlinkPersonFromDecision(
  decisionId: string,
  personId: string,
): Promise<MutationResult> {
  const { supabase, user } = await getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('decision_people')
    .delete()
    .eq('decision_id', decisionId)
    .eq('person_id', personId);

  if (error) return { error: error.message };
  return {};
}
