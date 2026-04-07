'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useReviewStore } from '@/lib/stores/review-store';
import { saveReviewedNote } from '@/lib/actions/save-note';
import { SourcePreview } from './source-preview';
import { NoteFields } from './note-fields';
import { TasksEditor } from './tasks-editor';
import { PeopleEditor } from './people-editor';
import { ProjectsEditor } from './projects-editor';
import { DecisionsEditor } from './decisions-editor';
import { QuestionsEditor } from './questions-editor';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Save } from 'lucide-react';
import type { Capture, ParsedNoteJson } from '@/types/database';

interface ReviewClientProps {
  capture: Capture;
  imageUrl: string | null;
}

export function ReviewClient({ capture, imageUrl }: ReviewClientProps) {
  const router = useRouter();
  const [isSaving, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(false);

  const store = useReviewStore();
  const captureId = store.captureId;
  const initFromParsed = store.initFromParsed;
  const reset = store.reset;

  // Initialize store from parsed JSON when loading a new capture
  useEffect(() => {
    if (captureId !== capture.id && capture.parsed_json) {
      initFromParsed(capture.id, capture.parsed_json as ParsedNoteJson);
    }
  }, [capture.id, capture.parsed_json, captureId, initFromParsed]);

  function handleSave() {
    startTransition(async () => {
      const result = await saveReviewedNote({
        captureId: capture.id,
        title: store.title,
        summary: store.summary,
        cleaned_text: store.cleaned_text,
        tasks: store.tasks,
        people: store.people,
        projects: store.projects,
        decisions: store.decisions,
        open_questions: store.open_questions,
      });

      if (result.validationErrors) {
        result.validationErrors.forEach((e) => toast.error(e.message));
        return;
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Note saved');
      setIsSaved(true);
      const noteId = result.noteId;
      setTimeout(() => {
        reset();
        router.push(`/notes/${noteId}`);
      }, 800);
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-north-lg pb-20 lg:pb-0">
        {/* Left column: source preview */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-north-lg">
            <SourcePreview capture={capture} imageUrl={imageUrl} />
          </div>
        </div>

        {/* Right column: editable fields */}
        <div className="lg:col-span-3 space-y-north-lg">
          <NoteFields />
          <Separator />
          <TasksEditor />
          <Separator />
          <PeopleEditor />
          <Separator />
          <ProjectsEditor />
          <Separator />
          <DecisionsEditor />
          <Separator />
          <QuestionsEditor />

          {/* Desktop save button */}
          <div className="hidden lg:flex justify-end pt-north-base">
            <Button onClick={handleSave} disabled={isSaving || isSaved} size="lg">
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isSaved ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving…' : isSaved ? 'Saved' : 'Save Note'}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile fixed save bar */}
      <div className="lg:hidden fixed bottom-14 inset-x-0 bg-surface border-t border-border p-north-sm z-40">
        <Button onClick={handleSave} disabled={isSaving || isSaved} className="w-full" size="lg">
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : isSaved ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Saving…' : isSaved ? 'Saved' : 'Save Note'}
        </Button>
      </div>
    </>
  );
}
