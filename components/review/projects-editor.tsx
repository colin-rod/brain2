'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';

export function ProjectsEditor() {
  const projects = useReviewStore((s) => s.projects);
  const updateProject = useReviewStore((s) => s.updateProject);
  const addProject = useReviewStore((s) => s.addProject);
  const removeProject = useReviewStore((s) => s.removeProject);

  return (
    <div className="space-y-north-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-section-header">Projects</h3>
        <Button variant="ghost" size="sm" onClick={addProject} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {projects.length === 0 && (
        <p className="text-metadata text-foreground-muted py-north-sm">No projects extracted.</p>
      )}

      <div className="space-y-north-xs">
        {projects.map((project) => (
          <div key={project.id} className="flex items-center gap-north-sm">
            <Input
              value={project.name}
              onChange={(e) => updateProject(project.id, { name: e.target.value })}
              placeholder="Project name"
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
