import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchProjectWikiData } from '@/lib/actions/wiki';
import { ProjectWikiClient } from '@/components/projects/project-wiki-client';
import { PageHeader } from '@/components/shared/page-header';
import { ArrowLeft } from 'lucide-react';

interface ProjectDetailPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params;
  const data = await fetchProjectWikiData(projectId);

  if (!data) notFound();

  return (
    <div className="space-y-north-lg">
      <div className="flex items-center gap-north-sm">
        <Link
          href="/projects"
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader title={data.project.name} />
      </div>

      {data.project.status && (
        <p className="text-body text-foreground-secondary">Status: {data.project.status}</p>
      )}

      <ProjectWikiClient data={data} />
    </div>
  );
}
