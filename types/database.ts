/* ============================================================
   Database row types — match Supabase schema exactly
   ============================================================ */

export type CaptureSourceType = 'image' | 'text' | 'chat_transcript' | 'voice' | 'email';

export type CaptureStatus =
  | 'new'
  | 'processing'
  | 'ocr_complete'
  | 'parsed'
  | 'in_review'
  | 'saved'
  | 'failed';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'canceled';

export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type QuestionStatus = 'open' | 'resolved';

export type IdeaStatus = 'raw' | 'developing' | 'accepted' | 'rejected' | 'archived';

export interface Profile {
  id: string;
  created_at: string;
  email: string | null;
  full_name: string | null;
}

export interface Capture {
  id: string;
  user_id: string;
  source_type: CaptureSourceType;
  source_app: string | null;
  raw_text: string | null;
  file_path: string | null;
  ocr_text: string | null;
  parsed_json: ParsedNoteJson | null;
  status: CaptureStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  capture_id: string;
  title: string;
  summary: string | null;
  cleaned_text: string | null;
  markdown_path: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteWithMeta extends Note {
  projects: { id: string; name: string }[];
  people: { id: string; name: string }[];
  domains: { id: string; name: string }[];
  tasks: { id: string; title: string; status: TaskStatus }[];
  decisions: { id: string; decision_text: string }[];
  questions: { id: string; question_text: string }[];
  question_count: number;
}

export interface Task {
  id: string;
  user_id: string;
  note_id: string | null;
  title: string;
  status: TaskStatus;
  priority: TaskPriority | null;
  due_date: string | null;
  actionee_id: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  role: string | null;
  organization: string | null;
  notes: string | null;
  compiled_summary: string | null;
  summary_generated_at: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  status: string | null;
  notes: string | null;
  compiled_summary: string | null;
  summary_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Decision {
  id: string;
  user_id: string;
  note_id: string | null;
  decision_text: string;
  rationale: string | null;
  decision_date: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpenQuestion {
  id: string;
  user_id: string;
  note_id: string;
  question_text: string;
  status: QuestionStatus;
  created_at: string;
  updated_at: string;
}

export interface NotePerson {
  note_id: string;
  person_id: string;
}

export interface NoteProject {
  note_id: string;
  project_id: string;
}

export interface ProjectPerson {
  project_id: string;
  person_id: string;
}

export interface DecisionPerson {
  decision_id: string;
  person_id: string;
}

export interface Domain {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  compiled_summary: string | null;
  summary_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteDomain {
  note_id: string;
  domain_id: string;
}

export interface NoteNote {
  id: string;
  note_id: string;
  linked_note_id: string;
  user_id: string;
  created_at: string;
}

export type PersonListRow = Person & {
  project_people: { projects: { id: string; name: string } }[];
  note_count: number;
  open_task_count: number;
  open_question_count: number;
  last_activity: string | null;
};

export type ProjectListRow = Project & {
  project_people: { people: { id: string; name: string } }[];
  note_count: number;
  open_task_count: number;
  open_question_count: number;
  last_activity: string | null;
};

export type DomainListRow = Domain & {
  note_count: number;
  open_question_count: number;
  last_activity: string | null;
};

export interface Idea {
  id: string;
  user_id: string;
  note_id: string | null;
  idea_text: string;
  status: IdeaStatus;
  created_at: string;
  updated_at: string;
}

/* JSON shape stored in captures.parsed_json */
export interface ParsedNoteJson {
  title: string;
  summary: string;
  cleaned_text: string;
  tasks: {
    title: string;
    due_date: string | null;
    priority: TaskPriority | null;
    actionee_name: string | null;
  }[];
  people: {
    name: string;
    role: string | null;
    organization: string | null;
  }[];
  projects: {
    name: string;
  }[];
  domains: {
    name: string;
    description: string | null;
  }[];
  decisions: {
    decision_text: string;
    rationale: string | null;
    decision_date: string | null;
  }[];
  open_questions: {
    question_text: string;
  }[];
  ideas: {
    idea_text: string;
  }[];
}
