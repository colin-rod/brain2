-- ============================================================
-- 004: Standalone entities & cross-entity linking
-- ============================================================
-- Enables standalone task/decision creation (nullable note_id),
-- direct project linking on tasks/decisions, and
-- project_people / decision_people junction tables.
-- ============================================================

-- 1a. Make note_id nullable on tasks (allow standalone tasks)
ALTER TABLE public.tasks ALTER COLUMN note_id DROP NOT NULL;
ALTER TABLE public.tasks DROP CONSTRAINT tasks_note_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_note_id_fkey
  FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE SET NULL;

-- 1b. Make note_id nullable on decisions (allow standalone decisions)
ALTER TABLE public.decisions ALTER COLUMN note_id DROP NOT NULL;
ALTER TABLE public.decisions DROP CONSTRAINT decisions_note_id_fkey;
ALTER TABLE public.decisions ADD CONSTRAINT decisions_note_id_fkey
  FOREIGN KEY (note_id) REFERENCES public.notes(id) ON DELETE SET NULL;

-- 1c. Add project_id FK to tasks
ALTER TABLE public.tasks ADD COLUMN project_id uuid
  REFERENCES public.projects(id) ON DELETE SET NULL;
CREATE INDEX idx_tasks_project ON public.tasks (project_id);

-- 1d. Add project_id FK to decisions
ALTER TABLE public.decisions ADD COLUMN project_id uuid
  REFERENCES public.projects(id) ON DELETE SET NULL;
CREATE INDEX idx_decisions_project ON public.decisions (project_id);

-- 1e. project_people junction table
CREATE TABLE public.project_people (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, person_id)
);

ALTER TABLE public.project_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own project_people"
  ON public.project_people FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_people.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own project_people"
  ON public.project_people FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_people.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own project_people"
  ON public.project_people FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_people.project_id AND projects.user_id = auth.uid()
  ));

-- 1f. decision_people junction table
CREATE TABLE public.decision_people (
  decision_id uuid NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  PRIMARY KEY (decision_id, person_id)
);

ALTER TABLE public.decision_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own decision_people"
  ON public.decision_people FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.decisions
    WHERE decisions.id = decision_people.decision_id AND decisions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own decision_people"
  ON public.decision_people FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.decisions
    WHERE decisions.id = decision_people.decision_id AND decisions.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own decision_people"
  ON public.decision_people FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.decisions
    WHERE decisions.id = decision_people.decision_id AND decisions.user_id = auth.uid()
  ));
