'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EntityCombobox } from '@/components/notes/entity-combobox';
import { useSearchRefresh } from '@/components/search/search-provider';
import { linkPersonToProject, unlinkPersonFromProject } from '@/lib/actions/entity-mutations';
import { Plus, X } from 'lucide-react';

interface ProjectPeopleSectionProps {
  projectId: string;
  linkedPeople: { id: string; name: string; role: string | null }[];
  allPeople: { id: string; name: string }[];
}

export function ProjectPeopleSection({
  projectId,
  linkedPeople,
  allPeople,
}: ProjectPeopleSectionProps) {
  const router = useRouter();
  const refreshSearch = useSearchRefresh();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);

  function handleLink(personId: string) {
    startTransition(async () => {
      const result = await linkPersonToProject(projectId, personId);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
        refreshSearch();
      }
      setIsAdding(false);
    });
  }

  function handleUnlink(personId: string) {
    startTransition(async () => {
      const result = await unlinkPersonFromProject(projectId, personId);
      if (result.error) {
        toast.error(result.error);
      } else {
        router.refresh();
        refreshSearch();
      }
    });
  }

  return (
    <div className="space-y-north-xs">
      {linkedPeople.map((person) => (
        <div
          key={person.id}
          className="flex items-center justify-between rounded-md border border-border bg-surface px-north-md py-north-sm"
        >
          <div>
            <Link href={`/people/${person.id}`} className="text-body text-primary hover:underline">
              {person.name}
            </Link>
            {person.role && <p className="text-metadata text-foreground-muted">{person.role}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleUnlink(person.id)}
            disabled={isPending}
            className="text-foreground-muted hover:text-destructive h-7 w-7 p-0"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      {isAdding ? (
        <div className="w-64">
          <EntityCombobox
            items={allPeople}
            excludeIds={linkedPeople.map((p) => p.id)}
            onSelect={(item) => handleLink(item.id)}
            onCreate={() => {}}
            onClose={() => setIsAdding(false)}
            placeholder="Search people..."
          />
        </div>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Link Person
        </Button>
      )}
    </div>
  );
}
