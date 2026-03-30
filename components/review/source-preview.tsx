'use client';

import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ImageIcon, FileText, MessageSquare, ChevronDown } from 'lucide-react';
import type { Capture, CaptureSourceType } from '@/types/database';
import { cn } from '@/lib/utils';

const sourceIcons: Record<CaptureSourceType, typeof ImageIcon> = {
  image: ImageIcon,
  text: FileText,
  chat_transcript: MessageSquare,
};

const sourceLabels: Record<CaptureSourceType, string> = {
  image: 'Image',
  text: 'Plain Text',
  chat_transcript: 'Chat Transcript',
};

interface SourcePreviewProps {
  capture: Capture;
  imageUrl: string | null;
}

export function SourcePreview({ capture, imageUrl }: SourcePreviewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const Icon = sourceIcons[capture.source_type];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-north-base py-north-md hover:bg-surface-subtle transition-colors">
          <div className="flex items-center gap-north-sm">
            <Icon className="h-4 w-4 text-foreground-secondary" />
            <span className="text-section-header">Source: {sourceLabels[capture.source_type]}</span>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-foreground-muted transition-transform',
              isOpen && 'rotate-180',
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-border px-north-base py-north-md">
            {capture.source_type === 'image' && imageUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Source capture"
                  className="max-h-96 rounded-md object-contain"
                />
              </div>
            )}

            {capture.raw_text && (
              <pre className="whitespace-pre-wrap text-body text-foreground-secondary font-ui leading-relaxed max-h-80 overflow-y-auto">
                {capture.raw_text}
              </pre>
            )}

            {capture.source_type === 'image' && !imageUrl && !capture.raw_text && (
              <p className="text-metadata text-foreground-muted">No preview available</p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
