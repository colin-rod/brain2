'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';

export function PeopleEditor() {
  const people = useReviewStore((s) => s.people);
  const updatePerson = useReviewStore((s) => s.updatePerson);
  const addPerson = useReviewStore((s) => s.addPerson);
  const removePerson = useReviewStore((s) => s.removePerson);

  return (
    <div className="space-y-north-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-section-header">People</h3>
        <Button variant="ghost" size="sm" onClick={addPerson} className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {people.length === 0 && (
        <p className="text-metadata text-foreground-muted py-north-sm">No people extracted.</p>
      )}

      <div className="space-y-north-xs">
        {people.map((person) => (
          <div key={person.id} className="flex items-center gap-north-sm">
            <Input
              value={person.name}
              onChange={(e) => updatePerson(person.id, { name: e.target.value })}
              placeholder="Name"
              className="flex-1"
            />
            <Input
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
