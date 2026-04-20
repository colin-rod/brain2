import type { IdeaStatus, TaskPriority } from './database';

/* ============================================================
   Domain types — used in the review flow and parser
   ============================================================ */

export type ParseMode = 'meeting_note' | 'plain_text_note' | 'chat_transcript';

/** Output shape from the parser provider */
export interface ParsedNote {
  title: string;
  summary: string;
  cleaned_text: string;
  tasks: TaskDraft[];
  people: PersonDraft[];
  projects: ProjectDraft[];
  domains: DomainDraft[];
  decisions: DecisionDraft[];
  open_questions: QuestionDraft[];
  ideas: IdeaDraft[];
}

export interface TaskDraft {
  id: string; // client-generated for keying
  title: string;
  due_date: string | null;
  priority: TaskPriority | null;
  actionee_name: string | null;
  /** Draft person ID selected during review — resolved to real DB ID at save time */
  actionee_person_id: string | null;
}

export interface PersonDraft {
  id: string;
  name: string;
  role: string | null;
  /** If set, link to this existing person instead of creating new */
  matchedPersonId: string | null;
}

export interface ProjectDraft {
  id: string;
  name: string;
  /** If set, link to this existing project instead of creating new */
  matchedProjectId: string | null;
}

export interface DomainDraft {
  id: string;
  name: string;
  description: string | null;
  /** If set, link to this existing domain instead of creating new */
  matchedDomainId: string | null;
}

export interface DecisionDraft {
  id: string;
  decision_text: string;
  rationale: string | null;
  decision_date: string | null;
}

export interface QuestionDraft {
  id: string;
  question_text: string;
}

export interface IdeaDraft {
  id: string;
  idea_text: string;
  status: IdeaStatus;
}

/** AI-suggested note link with similarity score */
export interface SuggestedNoteLink {
  id: string;
  title: string;
  summary: string | null;
  similarity: number;
}

/** Payload sent from review page to the save action */
export interface ReviewPayload {
  captureId: string;
  title: string;
  summary: string;
  cleaned_text: string;
  tasks: TaskDraft[];
  people: PersonDraft[];
  projects: ProjectDraft[];
  domains: DomainDraft[];
  decisions: DecisionDraft[];
  open_questions: QuestionDraft[];
  ideas: IdeaDraft[];
  /** Note IDs approved for linking during review */
  approvedNoteLinkIds: string[];
}
