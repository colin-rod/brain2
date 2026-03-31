-- Add actionee (assignee) to tasks, referencing people table
ALTER TABLE public.tasks
  ADD COLUMN actionee_id uuid REFERENCES public.people(id) ON DELETE SET NULL;

CREATE INDEX idx_tasks_actionee ON public.tasks (actionee_id);
