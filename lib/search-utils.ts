import type { LucideIcon } from 'lucide-react';
import { FileText, CheckSquare, Users, FolderOpen, Scale, HelpCircle } from 'lucide-react';
import type { Note, Task, Person, Project, Decision, OpenQuestion } from '@/types/database';

export type SearchEntityType =
  | 'note'
  | 'task'
  | 'person'
  | 'project'
  | 'decision'
  | 'open_question';

export interface SearchableItem {
  id: string;
  type: SearchEntityType;
  primary: string;
  secondary: string;
  tertiary: string;
  href: string;
}

export interface AllEntities {
  notes: Note[];
  tasks: (Task & { notes: { id: string; title: string } | null })[];
  people: Person[];
  projects: Project[];
  decisions: (Decision & { notes: { id: string; title: string } | null })[];
  openQuestions: OpenQuestion[];
}

const ENTITY_META: Record<
  SearchEntityType,
  { label: string; pluralLabel: string; icon: LucideIcon }
> = {
  note: { label: 'Note', pluralLabel: 'Notes', icon: FileText },
  task: { label: 'Task', pluralLabel: 'Tasks', icon: CheckSquare },
  person: { label: 'Person', pluralLabel: 'People', icon: Users },
  project: { label: 'Project', pluralLabel: 'Projects', icon: FolderOpen },
  decision: { label: 'Decision', pluralLabel: 'Decisions', icon: Scale },
  open_question: { label: 'Question', pluralLabel: 'Open Questions', icon: HelpCircle },
};

export function getEntityMeta(type: SearchEntityType) {
  return ENTITY_META[type];
}

export function normalizeToSearchableItems(data: AllEntities): SearchableItem[] {
  const items: SearchableItem[] = [];

  for (const n of data.notes) {
    items.push({
      id: n.id,
      type: 'note',
      primary: n.title,
      secondary: n.summary ?? '',
      tertiary: n.cleaned_text ?? '',
      href: `/notes/${n.id}`,
    });
  }

  for (const t of data.tasks) {
    items.push({
      id: t.id,
      type: 'task',
      primary: t.title,
      secondary: [t.status, t.priority].filter(Boolean).join(' · '),
      tertiary: '',
      href: t.notes ? `/notes/${t.notes.id}` : '/tasks',
    });
  }

  for (const p of data.people) {
    items.push({
      id: p.id,
      type: 'person',
      primary: p.name,
      secondary: p.role ?? '',
      tertiary: p.notes ?? '',
      href: `/people/${p.id}`,
    });
  }

  for (const p of data.projects) {
    items.push({
      id: p.id,
      type: 'project',
      primary: p.name,
      secondary: p.status ?? '',
      tertiary: p.notes ?? '',
      href: `/projects/${p.id}`,
    });
  }

  for (const d of data.decisions) {
    items.push({
      id: d.id,
      type: 'decision',
      primary: d.decision_text,
      secondary: d.rationale ?? '',
      tertiary: '',
      href: d.notes ? `/notes/${d.notes.id}` : '/decisions',
    });
  }

  for (const q of data.openQuestions) {
    items.push({
      id: q.id,
      type: 'open_question',
      primary: q.question_text,
      secondary: q.status,
      tertiary: '',
      href: q.note_id ? `/notes/${q.note_id}` : '/decisions',
    });
  }

  return items;
}

export function groupResultsByType(
  results: SearchableItem[],
  maxPerGroup = 5,
): { type: SearchEntityType; items: SearchableItem[] }[] {
  const grouped = new Map<SearchEntityType, SearchableItem[]>();

  for (const item of results) {
    const group = grouped.get(item.type) ?? [];
    if (group.length < maxPerGroup) {
      group.push(item);
    }
    grouped.set(item.type, group);
  }

  const order: SearchEntityType[] = [
    'note',
    'task',
    'person',
    'project',
    'decision',
    'open_question',
  ];

  return order
    .filter((type) => grouped.has(type))
    .map((type) => ({ type, items: grouped.get(type)! }));
}
