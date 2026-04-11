import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  TaskDraft,
  PersonDraft,
  ProjectDraft,
  DomainDraft,
  DecisionDraft,
  QuestionDraft,
  IdeaDraft,
} from '@/types/domain';
import type { ParsedNoteJson } from '@/types/database';

interface ReviewState {
  captureId: string | null;
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

  // Actions
  initFromParsed: (captureId: string, parsed: ParsedNoteJson) => void;
  reset: () => void;

  setTitle: (title: string) => void;
  setSummary: (summary: string) => void;
  setCleanedText: (text: string) => void;

  // Tasks
  updateTask: (id: string, updates: Partial<TaskDraft>) => void;
  addTask: () => void;
  removeTask: (id: string) => void;

  // People
  updatePerson: (id: string, updates: Partial<PersonDraft>) => void;
  addPerson: () => void;
  removePerson: (id: string) => void;

  // Projects
  updateProject: (id: string, updates: Partial<ProjectDraft>) => void;
  addProject: () => void;
  removeProject: (id: string) => void;

  // Domains
  updateDomain: (id: string, updates: Partial<DomainDraft>) => void;
  addDomain: () => void;
  removeDomain: (id: string) => void;

  // Decisions
  updateDecision: (id: string, updates: Partial<DecisionDraft>) => void;
  addDecision: () => void;
  removeDecision: (id: string) => void;

  // Questions
  updateQuestion: (id: string, updates: Partial<QuestionDraft>) => void;
  addQuestion: () => void;
  removeQuestion: (id: string) => void;

  // Ideas
  updateIdea: (id: string, updates: Partial<IdeaDraft>) => void;
  addIdea: () => void;
  removeIdea: (id: string) => void;
}

function uid(): string {
  return crypto.randomUUID();
}

const emptyState = {
  captureId: null as string | null,
  title: '',
  summary: '',
  cleaned_text: '',
  tasks: [] as TaskDraft[],
  people: [] as PersonDraft[],
  projects: [] as ProjectDraft[],
  domains: [] as DomainDraft[],
  decisions: [] as DecisionDraft[],
  open_questions: [] as QuestionDraft[],
  ideas: [] as IdeaDraft[],
};

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
      ...emptyState,

      initFromParsed: (captureId, parsed) => {
        const people = parsed.people.map((p) => ({
          ...p,
          id: uid(),
          matchedPersonId: null,
        }));

        const tasks = parsed.tasks.map((t) => {
          const actioneeName = t.actionee_name ?? null;
          // Auto-match actionee to a person draft by case-insensitive name
          const matched = actioneeName
            ? people.find((p) => p.name.toLowerCase() === actioneeName.toLowerCase())
            : null;
          return {
            ...t,
            id: uid(),
            actionee_name: actioneeName,
            actionee_person_id: matched?.id ?? null,
          };
        });

        set({
          captureId,
          title: parsed.title,
          summary: parsed.summary,
          cleaned_text: parsed.cleaned_text,
          tasks,
          people,
          projects: parsed.projects.map((p) => ({
            ...p,
            id: uid(),
            matchedProjectId: null,
          })),
          domains: (parsed.domains ?? []).map((d) => ({
            ...d,
            id: uid(),
            matchedDomainId: null,
          })),
          decisions: parsed.decisions.map((d) => ({ ...d, id: uid() })),
          open_questions: parsed.open_questions.map((q) => ({ ...q, id: uid() })),
          ideas: (parsed.ideas ?? []).map((i) => ({ ...i, id: uid(), status: 'raw' as const })),
        });
      },

      reset: () => set(emptyState),

      setTitle: (title) => set({ title }),
      setSummary: (summary) => set({ summary }),
      setCleanedText: (cleaned_text) => set({ cleaned_text }),

      // Tasks
      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      addTask: () =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              id: uid(),
              title: '',
              due_date: null,
              priority: null,
              actionee_name: null,
              actionee_person_id: null,
            },
          ],
        })),
      removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      // People
      updatePerson: (id, updates) =>
        set((s) => ({
          people: s.people.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      addPerson: () =>
        set((s) => ({
          people: [...s.people, { id: uid(), name: '', role: null, matchedPersonId: null }],
        })),
      removePerson: (id) =>
        set((s) => ({
          people: s.people.filter((p) => p.id !== id),
          // Clear actionee on any task referencing the removed person
          tasks: s.tasks.map((t) =>
            t.actionee_person_id === id
              ? { ...t, actionee_person_id: null, actionee_name: null }
              : t,
          ),
        })),

      // Projects
      updateProject: (id, updates) =>
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      addProject: () =>
        set((s) => ({
          projects: [...s.projects, { id: uid(), name: '', matchedProjectId: null }],
        })),
      removeProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      // Domains
      updateDomain: (id, updates) =>
        set((s) => ({
          domains: s.domains.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),
      addDomain: () =>
        set((s) => ({
          domains: [
            ...s.domains,
            { id: uid(), name: '', description: null, matchedDomainId: null },
          ],
        })),
      removeDomain: (id) => set((s) => ({ domains: s.domains.filter((d) => d.id !== id) })),

      // Decisions
      updateDecision: (id, updates) =>
        set((s) => ({
          decisions: s.decisions.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),
      addDecision: () =>
        set((s) => ({
          decisions: [
            ...s.decisions,
            { id: uid(), decision_text: '', rationale: null, decision_date: null },
          ],
        })),
      removeDecision: (id) => set((s) => ({ decisions: s.decisions.filter((d) => d.id !== id) })),

      // Questions
      updateQuestion: (id, updates) =>
        set((s) => ({
          open_questions: s.open_questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
        })),
      addQuestion: () =>
        set((s) => ({
          open_questions: [...s.open_questions, { id: uid(), question_text: '' }],
        })),
      removeQuestion: (id) =>
        set((s) => ({
          open_questions: s.open_questions.filter((q) => q.id !== id),
        })),

      // Ideas
      updateIdea: (id, updates) =>
        set((s) => ({
          ideas: s.ideas.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),
      addIdea: () =>
        set((s) => ({
          ideas: [...s.ideas, { id: uid(), idea_text: '', status: 'raw' as const }],
        })),
      removeIdea: (id) => set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) })),
    }),
    {
      name: 'brain2-review-draft',
    },
  ),
);
