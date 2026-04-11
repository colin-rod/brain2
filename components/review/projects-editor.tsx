'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';

export function ProjectsEditor() {
  const projects = useReviewStore((s) => s.projects);
  const updateProject = useReviewStore((s) => s.updateProject);
  const removeProject = useReviewStore((s) => s.removeProject);

  return (
    <div className="space-y-north-sm">
      {projects.length === 0 && <EditorEmptyMessage message="No projects in view." />}

      <div className="space-y-north-xs">
        {projects.map((project) => (
          <div key={project.id} className="flex items-center gap-north-sm animate-scale-in">
            <Input
              aria-label="Project name"
              value={project.name}
              onChange={(e) => updateProject(project.id, { name: e.target.value })}
              placeholder="Project name"
              maxLength={200}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeProject(project.id)}
              className="shrink-0 text-foreground-muted hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
