'use server';

import { createClient } from '@/lib/supabase/server';
import { validateReviewPayload } from '@/lib/validation/review-payload';
import { exportNoteMarkdown } from './export';
import type { ReviewPayload } from '@/types/domain';

interface SaveResult {
  noteId?: string;
  error?: string;
  validationErrors?: { field: string; message: string }[];
}

export async function saveReviewedNote(payload: ReviewPayload): Promise<SaveResult> {
  // Validate
  const validationErrors = validateReviewPayload(payload);
  if (validationErrors.length > 0) {
    return { error: 'Validation failed', validationErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify capture exists and belongs to user
  const { data: capture, error: captureError } = await supabase
    .from('captures')
    .select('id, status')
    .eq('id', payload.captureId)
    .eq('user_id', user.id)
    .single();

  if (captureError || !capture) {
    return { error: 'Capture not found' };
  }

  // Insert note
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      capture_id: payload.captureId,
      title: payload.title.trim(),
      summary: payload.summary.trim() || null,
      cleaned_text: payload.cleaned_text.trim() || null,
    })
    .select('id')
    .single();

  if (noteError || !note) {
    return { error: `Failed to create note: ${noteError?.message}` };
  }

  const noteId = note.id;

  // Insert tasks
  if (payload.tasks.length > 0) {
    const { error: tasksError } = await supabase.from('tasks').insert(
      payload.tasks.map((t) => ({
        user_id: user.id,
        note_id: noteId,
        title: t.title.trim(),
        due_date: t.due_date || null,
        priority: t.priority || null,
        status: 'todo',
      })),
    );
    if (tasksError) {
      return { error: `Failed to save tasks: ${tasksError.message}` };
    }
  }

  // Insert people (new ones) and collect IDs for junction table
  const personIds: string[] = [];

  for (const p of payload.people) {
    if (p.matchedPersonId) {
      // Link to existing person
      personIds.push(p.matchedPersonId);
    } else {
      // Create new person
      const { data: newPerson, error: personError } = await supabase
        .from('people')
        .insert({
          user_id: user.id,
          name: p.name.trim(),
          role: p.role?.trim() || null,
        })
        .select('id')
        .single();

      if (personError || !newPerson) {
        return { error: `Failed to save person "${p.name}": ${personError?.message}` };
      }
      personIds.push(newPerson.id);
    }
  }

  // Insert note_people junction rows
  if (personIds.length > 0) {
    const { error: npError } = await supabase.from('note_people').insert(
      personIds.map((personId) => ({
        note_id: noteId,
        person_id: personId,
      })),
    );
    if (npError) {
      return { error: `Failed to link people: ${npError.message}` };
    }
  }

  // Insert projects (new ones) and collect IDs for junction table
  const projectIds: string[] = [];

  for (const p of payload.projects) {
    if (p.matchedProjectId) {
      projectIds.push(p.matchedProjectId);
    } else {
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: p.name.trim(),
        })
        .select('id')
        .single();

      if (projectError || !newProject) {
        return { error: `Failed to save project "${p.name}": ${projectError?.message}` };
      }
      projectIds.push(newProject.id);
    }
  }

  // Insert note_projects junction rows
  if (projectIds.length > 0) {
    const { error: npjError } = await supabase.from('note_projects').insert(
      projectIds.map((projectId) => ({
        note_id: noteId,
        project_id: projectId,
      })),
    );
    if (npjError) {
      return { error: `Failed to link projects: ${npjError.message}` };
    }
  }

  // Insert decisions
  if (payload.decisions.length > 0) {
    const { error: decisionsError } = await supabase.from('decisions').insert(
      payload.decisions.map((d) => ({
        user_id: user.id,
        note_id: noteId,
        decision_text: d.decision_text.trim(),
        rationale: d.rationale?.trim() || null,
        decision_date: d.decision_date || null,
      })),
    );
    if (decisionsError) {
      return { error: `Failed to save decisions: ${decisionsError.message}` };
    }
  }

  // Insert open questions
  if (payload.open_questions.length > 0) {
    const { error: questionsError } = await supabase.from('open_questions').insert(
      payload.open_questions.map((q) => ({
        user_id: user.id,
        note_id: noteId,
        question_text: q.question_text.trim(),
        status: 'open',
      })),
    );
    if (questionsError) {
      return { error: `Failed to save questions: ${questionsError.message}` };
    }
  }

  // Update capture status to saved
  await supabase.from('captures').update({ status: 'saved' }).eq('id', payload.captureId);

  // Auto-export markdown (best-effort, don't fail the save)
  await exportNoteMarkdown(noteId).catch(() => {});

  return { noteId };
}
