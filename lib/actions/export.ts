'use server';

import { createClient } from '@/lib/supabase/server';
import { renderNoteMarkdown } from '@/lib/markdown/renderer';
import type {
  Note,
  Task,
  Person,
  Project,
  Domain,
  Decision,
  OpenQuestion,
  Capture,
} from '@/types/database';

interface ExportResult {
  markdownPath?: string;
  error?: string;
}

export async function exportNoteMarkdown(noteId: string): Promise<ExportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Load note
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single();

  if (noteError || !note) {
    return { error: 'Note not found' };
  }

  // Load capture
  const { data: capture } = await supabase
    .from('captures')
    .select('*')
    .eq('id', (note as Note).capture_id)
    .single();

  // Load related entities
  const [tasksRes, peopleRes, projectsRes, domainsRes, decisionsRes, questionsRes] =
    await Promise.all([
      supabase
        .from('tasks')
        .select('*, actionee:people!actionee_id(name)')
        .eq('note_id', noteId)
        .order('created_at'),
      supabase
        .from('note_people')
        .select('person_id')
        .eq('note_id', noteId)
        .then(async ({ data: junctions }) => {
          if (!junctions || junctions.length === 0) return { data: [] };
          const ids = junctions.map((j) => j.person_id);
          return supabase.from('people').select('*').in('id', ids);
        }),
      supabase
        .from('note_projects')
        .select('project_id')
        .eq('note_id', noteId)
        .then(async ({ data: junctions }) => {
          if (!junctions || junctions.length === 0) return { data: [] };
          const ids = junctions.map((j) => j.project_id);
          return supabase.from('projects').select('*').in('id', ids);
        }),
      supabase
        .from('note_domains')
        .select('domain_id')
        .eq('note_id', noteId)
        .then(async ({ data: junctions }) => {
          if (!junctions || junctions.length === 0) return { data: [] };
          const ids = junctions.map((j) => j.domain_id);
          return supabase.from('domains').select('*').in('id', ids);
        }),
      supabase.from('decisions').select('*').eq('note_id', noteId).order('created_at'),
      supabase.from('open_questions').select('*').eq('note_id', noteId).order('created_at'),
    ]);

  const markdown = renderNoteMarkdown({
    note: note as Note,
    capture: (capture ?? { source_type: 'text' }) as Capture,
    tasks: (tasksRes.data ?? []) as (Task & { actionee: { name: string } | null })[],
    people: (peopleRes.data ?? []) as Person[],
    projects: (projectsRes.data ?? []) as Project[],
    domains: (domainsRes.data ?? []) as Domain[],
    decisions: (decisionsRes.data ?? []) as Decision[],
    openQuestions: (questionsRes.data ?? []) as OpenQuestion[],
  });

  // Upload to Storage
  const filePath = `${user.id}/${noteId}.md`;
  const { error: uploadError } = await supabase.storage.from('exports').upload(filePath, markdown, {
    contentType: 'text/markdown',
    upsert: true,
  });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  // Update note with markdown path
  await supabase.from('notes').update({ markdown_path: filePath }).eq('id', noteId);

  return { markdownPath: filePath };
}

export async function downloadNoteMarkdown(
  noteId: string,
): Promise<{ markdown?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { data: note } = await supabase
    .from('notes')
    .select('markdown_path')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single();

  if (!note?.markdown_path) {
    return { error: 'No export found' };
  }

  const { data, error } = await supabase.storage.from('exports').download(note.markdown_path);

  if (error || !data) {
    return { error: 'Download failed' };
  }

  const text = await data.text();
  return { markdown: text };
}
