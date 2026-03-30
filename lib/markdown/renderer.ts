import type {
  Note,
  Task,
  Person,
  Project,
  Decision,
  OpenQuestion,
  Capture,
} from '@/types/database';

interface RenderInput {
  note: Note;
  capture: Capture;
  tasks: Task[];
  people: Person[];
  projects: Project[];
  decisions: Decision[];
  openQuestions: OpenQuestion[];
}

export function renderNoteMarkdown(input: RenderInput): string {
  const { note, capture, tasks, people, projects, decisions, openQuestions } = input;
  const lines: string[] = [];

  // Title
  lines.push(`# ${note.title}`);
  lines.push('');

  // Metadata
  lines.push(`> **Created:** ${new Date(note.created_at).toLocaleDateString()}`);
  lines.push(`> **Source:** ${capture.source_type.replace('_', ' ')}`);
  lines.push('');

  // Summary
  if (note.summary) {
    lines.push('## Summary');
    lines.push('');
    lines.push(note.summary);
    lines.push('');
  }

  // Cleaned text
  if (note.cleaned_text) {
    lines.push('## Notes');
    lines.push('');
    lines.push(note.cleaned_text);
    lines.push('');
  }

  // Tasks
  if (tasks.length > 0) {
    lines.push('## Tasks');
    lines.push('');
    for (const task of tasks) {
      const check = task.status === 'done' ? 'x' : ' ';
      const parts = [`- [${check}] ${task.title}`];
      if (task.priority) parts.push(`[${task.priority}]`);
      if (task.due_date) parts.push(`(due: ${task.due_date})`);
      lines.push(parts.join(' '));
    }
    lines.push('');
  }

  // People
  if (people.length > 0) {
    lines.push('## People');
    lines.push('');
    for (const person of people) {
      const role = person.role ? ` — ${person.role}` : '';
      lines.push(`- **${person.name}**${role}`);
    }
    lines.push('');
  }

  // Projects
  if (projects.length > 0) {
    lines.push('## Projects');
    lines.push('');
    for (const project of projects) {
      lines.push(`- ${project.name}`);
    }
    lines.push('');
  }

  // Decisions
  if (decisions.length > 0) {
    lines.push('## Decisions');
    lines.push('');
    for (const decision of decisions) {
      lines.push(`### ${decision.decision_text}`);
      if (decision.rationale) {
        lines.push('');
        lines.push(`**Rationale:** ${decision.rationale}`);
      }
      if (decision.decision_date) {
        lines.push(`**Date:** ${decision.decision_date}`);
      }
      lines.push('');
    }
  }

  // Open Questions
  if (openQuestions.length > 0) {
    lines.push('## Open Questions');
    lines.push('');
    for (const q of openQuestions) {
      const status = q.status === 'resolved' ? '~~' : '';
      lines.push(`- ${status}${q.question_text}${status}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
