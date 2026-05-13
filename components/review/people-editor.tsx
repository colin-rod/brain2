'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';
import { EditorItemCard } from '@/components/shared/editor-item-card';
import type { Person } from '@/types/database';

interface PeopleEditorProps {
  existingPeople: Pick<Person, 'id' | 'name' | 'role'>[];
}

export function PeopleEditor({ existingPeople }: PeopleEditorProps) {
  const people = useReviewStore((s) => s.people);
  const updatePerson = useReviewStore((s) => s.updatePerson);
  const removePerson = useReviewStore((s) => s.removePerson);

  return (
    <div className="space-y-north-sm">
      {people.length === 0 && <EditorEmptyMessage message="No people found — add one if needed." />}

      <div className="space-y-north-xs">
        {people.map((person) => (
          <EditorItemCard key={person.id} className="animate-scale-in">
            <div className="flex items-center gap-north-sm">
              <Input
                aria-label="Person name"
                value={person.name}
                onChange={(e) => updatePerson(person.id, { name: e.target.value })}
                placeholder="Name"
                maxLength={200}
                className="flex-1"
                disabled={!!person.matchedPersonId}
              />
              <Input
                aria-label="Person role"
                value={person.role || ''}
                onChange={(e) => updatePerson(person.id, { role: e.target.value || null })}
                placeholder="Role (optional)"
                maxLength={200}
                className="flex-1"
                disabled={!!person.matchedPersonId}
              />
              <Button
                variant="ghost"
                size="sm"
                aria-label="Remove person"
                onClick={() => removePerson(person.id)}
                className="shrink-0 h-11 w-11 lg:h-8 lg:w-8 text-foreground-muted hover:text-destructive"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            {existingPeople.length > 0 && (
              <div className="flex items-center gap-north-sm">
                <p className="text-metadata text-foreground-muted shrink-0">Link to existing</p>
                <Select
                  value={person.matchedPersonId ?? 'new'}
                  onValueChange={(v) =>
                    updatePerson(person.id, { matchedPersonId: v === 'new' ? null : v })
                  }
                >
                  <SelectTrigger size="sm" aria-label="Link to existing person">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Create new</SelectItem>
                    {existingPeople.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                        {p.role ? ` · ${p.role}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </EditorItemCard>
        ))}
      </div>
    </div>
  );
}
