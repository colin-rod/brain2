/* ============================================================
   Database row types — match Supabase schema exactly
   ============================================================ */

export type CaptureSourceType = 'image' | 'text' | 'chat_transcript';

export type CaptureStatus =
  | 'new'
  | 'processing'
  | 'ocr_complete'
  | 'parsed'
  | 'in_review'
  | 'saved'
  | 'failed';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'canceled';

export type TaskPriority = 'high' | 'medium' | 'low';

export type QuestionStatus = 'open' | 'resolved';

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
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  note_id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  role: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Decision {
  id: string;
  user_id: string;
  note_id: string;
  decision_text: string;
  rationale: string | null;
  decision_date: string | null;
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

/* JSON shape stored in captures.parsed_json */
export interface ParsedNoteJson {
  title: string;
  summary: string;
  cleaned_text: string;
  tasks: {
    title: string;
    due_date: string | null;
    priority: TaskPriority | null;
  }[];
  people: {
    name: string;
    role: string | null;
  }[];
  projects: {
    name: string;
  }[];
  decisions: {
    decision_text: string;
    rationale: string | null;
    decision_date: string | null;
  }[];
  open_questions: {
    question_text: string;
  }[];
}
