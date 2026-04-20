'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { Note } from '@/types/database';

/**
 * Create a bidirectional note-to-note link.
 */
export async function createNoteLink(noteId: string, linkedNoteId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('note_notes').insert({
    note_id: noteId,
    linked_note_id: linkedNoteId,
    user_id: user.id,
  });

  revalidatePath(`/notes/${noteId}`);
  revalidatePath(`/notes/${linkedNoteId}`);
}

/**
 * Remove a note-to-note link (either direction).
 */
export async function removeNoteLink(noteId: string, linkedNoteId: string): Promise<void> {
  const supabase = await createClient();

  // Delete both directions to handle whichever was stored
  await supabase
    .from('note_notes')
    .delete()
    .or(
      `and(note_id.eq.${noteId},linked_note_id.eq.${linkedNoteId}),and(note_id.eq.${linkedNoteId},linked_note_id.eq.${noteId})`,
    );

  revalidatePath(`/notes/${noteId}`);
  revalidatePath(`/notes/${linkedNoteId}`);
}

/**
 * Get all confirmed linked notes for a given note (both directions).
 */
export async function getLinkedNotes(
  noteId: string,
): Promise<Pick<Note, 'id' | 'title' | 'summary' | 'created_at'>[]> {
  const supabase = await createClient();

  // Get link rows in both directions
  const { data: links } = await supabase
    .from('note_notes')
    .select('note_id, linked_note_id')
    .or(`note_id.eq.${noteId},linked_note_id.eq.${noteId}`);

  if (!links || links.length === 0) return [];

  // Collect the "other" note ID from each link
  const linkedIds = links.map((l) => (l.note_id === noteId ? l.linked_note_id : l.note_id));

  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, summary, created_at')
    .in('id', linkedIds)
    .order('created_at', { ascending: false });

  return (notes ?? []) as Pick<Note, 'id' | 'title' | 'summary' | 'created_at'>[];
}

/**
 * Create multiple note links at once (used during review save).
 */
export async function createNoteLinks(noteId: string, linkedNoteIds: string[]): Promise<void> {
  if (linkedNoteIds.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('note_notes').insert(
    linkedNoteIds.map((linkedId) => ({
      note_id: noteId,
      linked_note_id: linkedId,
      user_id: user.id,
    })),
  );
}
