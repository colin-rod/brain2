'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { EntityCombobox } from './entity-combobox';
import { FolderOpen, X } from 'lucide-react';
import { linkProject, unlinkProject, createAndLinkProject } from '@/lib/actions/note-mutations';
import { EditorSectionHeader } from '@/components/shared/editor-section-header';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';
import type { Project } from '@/types/database';

interface NoteProjectsSectionProps {
  noteId: string;
  projects: Project[];
  allProjects: Project[];
  onMutate: () => void;
}

export function NoteProjectsSection({
  noteId,
  projects,
  allProjects,
  onMutate,
}: NoteProjectsSectionProps) {
  const [showCombobox, setShowCombobox] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSelect(item: { id: string; name: string }) {
    startTransition(async () => {
      const result = await linkProject(noteId, item.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        onMutate();
      }
      setShowCombobox(false);
    });
  }

  function handleCreate(name: string) {
    startTransition(async () => {
      const result = await createAndLinkProject(noteId, { name });
      if (result.error) {
        toast.error(result.error);
      } else {
        onMutate();
      }
      setShowCombobox(false);
    });
  }

  function handleUnlink(projectId: string) {
    startTransition(async () => {
      const result = await unlinkProject(noteId, projectId);
      if (result.error) {
        toast.error(result.error);
      } else {
        onMutate();
      }
    });
  }

  const linkedIds = projects.map((p) => p.id);

  return (
    <>
      <Separator />
      <div>
        <EditorSectionHeader
          title="Projects"
          onAdd={() => setShowCombobox(true)}
          icon={FolderOpen}
          count={projects.length}
        />
        <div className="flex flex-wrap gap-north-sm">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group rounded-md border border-border bg-surface px-north-md py-north-sm flex items-center gap-north-sm"
            >
              <p className="text-body font-medium">{project.name}</p>
              <button
                type="button"
                onClick={() => handleUnlink(project.id)}
                disabled={isPending}
                className="opacity-0 group-hover:opacity-100 text-foreground-muted hover:text-destructive transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        {showCombobox && (
          <div className="mt-north-sm w-full max-w-xs">
            <EntityCombobox
              items={allProjects.map((p) => ({ id: p.id, name: p.name }))}
              excludeIds={linkedIds}
              onSelect={handleSelect}
              onCreate={handleCreate}
              onClose={() => setShowCombobox(false)}
              placeholder="Search projects..."
            />
          </div>
        )}
        {projects.length === 0 && !showCombobox && (
          <EditorEmptyMessage message="No projects linked." />
        )}
      </div>
    </>
  );
}
