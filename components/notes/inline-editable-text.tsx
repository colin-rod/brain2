'use client';

import { useState, useRef, useCallback, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface InlineEditableTextProps {
  value: string;
  onSave: (value: string) => Promise<{ error?: string }>;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
}

export function InlineEditableText({
  value,
  onSave,
  className = '',
  inputClassName = '',
  placeholder = 'Click to edit...',
  multiline = false,
  rows = 3,
  maxLength,
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const save = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed && value.trim()) {
      setDraft(value);
      setIsEditing(false);
      return;
    }
    if (trimmed === value.trim()) {
      setIsEditing(false);
      return;
    }
    startTransition(async () => {
      const result = await onSave(trimmed);
      if (result.error) {
        toast.error(result.error);
        setDraft(value);
      }
      setIsEditing(false);
    });
  }, [draft, value, onSave]);

  const cancel = useCallback(() => {
    setDraft(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancel();
      } else if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        save();
      }
    },
    [cancel, save, multiline],
  );

  if (isEditing || isPending) {
    const sharedProps = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setDraft(e.target.value),
      onBlur: save,
      onKeyDown: handleKeyDown,
      disabled: isPending,
      placeholder,
      autoFocus: true,
      maxLength,
    };

    return (
      <div className="relative">
        {multiline ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={rows}
            className={`resize-y ${inputClassName}`}
            {...sharedProps}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            className={inputClassName}
            {...sharedProps}
          />
        )}
        {isPending && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-foreground-muted" />
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setIsEditing(true);
      }}
      className={`text-left w-full rounded px-1 -mx-1 hover:bg-surface-subtle transition-colors cursor-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring wrap-break-word overflow-wrap-anywhere ${className}`}
    >
      {value || <span className="text-foreground-muted">{placeholder}</span>}
    </button>
  );
}
