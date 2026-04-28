-- ============================================================
-- 013: Pinned people + merge_people RPC
-- ============================================================
-- Adds a pinned flag for surfacing key people at the top of the
-- People list, and an atomic merge function that re-points all
-- relations from source people onto a target person before
-- deleting the sources. The function runs as SECURITY DEFINER
-- but enforces ownership against auth.uid() inside the body.
-- ============================================================

-- 1. pinned column + partial index
ALTER TABLE public.people ADD COLUMN pinned boolean NOT NULL DEFAULT false;

CREATE INDEX idx_people_pinned ON public.people (user_id)
  WHERE pinned = true;

-- 2. merge_people: atomically merge sources into target
CREATE OR REPLACE FUNCTION public.merge_people(
  target_id uuid,
  source_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  target_owner uuid;
  source_count int;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF target_id = ANY(source_ids) THEN
    RAISE EXCEPTION 'Target cannot also be a source';
  END IF;

  -- Verify target belongs to caller
  SELECT user_id INTO target_owner FROM public.people WHERE id = target_id;
  IF target_owner IS NULL THEN
    RAISE EXCEPTION 'Target person not found';
  END IF;
  IF target_owner <> caller THEN
    RAISE EXCEPTION 'Target person does not belong to caller';
  END IF;

  -- Verify every source belongs to caller
  SELECT count(*) INTO source_count
  FROM public.people
  WHERE id = ANY(source_ids) AND user_id = caller;

  IF source_count <> array_length(source_ids, 1) THEN
    RAISE EXCEPTION 'One or more source people not found or not owned by caller';
  END IF;

  -- Re-point tasks.actionee_id
  UPDATE public.tasks
    SET actionee_id = target_id
    WHERE actionee_id = ANY(source_ids);

  -- note_people: insert (note_id, target_id) for any note linked to a source
  -- but not already linked to target; then delete source rows.
  INSERT INTO public.note_people (note_id, person_id)
    SELECT DISTINCT np.note_id, target_id
    FROM public.note_people np
    WHERE np.person_id = ANY(source_ids)
  ON CONFLICT (note_id, person_id) DO NOTHING;

  DELETE FROM public.note_people WHERE person_id = ANY(source_ids);

  -- project_people
  INSERT INTO public.project_people (project_id, person_id)
    SELECT DISTINCT pp.project_id, target_id
    FROM public.project_people pp
    WHERE pp.person_id = ANY(source_ids)
  ON CONFLICT (project_id, person_id) DO NOTHING;

  DELETE FROM public.project_people WHERE person_id = ANY(source_ids);

  -- decision_people
  INSERT INTO public.decision_people (decision_id, person_id)
    SELECT DISTINCT dp.decision_id, target_id
    FROM public.decision_people dp
    WHERE dp.person_id = ANY(source_ids)
  ON CONFLICT (decision_id, person_id) DO NOTHING;

  DELETE FROM public.decision_people WHERE person_id = ANY(source_ids);

  -- Finally remove source people; cascades clear any straggler junction rows
  DELETE FROM public.people
    WHERE id = ANY(source_ids) AND user_id = caller;
END;
$$;

REVOKE ALL ON FUNCTION public.merge_people(uuid, uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.merge_people(uuid, uuid[]) TO authenticated;
