import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchPersonWikiData } from '@/lib/actions/wiki';
import { PersonWikiClient } from '@/components/people/person-wiki-client';
import { PageHeader } from '@/components/shared/page-header';
import { ArrowLeft } from 'lucide-react';

interface PersonDetailPageProps {
  params: Promise<{ personId: string }>;
}

export default async function PersonDetailPage({ params }: PersonDetailPageProps) {
  const { personId } = await params;
  const data = await fetchPersonWikiData(personId);

  if (!data) notFound();

  return (
    <div className="space-y-north-lg">
      <div className="flex items-center gap-north-sm">
        <Link
          href="/people"
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader title={data.person.name} />
      </div>

      {(data.person.role || data.person.organization) && (
        <p className="text-body text-foreground-secondary">
          {[data.person.role, data.person.organization].filter(Boolean).join(' · ')}
        </p>
      )}

      <PersonWikiClient data={data} />
    </div>
  );
}
