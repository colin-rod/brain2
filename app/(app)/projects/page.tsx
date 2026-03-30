import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { FolderOpen } from 'lucide-react';
import type { Project } from '@/types/database';

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('projects').select('*').order('name');

  const projects = (data ?? []) as Project[];

  return (
    <div className="space-y-north-lg">
      <PageHeader title="Projects" description="Projects referenced across your notes." />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Projects appear here after you save notes that reference them."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-north-sm">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-lg border border-border bg-surface px-north-base py-north-md hover:bg-surface-subtle transition-colors"
            >
              <p className="text-issue-title">{project.name}</p>
              {project.status && (
                <p className="text-metadata text-foreground-muted mt-0.5">{project.status}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
