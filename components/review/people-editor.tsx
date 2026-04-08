'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';
import { EditorSectionHeader } from '@/components/shared/editor-section-header';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';

export function PeopleEditor() {
  const people = useReviewStore((s) => s.people);
  const updatePerson = useReviewStore((s) => s.updatePerson);
  const addPerson = useReviewStore((s) => s.addPerson);
  const removePerson = useReviewStore((s) => s.removePerson);

  return (
    <div className="space-y-north-sm">
      <EditorSectionHeader title="People" onAdd={addPerson} />

      {people.length === 0 && <EditorEmptyMessage message="No one mentioned." />}

      <div className="space-y-north-xs">
        {people.map((person) => (
          <div key={person.id} className="flex items-center gap-north-sm animate-scale-in">
            <Input
              aria-label="Person name"
              value={person.name}
              onChange={(e) => updatePerson(person.id, { name: e.target.value })}
              placeholder="Name"
              className="flex-1"
            />
            <Input
              aria-label="Person role"
              value={person.role || ''}
              onChange={(e) => updatePerson(person.id, { role: e.target.value || null })}
              placeholder="Role (optional)"
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removePerson(person.id)}
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
