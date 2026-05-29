-- merge_projects: atomically merges source projects into target
CREATE OR REPLACE FUNCTION public.merge_projects(
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

  SELECT user_id INTO target_owner FROM public.projects WHERE id = target_id;
  IF target_owner IS NULL OR target_owner <> caller THEN
    RAISE EXCEPTION 'Target project not found or not owned by caller';
  END IF;

  SELECT count(*) INTO source_count
    FROM public.projects
    WHERE id = ANY(source_ids) AND user_id = caller;
  IF source_count <> array_length(source_ids, 1) THEN
    RAISE EXCEPTION 'One or more source projects not found or not owned by caller';
  END IF;

  -- Re-point note_projects
  INSERT INTO public.note_projects (note_id, project_id)
    SELECT DISTINCT np.note_id, target_id
    FROM public.note_projects np
    WHERE np.project_id = ANY(source_ids)
  ON CONFLICT (note_id, project_id) DO NOTHING;
  DELETE FROM public.note_projects WHERE project_id = ANY(source_ids);

  -- Re-point project_people
  INSERT INTO public.project_people (project_id, person_id)
    SELECT DISTINCT target_id, pp.person_id
    FROM public.project_people pp
    WHERE pp.project_id = ANY(source_ids)
  ON CONFLICT (project_id, person_id) DO NOTHING;
  DELETE FROM public.project_people WHERE project_id = ANY(source_ids);

  -- Re-point tasks (direct FK)
  UPDATE public.tasks SET project_id = target_id WHERE project_id = ANY(source_ids);

  -- Re-point decisions (direct FK)
  UPDATE public.decisions SET project_id = target_id WHERE project_id = ANY(source_ids);

  -- Invalidate stale compiled summary on target
  UPDATE public.projects
    SET compiled_summary = NULL, summary_generated_at = NULL
    WHERE id = target_id;

  DELETE FROM public.projects WHERE id = ANY(source_ids) AND user_id = caller;
END;
$$;

REVOKE ALL ON FUNCTION public.merge_projects(uuid, uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.merge_projects(uuid, uuid[]) TO authenticated;


-- merge_domains: atomically merges source domains into target
CREATE OR REPLACE FUNCTION public.merge_domains(
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

  SELECT user_id INTO target_owner FROM public.domains WHERE id = target_id;
  IF target_owner IS NULL OR target_owner <> caller THEN
    RAISE EXCEPTION 'Target domain not found or not owned by caller';
  END IF;

  SELECT count(*) INTO source_count
    FROM public.domains
    WHERE id = ANY(source_ids) AND user_id = caller;
  IF source_count <> array_length(source_ids, 1) THEN
    RAISE EXCEPTION 'One or more source domains not found or not owned by caller';
  END IF;

  -- Re-point note_domains
  INSERT INTO public.note_domains (note_id, domain_id)
    SELECT DISTINCT nd.note_id, target_id
    FROM public.note_domains nd
    WHERE nd.domain_id = ANY(source_ids)
  ON CONFLICT (note_id, domain_id) DO NOTHING;
  DELETE FROM public.note_domains WHERE domain_id = ANY(source_ids);

  -- Invalidate stale compiled summary on target
  UPDATE public.domains
    SET compiled_summary = NULL, summary_generated_at = NULL
    WHERE id = target_id;

  DELETE FROM public.domains WHERE id = ANY(source_ids) AND user_id = caller;
END;
$$;

REVOKE ALL ON FUNCTION public.merge_domains(uuid, uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.merge_domains(uuid, uuid[]) TO authenticated;
