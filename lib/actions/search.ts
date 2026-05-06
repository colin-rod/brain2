'use server';

import { createClient } from '@/lib/supabase/server';
import type { AllEntities, SearchableItem } from '@/lib/search-utils';
import type { Note, Person, Project, Decision, OpenQuestion, Task } from '@/types/database';
import {
  generateEmbedding,
  findSimilarNotesForEmbedding,
  findSimilarPeople,
  findSimilarProjects,
} from './embeddings';

const SIMILARITY_FLOOR = 0.5;

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

export interface SemanticSearchResult {
  items: SearchableItem[];
  scores: Record<string, number>;
}

/**
 * Embedding-based search across notes, people, and projects.
 * Returns results above SIMILARITY_FLOOR, mapped into the same
 * SearchableItem shape used by the keyword (Fuse.js) results.
 */
export async function semanticSearch(query: string): Promise<SemanticSearchResult> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return { items: [], scores: {} };

  const embedding = await generateEmbedding(trimmed);

  const [notes, people, projects] = await Promise.all([
    findSimilarNotesForEmbedding(embedding, 5),
    findSimilarPeople(embedding, 5),
    findSimilarProjects(embedding, 5),
  ]);

  const items: SearchableItem[] = [];
  const scores: Record<string, number> = {};

  for (const n of notes) {
    if (n.similarity < SIMILARITY_FLOOR) continue;
    items.push({
      id: n.id,
      type: 'note',
      primary: n.title,
      secondary: n.summary ?? '',
      tertiary: '',
      href: `/notes/${n.id}`,
    });
    scores[`note:${n.id}`] = n.similarity;
  }

  for (const p of people) {
    if (p.similarity < SIMILARITY_FLOOR) continue;
    items.push({
      id: p.id,
      type: 'person',
      primary: p.name,
      secondary: p.role ?? '',
      tertiary: '',
      href: `/people/${p.id}`,
    });
    scores[`person:${p.id}`] = p.similarity;
  }

  for (const pr of projects) {
    if (pr.similarity < SIMILARITY_FLOOR) continue;
    items.push({
      id: pr.id,
      type: 'project',
      primary: pr.name,
      secondary: pr.status ?? '',
      tertiary: '',
      href: `/projects/${pr.id}`,
    });
    scores[`project:${pr.id}`] = pr.similarity;
  }

  return { items, scores };
}
