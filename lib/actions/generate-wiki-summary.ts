'use server';

import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { fetchPersonWikiData, fetchProjectWikiData } from './wiki';

export interface GenerateSummaryResult {
  summary: string;
  fromCache: boolean;
  error?: string;
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateWikiSummary(
  entityType: 'person' | 'project',
  entityId: string,
  force = false,
): Promise<GenerateSummaryResult> {
  const supabase = await createClient();
  const table = entityType === 'person' ? 'people' : 'projects';

  // Check cache unless forced
  if (!force) {
    const { data: entity } = await supabase
      .from(table)
      .select('compiled_summary, summary_generated_at')
      .eq('id', entityId)
      .single();

    if (entity?.compiled_summary && entity.summary_generated_at) {
      // Check if any linked notes are newer than the summary
      const junctionTable = entityType === 'person' ? 'note_people' : 'note_projects';
      const fkColumn = entityType === 'person' ? 'person_id' : 'project_id';

      const { data: latestNote } = await supabase
        .from(junctionTable)
        .select('notes(created_at)')
        .eq(fkColumn, entityId)
        .order('notes(created_at)', { ascending: false })
        .limit(1);

      const latestNoteDate = (
        latestNote?.[0] as unknown as { notes: { created_at: string } } | undefined
      )?.notes?.created_at;

      if (!latestNoteDate || new Date(entity.summary_generated_at) >= new Date(latestNoteDate)) {
        return { summary: entity.compiled_summary, fromCache: true };
      }
    }
  }

  // Assemble context
  const contextText =
    entityType === 'person'
      ? await assemblePersonContext(entityId)
      : await assembleProjectContext(entityId);

  if (!contextText) {
    return { summary: '', fromCache: false, error: 'No data found for this entity' };
  }

  // Generate summary via OpenAI
  try {
    const systemPrompt =
      entityType === 'person'
        ? `You are a knowledge assistant that compiles concise wiki-style summaries about people from work notes. Write a 2-4 paragraph summary that is factual and based only on the information provided. Cover: who they are and their role, what they're currently working on, key decisions they've been part of, and any open threads or unresolved questions.`
        : `You are a knowledge assistant that compiles concise wiki-style summaries about projects from work notes. Write a 2-4 paragraph summary that is factual and based only on the information provided. Cover: what the project is and its current status, who's involved, key decisions made, and any open threads or unresolved questions.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contextText },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const summary = response.choices[0]?.message?.content;
    if (!summary) {
      return { summary: '', fromCache: false, error: 'Empty response from OpenAI' };
    }

    // Cache the result
    await supabase
      .from(table)
      .update({
        compiled_summary: summary,
        summary_generated_at: new Date().toISOString(),
      })
      .eq('id', entityId);

    return { summary, fromCache: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error generating summary';
    return { summary: '', fromCache: false, error: message };
  }
}

async function assemblePersonContext(personId: string): Promise<string | null> {
  const data = await fetchPersonWikiData(personId);
  if (!data) return null;

  const lines: string[] = [];
  lines.push(`# ${data.person.name}`);
  if (data.person.role) lines.push(`Role: ${data.person.role}`);
  lines.push('');

  if (data.notes.length > 0) {
    lines.push(`## Linked Notes (${data.notes.length})`);
    for (const note of data.notes) {
      lines.push(`- **${note.title}** (${note.created_at.slice(0, 10)})`);
      if (note.summary) lines.push(`  ${note.summary}`);
    }
    lines.push('');
  }

  if (data.assignedTasks.length > 0) {
    lines.push(`## Assigned Tasks (${data.assignedTasks.length})`);
    for (const task of data.assignedTasks) {
      const parts = [task.title, `status: ${task.status}`];
      if (task.priority) parts.push(`priority: ${task.priority}`);
      if (task.due_date) parts.push(`due: ${task.due_date}`);
      lines.push(`- ${parts.join(' | ')}`);
    }
    lines.push('');
  }

  if (data.linkedDecisions.length > 0) {
    lines.push(`## Decisions Involved In (${data.linkedDecisions.length})`);
    for (const d of data.linkedDecisions) {
      lines.push(`- ${d.decision_text}`);
      if (d.rationale) lines.push(`  Rationale: ${d.rationale}`);
      if (d.decision_date) lines.push(`  Date: ${d.decision_date}`);
    }
    lines.push('');
  }

  if (data.openQuestions.length > 0) {
    lines.push(`## Open Questions (${data.openQuestions.length})`);
    for (const q of data.openQuestions) {
      lines.push(`- ${q.question_text} (${q.status})`);
    }
    lines.push('');
  }

  if (data.linkedProjects.length > 0) {
    lines.push(`## Related Projects (${data.linkedProjects.length})`);
    for (const p of data.linkedProjects) {
      lines.push(`- ${p.name}${p.status ? ` (${p.status})` : ''}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

async function assembleProjectContext(projectId: string): Promise<string | null> {
  const data = await fetchProjectWikiData(projectId);
  if (!data) return null;

  const lines: string[] = [];
  lines.push(`# ${data.project.name}`);
  if (data.project.status) lines.push(`Status: ${data.project.status}`);
  lines.push('');

  if (data.linkedPeople.length > 0) {
    lines.push(`## People Involved (${data.linkedPeople.length})`);
    for (const p of data.linkedPeople) {
      lines.push(`- ${p.name}${p.role ? ` (${p.role})` : ''}`);
    }
    lines.push('');
  }

  if (data.notes.length > 0) {
    lines.push(`## Linked Notes (${data.notes.length})`);
    for (const note of data.notes) {
      lines.push(`- **${note.title}** (${note.created_at.slice(0, 10)})`);
      if (note.summary) lines.push(`  ${note.summary}`);
    }
    lines.push('');
  }

  if (data.tasks.length > 0) {
    lines.push(`## Tasks (${data.tasks.length})`);
    for (const task of data.tasks) {
      const parts = [task.title, `status: ${task.status}`];
      if (task.priority) parts.push(`priority: ${task.priority}`);
      if (task.due_date) parts.push(`due: ${task.due_date}`);
      lines.push(`- ${parts.join(' | ')}`);
    }
    lines.push('');
  }

  if (data.decisions.length > 0) {
    lines.push(`## Decisions (${data.decisions.length})`);
    for (const d of data.decisions) {
      lines.push(`- ${d.decision_text}`);
      if (d.rationale) lines.push(`  Rationale: ${d.rationale}`);
      if (d.decision_date) lines.push(`  Date: ${d.decision_date}`);
    }
    lines.push('');
  }

  if (data.openQuestions.length > 0) {
    lines.push(`## Open Questions (${data.openQuestions.length})`);
    for (const q of data.openQuestions) {
      lines.push(`- ${q.question_text} (${q.status})`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
