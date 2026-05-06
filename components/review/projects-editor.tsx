'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';
import { EditorItemCard } from '@/components/shared/editor-item-card';

export function ProjectsEditor() {
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
          </EditorItemCard>
        ))}
      </div>
    </div>
  );
}
