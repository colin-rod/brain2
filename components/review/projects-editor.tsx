'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';
import { EditorItemCard } from '@/components/shared/editor-item-card';
import type { Project } from '@/types/database';

interface ProjectsEditorProps {
  existingProjects: Pick<Project, 'id' | 'name'>[];
}

export function ProjectsEditor({ existingProjects }: ProjectsEditorProps) {
  const projects = useReviewStore((s) => s.projects);
  const updateProject = useReviewStore((s) => s.updateProject);
  const removeProject = useReviewStore((s) => s.removeProject);

  return (
    <div className="space-y-north-sm">
      {projects.length === 0 && <EditorEmptyMessage message="No projects in view." />}

      <div className="space-y-north-xs">
        {projects.map((project) => (
          <EditorItemCard key={project.id} className="animate-scale-in">
            <div className="flex items-center gap-north-sm">
              <Input
                aria-label="Project name"
                value={project.name}
                onChange={(e) => updateProject(project.id, { name: e.target.value })}
                placeholder="Project name"
                maxLength={200}
                className="flex-1"
                disabled={!!project.matchedProjectId}
              />
              <Button
                variant="ghost"
                size="sm"
                aria-label="Remove project"
                onClick={() => removeProject(project.id)}
                className="shrink-0 h-11 w-11 lg:h-8 lg:w-8 text-foreground-muted hover:text-destructive"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            {existingProjects.length > 0 && (
              <div className="flex items-center gap-north-sm">
                <p className="text-metadata text-foreground-muted shrink-0">Link to existing</p>
                <Select
                  value={project.matchedProjectId ?? 'new'}
                  onValueChange={(v) =>
                    updateProject(project.id, { matchedProjectId: v === 'new' ? null : v })
                  }
                >
                  <SelectTrigger size="sm" aria-label="Link to existing project">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Create new</SelectItem>
                    {existingProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </EditorItemCard>
        ))}
      </div>
    </div>
  );
}
