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
import type { Domain } from '@/types/database';

interface DomainsEditorProps {
  existingDomains: Pick<Domain, 'id' | 'name' | 'description'>[];
}

export function DomainsEditor({ existingDomains }: DomainsEditorProps) {
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
                disabled={!!domain.matchedDomainId}
              />
              <Input
                aria-label="Domain description"
                value={domain.description ?? ''}
                onChange={(e) => updateDomain(domain.id, { description: e.target.value || null })}
                placeholder="Description (optional)"
                maxLength={500}
                className="flex-1"
                disabled={!!domain.matchedDomainId}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDomain(domain.id)}
                className="shrink-0 h-11 w-11 lg:h-8 lg:w-8 text-foreground-muted hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {existingDomains.length > 0 && (
              <div className="flex items-center gap-north-sm">
                <p className="text-metadata text-foreground-muted shrink-0">Link to existing</p>
                <Select
                  value={domain.matchedDomainId ?? 'new'}
                  onValueChange={(v) =>
                    updateDomain(domain.id, { matchedDomainId: v === 'new' ? null : v })
                  }
                >
                  <SelectTrigger size="sm" aria-label="Link to existing domain">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Create new</SelectItem>
                    {existingDomains.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
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
