'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useReviewStore } from '@/lib/stores/review-store';
import { EditorEmptyMessage } from '@/components/shared/editor-empty-message';
import { EditorItemCard } from '@/components/shared/editor-item-card';

export function DomainsEditor() {
  const domains = useReviewStore((s) => s.domains);
  const updateDomain = useReviewStore((s) => s.updateDomain);
  const removeDomain = useReviewStore((s) => s.removeDomain);

  return (
    <div className="space-y-north-sm">
      {domains.length === 0 && <EditorEmptyMessage message="No domains extracted." />}

      <div className="space-y-north-xs">
        {domains.map((domain) => (
          <EditorItemCard key={domain.id} className="animate-scale-in">
            <div className="flex items-center gap-north-sm">
              <Input
                aria-label="Domain name"
                value={domain.name}
                onChange={(e) => updateDomain(domain.id, { name: e.target.value })}
                placeholder="Domain name"
                maxLength={200}
                className="flex-1"
              />
              <Input
                aria-label="Domain description"
                value={domain.description ?? ''}
                onChange={(e) => updateDomain(domain.id, { description: e.target.value || null })}
                placeholder="Description (optional)"
                maxLength={500}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDomain(domain.id)}
                className="shrink-0 text-foreground-muted hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </EditorItemCard>
        ))}
      </div>
    </div>
  );
}
