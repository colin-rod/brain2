'use server';

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import type { SuggestedNoteLink } from '@/types/domain';

const openai = new OpenAI();

/**
 * Generate an embedding vector for the given text using text-embedding-3-small.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // stay well within token limits
  });
  return response.data[0].embedding;
}

/**
 * Generate and store an embedding for a saved note.
 * Best-effort — does not throw on failure.
 */
export async function storeNoteEmbedding(noteId: string, text: string): Promise<void> {
  const embedding = await generateEmbedding(text);
  const supabase = await createClient();

  // pgvector expects the vector as a string like '[0.1,0.2,...]'
  const vectorString = `[${embedding.join(',')}]`;

  await supabase
    .from('notes')
    .update({ embedding: vectorString } as Record<string, unknown>)
    .eq('id', noteId);
}

/**
 * Find the most similar notes to a given note using cosine similarity.
 * Excludes the note itself and any already-linked notes.
 */
export async function findSimilarNotes(
  noteId: string,
  limit: number = 5,
): Promise<SuggestedNoteLink[]> {
  const supabase = await createClient();

  // Get the source note's embedding
  const { data: note } = await supabase.from('notes').select('embedding').eq('id', noteId).single();

  if (!note?.embedding) return [];

  // Get already-linked note IDs (both directions)
  const { data: links } = await supabase
    .from('note_notes')
    .select('note_id, linked_note_id')
    .or(`note_id.eq.${noteId},linked_note_id.eq.${noteId}`);

  const linkedIds = new Set<string>();
  linkedIds.add(noteId); // exclude self
  for (const link of links ?? []) {
    linkedIds.add(link.note_id);
    linkedIds.add(link.linked_note_id);
  }

  // Query for similar notes using pgvector cosine distance via RPC
  // We use a raw query since Supabase JS client doesn't support pgvector operators directly
  const { data: similar } = await supabase.rpc('find_similar_notes', {
    query_embedding: note.embedding,
    match_count: limit + linkedIds.size, // fetch extra to account for filtering
    note_id: noteId,
  });

  if (!similar) return [];

  return similar
    .filter((row: { id: string }) => !linkedIds.has(row.id))
    .slice(0, limit)
    .map((row: { id: string; title: string; summary: string | null; similarity: number }) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      similarity: row.similarity,
    }));
}

/**
 * Find similar notes for content that hasn't been saved yet (during review).
 * Takes raw text instead of a note ID.
 */
export async function findSimilarNotesForText(
  text: string,
  limit: number = 5,
): Promise<SuggestedNoteLink[]> {
  const embedding = await generateEmbedding(text);
  const supabase = await createClient();

  const vectorString = `[${embedding.join(',')}]`;

  const { data: similar } = await supabase.rpc('find_similar_notes', {
    query_embedding: vectorString,
    match_count: limit,
    note_id: '00000000-0000-0000-0000-000000000000', // dummy ID to exclude nothing
  });

  if (!similar) return [];

  return similar.map(
    (row: { id: string; title: string; summary: string | null; similarity: number }) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      similarity: row.similarity,
    }),
  );
}

/**
 * Backfill embeddings for all notes that don't have one yet.
 */
export async function backfillEmbeddings(): Promise<{ processed: number; errors: number }> {
  const supabase = await createClient();

  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, summary, cleaned_text')
    .is('embedding', null)
    .order('created_at');

  if (!notes || notes.length === 0) return { processed: 0, errors: 0 };

  let processed = 0;
  let errors = 0;

  for (const note of notes) {
    const text = [note.title, note.summary, note.cleaned_text].filter(Boolean).join('\n\n');
    if (!text.trim()) continue;

    try {
      await storeNoteEmbedding(note.id, text);
      processed++;
    } catch {
      errors++;
    }
  }

  return { processed, errors };
}
