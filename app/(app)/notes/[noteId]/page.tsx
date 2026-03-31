import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NoteDetailClient } from '@/components/notes/note-detail-client';
import type { Note, Task, Person, Project, Decision, OpenQuestion } from '@/types/database';

interface NoteDetailPageProps {
  params: Promise<{ noteId: string }>;
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { noteId } = await params;
  const supabase = await createClient();

  const { data: note, error } = await supabase.from('notes').select('*').eq('id', noteId).single();

  if (error || !note) notFound();

  const typedNote = note as Note;

  // Load all linked entities + all people/projects for combobox search
  const [
    tasksRes,
    peopleRes,
    projectsRes,
    decisionsRes,
    questionsRes,
    allPeopleRes,
    allProjectsRes,
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('note_id', noteId).order('created_at'),
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
    supabase.from('decisions').select('*').eq('note_id', noteId).order('created_at'),
    supabase.from('open_questions').select('*').eq('note_id', noteId).order('created_at'),
    supabase.from('people').select('*').order('name'),
    supabase.from('projects').select('*').order('name'),
  ]);

  const tasks = (tasksRes.data ?? []) as Task[];
  const people = (peopleRes.data ?? []) as Person[];
  const projects = (projectsRes.data ?? []) as Project[];
  const decisions = (decisionsRes.data ?? []) as Decision[];
  const questions = (questionsRes.data ?? []) as OpenQuestion[];
  const allPeople = (allPeopleRes.data ?? []) as Person[];
  const allProjects = (allProjectsRes.data ?? []) as Project[];

  return (
    <NoteDetailClient
      note={typedNote}
      tasks={tasks}
      people={people}
      projects={projects}
      decisions={decisions}
      questions={questions}
      allPeople={allPeople}
      allProjects={allProjects}
    />
  );
}
