'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { EntityCombobox } from './entity-combobox';
import { Users, X } from 'lucide-react';
import { linkPerson, unlinkPerson, createAndLinkPerson } from '@/lib/actions/note-mutations';
import { EditorSectionHeader } from '@/components/shared/editor-section-header';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';
import type { Person } from '@/types/database';

interface NotePeopleSectionProps {
  noteId: string;
  people: Person[];
  allPeople: Person[];
  onMutate: () => void;
}

export function NotePeopleSection({ noteId, people, allPeople, onMutate }: NotePeopleSectionProps) {
  const [showCombobox, setShowCombobox] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSelect(item: { id: string; name: string }) {
    startTransition(async () => {
      const result = await linkPerson(noteId, item.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        onMutate();
      }
      setShowCombobox(false);
    });
  }

  function handleCreate(name: string) {
    startTransition(async () => {
      const result = await createAndLinkPerson(noteId, { name });
      if (result.error) {
        toast.error(result.error);
      } else {
        onMutate();
      }
      setShowCombobox(false);
    });
  }

  function handleUnlink(personId: string) {
    startTransition(async () => {
      const result = await unlinkPerson(noteId, personId);
      if (result.error) {
        toast.error(result.error);
      } else {
        onMutate();
      }
    });
  }

  const linkedIds = people.map((p) => p.id);

  return (
    <>
      <Separator />
      <div>
        <EditorSectionHeader
          title="People"
          onAdd={() => setShowCombobox(true)}
          icon={Users}
          count={people.length}
        />
        <div className="flex flex-wrap gap-north-sm">
          {people.map((person) => (
            <div
              key={person.id}
              className="group rounded-md border border-border bg-surface px-north-md py-north-sm flex items-center gap-north-sm"
            >
              <div className="min-w-0">
                <p className="text-body font-medium truncate">{person.name}</p>
                {person.role && (
                  <p className="text-metadata text-foreground-muted truncate">{person.role}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleUnlink(person.id)}
                disabled={isPending}
                className="opacity-0 group-hover:opacity-100 touch-reveal text-foreground-muted hover:text-destructive transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        {showCombobox && (
          <div className="mt-north-sm w-full max-w-xs">
            <EntityCombobox
              items={allPeople.map((p) => ({ id: p.id, name: p.name }))}
              excludeIds={linkedIds}
              onSelect={handleSelect}
              onCreate={handleCreate}
              onClose={() => setShowCombobox(false)}
              placeholder="Search people..."
            />
          </div>
        )}
        {people.length === 0 && !showCombobox && <EditorEmptyMessage message="No people linked." />}
      </div>
    </>
  );
}
