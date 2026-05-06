import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchDomainWikiData } from '@/lib/actions/wiki';
import { DomainWikiClient } from '@/components/domains/domain-wiki-client';
import { PageHeader } from '@/components/shared/page-header';
import { ArrowLeft } from 'lucide-react';

interface DomainDetailPageProps {
  params: Promise<{ domainId: string }>;
}

export default async function DomainDetailPage({ params }: DomainDetailPageProps) {
  const { domainId } = await params;
  const data = await fetchDomainWikiData(domainId);

  if (!data) notFound();

  return (
    <div className="space-y-north-lg">
      <div className="flex items-center gap-north-sm">
        <Link
          href="/domains"
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader title={data.domain.name} />
      </div>

      {data.domain.description && (
        <p className="text-body text-foreground-secondary">{data.domain.description}</p>
      )}

      <DomainWikiClient data={data} />
    </div>
  );
}
