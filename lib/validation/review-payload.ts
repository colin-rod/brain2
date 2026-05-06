import type { ReviewPayload } from '@/types/domain';

export interface ValidationError {
  field: string;
  message: string;
}

export function validateReviewPayload(payload: ReviewPayload): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!payload.captureId) {
    errors.push({ field: 'captureId', message: 'Capture ID is required' });
  }

  if (!payload.title.trim()) {
    errors.push({ field: 'title', message: 'Title is required' });
  }

  const peopleIds = new Set(payload.people.map((p) => p.id));
  for (let i = 0; i < payload.tasks.length; i++) {
    if (!payload.tasks[i].title.trim()) {
      errors.push({ field: `tasks[${i}].title`, message: `Task ${i + 1} needs a title` });
    }
    if (
      payload.tasks[i].actionee_person_id &&
      !peopleIds.has(payload.tasks[i].actionee_person_id!)
    ) {
      errors.push({
        field: `tasks[${i}].actionee_person_id`,
        message: `Task ${i + 1} actionee does not match any person in this note`,
      });
    }
  }

  for (let i = 0; i < payload.people.length; i++) {
    if (!payload.people[i].name.trim()) {
      errors.push({ field: `people[${i}].name`, message: `Person ${i + 1} needs a name` });
    }
  }

  for (let i = 0; i < payload.projects.length; i++) {
    if (!payload.projects[i].name.trim()) {
      errors.push({ field: `projects[${i}].name`, message: `Project ${i + 1} needs a name` });
    }
  }

  for (let i = 0; i < payload.domains.length; i++) {
    if (!payload.domains[i].name.trim()) {
      errors.push({ field: `domains[${i}].name`, message: `Domain ${i + 1} needs a name` });
    }
  }

  for (let i = 0; i < payload.decisions.length; i++) {
    if (!payload.decisions[i].decision_text.trim()) {
      errors.push({
        field: `decisions[${i}].decision_text`,
        message: `Decision ${i + 1} needs text`,
      });
    }
  }

  for (let i = 0; i < payload.open_questions.length; i++) {
    if (!payload.open_questions[i].question_text.trim()) {
      errors.push({
        field: `open_questions[${i}].question_text`,
        message: `Question ${i + 1} needs text`,
      });
    }
  }

  for (let i = 0; i < payload.ideas.length; i++) {
    if (!payload.ideas[i].idea_text.trim()) {
      errors.push({
        field: `ideas[${i}].idea_text`,
        message: `Idea ${i + 1} needs text`,
      });
    }
  }

  return errors;
}
