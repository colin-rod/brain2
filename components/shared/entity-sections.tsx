import Link from 'next/link';
import { TaskStatusBadge } from '@/components/shared/status-badge';
import { EditorItemCard } from '@/components/shared/editor-item-card';
import { formatDate } from '@/lib/format-date';
import { CheckSquare, FileText, FolderOpen, Scale, HelpCircle, Users, Layers } from 'lucide-react';
import type { Task, Decision, OpenQuestion } from '@/types/database';

interface EntitySectionsProps {
  assignedTasks?: (Task & { notes: { id: string; title: string } | null })[];
  tasks?: Task[];
  decisions?:
    | Decision[]
    | {
        id: string;
        decision_text: string;
        rationale: string | null;
        decision_date: string | null;
      }[];
  openQuestions?: OpenQuestion[];
  linkedPeople?: { id: string; name: string; role: string | null; organization?: string | null }[];
  linkedProjects?: { id: string; name: string; status: string | null }[];
  linkedDomains?: { id: string; name: string }[];
  notes?: { id: string; title: string; created_at: string }[];
  peopleSection?: React.ReactNode;
}

export function EntitySections({
  assignedTasks,
  tasks,
  decisions,
  openQuestions,
  linkedPeople,
  linkedProjects,
  linkedDomains,
  notes,
  peopleSection,
}: EntitySectionsProps) {
  return (
    <div className="space-y-north-lg">
      {/* People section (custom component for projects, or links for person) */}
      {peopleSection && (
        <div>
          <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
            <Users className="h-4 w-4" />
            People ({linkedPeople?.length ?? 0})
          </h2>
          {peopleSection}
        </div>
      )}

      {linkedPeople && !peopleSection && linkedPeople.length > 0 && (
        <div>
          <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
            <Users className="h-4 w-4" />
            People ({linkedPeople.length})
          </h2>
          <div className="space-y-north-xs">
            {linkedPeople.map((person) => (
              <Link
                key={person.id}
                href={`/people/${person.id}`}
                className="block rounded-md border border-border bg-surface px-north-md py-north-sm hover:bg-surface-subtle transition-colors"
              >
                <p className="text-body font-medium">{person.name}</p>
                {(person.role || person.organization) && (
                  <p className="text-metadata text-foreground-muted">
                    {[person.role, person.organization].filter(Boolean).join(' · ')}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Tasks (person pages — tasks with source note) */}
      {assignedTasks && assignedTasks.length > 0 && (
        <div>
          <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
            <CheckSquare className="h-4 w-4" />
            Assigned Tasks ({assignedTasks.length})
          </h2>
          <div className="space-y-north-xs">
            {assignedTasks.map((task) => (
              <EditorItemCard key={task.id} className="flex items-center justify-between">
                <div>
                  <p className="text-body">{task.title}</p>
                  {task.notes && (
                    <Link
                      href={`/notes/${task.notes.id}`}
                      className="text-metadata text-primary hover:underline"
                    >
                      {task.notes.title}
                    </Link>
                  )}
                </div>
                <TaskStatusBadge status={task.status} />
              </EditorItemCard>
            ))}
          </div>
        </div>
      )}

      {/* Tasks (project pages — all tasks merged) */}
      {tasks && tasks.length > 0 && (
        <div>
          <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
            <CheckSquare className="h-4 w-4" />
            Tasks ({tasks.length})
          </h2>
          <div className="space-y-north-xs">
            {tasks.map((task) => (
              <EditorItemCard key={task.id} className="flex items-center justify-between">
                <p className="text-body">{task.title}</p>
                <TaskStatusBadge status={task.status} />
              </EditorItemCard>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {linkedProjects && linkedProjects.length > 0 && (
        <div>
          <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
            <FolderOpen className="h-4 w-4" />
            Projects ({linkedProjects.length})
          </h2>
          <div className="space-y-north-xs">
            {linkedProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-md border border-border bg-surface px-north-md py-north-sm hover:bg-surface-subtle transition-colors"
              >
                <p className="text-body font-medium">{project.name}</p>
                {project.status && (
                  <p className="text-metadata text-foreground-muted">{project.status}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Decisions */}
      {decisions && decisions.length > 0 && (
        <div>
          <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
            <Scale className="h-4 w-4" />
            Decisions ({decisions.length})
          </h2>
          <div className="space-y-north-sm">
            {decisions.map((d) => (
              <EditorItemCard key={d.id}>
                <p className="text-body">{d.decision_text}</p>
                {d.rationale && (
                  <p className="text-metadata text-foreground-secondary mt-north-xs">
                    Rationale: {d.rationale}
                  </p>
                )}
                {d.decision_date && (
                  <p className="text-metadata text-foreground-muted mt-north-xs">
                    {formatDate(d.decision_date)}
                  </p>
                )}
              </EditorItemCard>
            ))}
          </div>
        </div>
      )}

      {/* Open Questions */}
      {openQuestions && openQuestions.length > 0 && (
        <div>
          <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
            <HelpCircle className="h-4 w-4" />
            Open Questions ({openQuestions.length})
          </h2>
          <div className="space-y-north-xs">
            {openQuestions.map((q) => (
              <EditorItemCard key={q.id}>
                <p
                  className={`text-body ${q.status === 'resolved' ? 'line-through text-foreground-muted' : ''}`}
                >
                  {q.question_text}
                </p>
              </EditorItemCard>
            ))}
          </div>
        </div>
      )}

      {/* Domains */}
      {linkedDomains && linkedDomains.length > 0 && (
        <div>
          <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
            <Layers className="h-4 w-4" />
            Domains ({linkedDomains.length})
          </h2>
          <div className="flex flex-wrap gap-north-xs">
            {linkedDomains.map((domain) => (
              <span
                key={domain.id}
                className="rounded-md border border-border bg-surface px-north-md py-north-xs text-metadata"
              >
                {domain.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Linked Notes */}
      {notes && notes.length > 0 && (
        <div>
          <h2 className="text-section-header mb-north-md flex items-center gap-north-sm">
            <FileText className="h-4 w-4" />
            Linked Notes ({notes.length})
          </h2>
          <div className="space-y-north-xs">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="block rounded-md border border-border bg-surface px-north-md py-north-sm hover:bg-surface-subtle transition-colors"
              >
                <p className="text-body font-medium">{note.title}</p>
                <p className="text-metadata text-foreground-muted">{formatDate(note.created_at)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
