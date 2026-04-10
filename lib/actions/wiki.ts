'use server';

import { createClient } from '@/lib/supabase/server';
import type { Person, Project, Note, Task, Decision, OpenQuestion } from '@/types/database';

/* ============================================================
   Timeline types
   ============================================================ */

export interface TimelineItem {
  id: string;
  date: string;
  type: 'note' | 'task' | 'decision' | 'question';
  title: string;
  snippet?: string;
  href?: string;
  status?: string;
}

/* ============================================================
   Person wiki data
   ============================================================ */

export interface PersonWikiData {
  person: Person;
  notes: Note[];
  assignedTasks: (Task & { notes: { id: string; title: string } | null })[];
  linkedProjects: { id: string; name: string; status: string | null }[];
  linkedDecisions: {
    id: string;
    decision_text: string;
    rationale: string | null;
    decision_date: string | null;
  }[];
  openQuestions: OpenQuestion[];
  linkedDomains: { id: string; name: string }[];
  timeline: TimelineItem[];
}

export async function fetchPersonWikiData(personId: string): Promise<PersonWikiData | null> {
  const supabase = await createClient();

  const { data: person, error } = await supabase
    .from('people')
    .select('*')
    .eq('id', personId)
    .single();

  if (error || !person) return null;

  const typedPerson = person as Person;

  // Load related data in parallel
  const [noteJunctions, assignedTasksRes, linkedProjectsRes, linkedDecisionsRes] =
    await Promise.all([
      supabase.from('note_people').select('note_id').eq('person_id', personId),
      supabase
        .from('tasks')
        .select('*, notes(id, title)')
        .eq('actionee_id', personId)
        .order('created_at'),
      supabase
        .from('project_people')
        .select('project_id, projects(id, name, status)')
        .eq('person_id', personId),
      supabase
        .from('decision_people')
        .select('decision_id, decisions(id, decision_text, rationale, decision_date)')
        .eq('person_id', personId),
    ]);

  const assignedTasks = (assignedTasksRes.data ?? []) as (Task & {
    notes: { id: string; title: string } | null;
  })[];

  const linkedProjects = (
    (linkedProjectsRes.data ?? []) as unknown as {
      project_id: string;
      projects: { id: string; name: string; status: string | null };
    }[]
  ).map((lp) => lp.projects);

  const linkedDecisions = (
    (linkedDecisionsRes.data ?? []) as unknown as {
      decision_id: string;
      decisions: {
        id: string;
        decision_text: string;
        rationale: string | null;
        decision_date: string | null;
      };
    }[]
  ).map((ld) => ld.decisions);

  const noteIds = (noteJunctions.data ?? []).map((j) => j.note_id);
  let notes: Note[] = [];
  let openQuestions: OpenQuestion[] = [];
  let linkedDomains: { id: string; name: string }[] = [];

  if (noteIds.length > 0) {
    const [notesRes, questionsRes, domainJunctions] = await Promise.all([
      supabase
        .from('notes')
        .select('*')
        .in('id', noteIds)
        .order('created_at', { ascending: false }),
      supabase.from('open_questions').select('*').in('note_id', noteIds).order('created_at'),
      supabase.from('note_domains').select('domain_id, domains(id, name)').in('note_id', noteIds),
    ]);
    notes = (notesRes.data ?? []) as Note[];
    openQuestions = (questionsRes.data ?? []) as OpenQuestion[];

    // Deduplicate domains across notes
    const domainMap = new Map<string, { id: string; name: string }>();
    for (const row of (domainJunctions.data ?? []) as unknown as {
      domain_id: string;
      domains: { id: string; name: string };
    }[]) {
      domainMap.set(row.domains.id, row.domains);
    }
    linkedDomains = Array.from(domainMap.values());
  }

  const timeline = buildTimeline(notes, assignedTasks, linkedDecisions, openQuestions);

  return {
    person: typedPerson,
    notes,
    assignedTasks,
    linkedProjects,
    linkedDecisions,
    openQuestions,
    linkedDomains,
    timeline,
  };
}

/* ============================================================
   Project wiki data
   ============================================================ */

export interface ProjectWikiData {
  project: Project;
  notes: Note[];
  tasks: Task[];
  decisions: Decision[];
  linkedPeople: { id: string; name: string; role: string | null }[];
  allPeople: { id: string; name: string }[];
  openQuestions: OpenQuestion[];
  linkedDomains: { id: string; name: string }[];
  timeline: TimelineItem[];
}

export async function fetchProjectWikiData(projectId: string): Promise<ProjectWikiData | null> {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error || !project) return null;

  const typedProject = project as Project;

  // Load linked notes via junction table
  const { data: junctions } = await supabase
    .from('note_projects')
    .select('note_id')
    .eq('project_id', projectId);

  const noteIds = (junctions ?? []).map((j) => j.note_id);

  // Fetch note-linked + direct-linked data in parallel
  const [
    notesRes,
    noteTasksRes,
    noteDecisionsRes,
    directTasksRes,
    directDecisionsRes,
    linkedPeopleRes,
    allPeopleRes,
  ] = await Promise.all([
    noteIds.length > 0
      ? supabase
          .from('notes')
          .select('*')
          .in('id', noteIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    noteIds.length > 0
      ? supabase.from('tasks').select('*').in('note_id', noteIds).order('created_at')
      : Promise.resolve({ data: [] }),
    noteIds.length > 0
      ? supabase.from('decisions').select('*').in('note_id', noteIds).order('created_at')
      : Promise.resolve({ data: [] }),
    supabase
      .from('tasks')
      .select('*, actionee:people!actionee_id(id, name)')
      .eq('project_id', projectId)
      .order('created_at'),
    supabase.from('decisions').select('*').eq('project_id', projectId).order('created_at'),
    supabase
      .from('project_people')
      .select('person_id, people(id, name, role)')
      .eq('project_id', projectId),
    supabase.from('people').select('id, name').order('name'),
  ]);

  const notes = (notesRes.data ?? []) as Note[];

  // Merge note-linked and direct-linked tasks, deduplicate by id
  const allTasks = [
    ...((noteTasksRes.data ?? []) as Task[]),
    ...((directTasksRes.data ?? []) as Task[]),
  ];
  const taskMap = new Map<string, Task>();
  for (const t of allTasks) taskMap.set(t.id, t);
  const tasks = Array.from(taskMap.values());

  // Merge decisions similarly
  const allDecisions = [
    ...((noteDecisionsRes.data ?? []) as Decision[]),
    ...((directDecisionsRes.data ?? []) as Decision[]),
  ];
  const decisionMap = new Map<string, Decision>();
  for (const d of allDecisions) decisionMap.set(d.id, d);
  const decisions = Array.from(decisionMap.values());

  const linkedPeople = (
    (linkedPeopleRes.data ?? []) as unknown as {
      person_id: string;
      people: { id: string; name: string; role: string | null };
    }[]
  ).map((lp) => lp.people);
  const allPeople = (allPeopleRes.data ?? []) as { id: string; name: string }[];

  // Fetch open questions and domains via note_ids
  let openQuestions: OpenQuestion[] = [];
  let linkedDomains: { id: string; name: string }[] = [];

  if (noteIds.length > 0) {
    const [questionsRes, domainJunctions] = await Promise.all([
      supabase.from('open_questions').select('*').in('note_id', noteIds).order('created_at'),
      supabase.from('note_domains').select('domain_id, domains(id, name)').in('note_id', noteIds),
    ]);
    openQuestions = (questionsRes.data ?? []) as OpenQuestion[];

    const domainDedupMap = new Map<string, { id: string; name: string }>();
    for (const row of (domainJunctions.data ?? []) as unknown as {
      domain_id: string;
      domains: { id: string; name: string };
    }[]) {
      domainDedupMap.set(row.domains.id, row.domains);
    }
    linkedDomains = Array.from(domainDedupMap.values());
  }

  // Build timeline from deduped decisions
  const decisionItems = decisions.map((d) => ({
    id: d.id,
    decision_text: d.decision_text,
    rationale: d.rationale,
    decision_date: d.decision_date,
  }));

  const timeline = buildTimeline(notes, tasks, decisionItems, openQuestions);

  return {
    project: typedProject,
    notes,
    tasks,
    decisions,
    linkedPeople,
    allPeople,
    openQuestions,
    linkedDomains,
    timeline,
  };
}

/* ============================================================
   Timeline builder
   ============================================================ */

function buildTimeline(
  notes: Note[],
  tasks: (Task | (Task & { notes: { id: string; title: string } | null }))[],
  decisions: {
    id: string;
    decision_text: string;
    rationale: string | null;
    decision_date: string | null;
  }[],
  questions: OpenQuestion[],
): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const note of notes) {
    items.push({
      id: note.id,
      date: note.created_at,
      type: 'note',
      title: note.title,
      snippet: note.summary ?? undefined,
      href: `/notes/${note.id}`,
    });
  }

  for (const task of tasks) {
    items.push({
      id: task.id,
      date: task.due_date ?? task.created_at,
      type: 'task',
      title: task.title,
      status: task.status,
    });
  }

  for (const d of decisions) {
    items.push({
      id: d.id,
      date: d.decision_date ?? new Date().toISOString(),
      type: 'decision',
      title: d.decision_text.length > 80 ? d.decision_text.slice(0, 80) + '...' : d.decision_text,
      snippet: d.rationale ?? undefined,
    });
  }

  for (const q of questions) {
    items.push({
      id: q.id,
      date: q.created_at,
      type: 'question',
      title: q.question_text.length > 80 ? q.question_text.slice(0, 80) + '...' : q.question_text,
      status: q.status,
    });
  }

  // Sort descending by date
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return items;
}
