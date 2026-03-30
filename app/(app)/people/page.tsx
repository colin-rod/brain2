import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Users } from 'lucide-react';
import type { Person } from '@/types/database';

export default async function PeoplePage() {
  const supabase = await createClient();
  const { data } = await supabase.from('people').select('*').order('name');

  const people = (data ?? []) as Person[];

  return (
    <div className="space-y-north-lg">
      <PageHeader title="People" description="People mentioned across your notes." />

      {people.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No people yet"
          description="People appear here after you save notes that mention them."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-north-sm">
          {people.map((person) => (
            <Link
              key={person.id}
              href={`/people/${person.id}`}
              className="rounded-lg border border-border bg-surface px-north-base py-north-md hover:bg-surface-subtle transition-colors"
            >
              <p className="text-issue-title">{person.name}</p>
              {person.role && (
                <p className="text-metadata text-foreground-muted mt-0.5">{person.role}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
