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
import { DomainsEditor } from './domains-editor';
import { DecisionsEditor } from './decisions-editor';
import { QuestionsEditor } from './questions-editor';
import { IdeasEditor } from './ideas-editor';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Loader2, Plus, Save } from 'lucide-react';
import type { Capture, ParsedNoteJson } from '@/types/database';

interface ReviewClientProps {
  capture: Capture;
  imageUrl: string | null;
}

interface CollapsibleSectionProps {
  title: string;
  count: number;
  children: React.ReactNode;
  delay: string;
  onAdd: () => void;
}

function SaveCelebration({ active }: { active: boolean }) {
  if (!active) return null;

  const dots = [
    { tx: '0px', ty: '-28px', color: 'var(--primary)', delay: '0ms' },
    { tx: '24px', ty: '-14px', color: 'var(--entity-projects)', delay: '30ms' },
    { tx: '24px', ty: '14px', color: 'var(--primary)', delay: '60ms' },
    { tx: '0px', ty: '28px', color: 'var(--entity-ideas)', delay: '30ms' },
    { tx: '-24px', ty: '14px', color: 'var(--entity-projects)', delay: '60ms' },
    { tx: '-24px', ty: '-14px', color: 'var(--primary)', delay: '0ms' },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 flex items-end justify-end pb-24 pr-8"
    >
      <div className="relative h-0 w-0">
        {dots.map((dot, i) => (
          <span
            key={i}
            className="animate-burst-dot absolute h-2 w-2 rounded-full"
            style={
              {
                backgroundColor: dot.color,
                animationDelay: dot.delay,
                '--tx': dot.tx,
                '--ty': dot.ty,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

function CollapsibleSection({ title, count, children, delay, onAdd }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(count > 0);

  return (
    <div className="animate-slide-in-up" style={{ animationDelay: delay }}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-north-xs py-north-xs min-h-11 hover:text-foreground transition-colors duration-150">
            <span className="text-section-header">
              {title}
              {count > 0 && (
                <span className="ml-2 text-metadata text-foreground-muted font-normal">
                  ({count})
                </span>
              )}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-foreground-muted transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </CollapsibleTrigger>
          <Button variant="ghost" size="sm" onClick={onAdd} className="gap-1">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add
          </Button>
        </div>
        <CollapsibleContent>
          <div className="pt-north-sm">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function ReviewClient({ capture, imageUrl }: ReviewClientProps) {
  const router = useRouter();
  const [isSaving, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const captureId = useReviewStore((s) => s.captureId);
  const initFromParsed = useReviewStore((s) => s.initFromParsed);
  const reset = useReviewStore((s) => s.reset);

  const taskCount = useReviewStore((s) => s.tasks.length);
  const personCount = useReviewStore((s) => s.people.length);
  const projectCount = useReviewStore((s) => s.projects.length);
  const domainCount = useReviewStore((s) => s.domains.length);
  const decisionCount = useReviewStore((s) => s.decisions.length);
  const questionCount = useReviewStore((s) => s.open_questions.length);
  const ideaCount = useReviewStore((s) => s.ideas.length);

  const addTask = useReviewStore((s) => s.addTask);
  const addPerson = useReviewStore((s) => s.addPerson);
  const addProject = useReviewStore((s) => s.addProject);
  const addDomain = useReviewStore((s) => s.addDomain);
  const addDecision = useReviewStore((s) => s.addDecision);
  const addQuestion = useReviewStore((s) => s.addQuestion);
  const addIdea = useReviewStore((s) => s.addIdea);

  // Initialize store from parsed JSON when loading a new capture
  useEffect(() => {
    if (captureId !== capture.id && capture.parsed_json) {
      initFromParsed(capture.id, capture.parsed_json as ParsedNoteJson);
    }
  }, [capture.id, capture.parsed_json, captureId, initFromParsed]);

  function handleSave() {
    startTransition(async () => {
      const state = useReviewStore.getState();
      const result = await saveReviewedNote({
        captureId: capture.id,
        title: state.title,
        summary: state.summary,
        cleaned_text: state.cleaned_text,
        tasks: state.tasks,
        people: state.people,
        projects: state.projects,
        domains: state.domains,
        decisions: state.decisions,
        open_questions: state.open_questions,
        ideas: state.ideas,
      });

      if (result.validationErrors) {
        result.validationErrors.forEach((e) => toast.error(e.message));
        return;
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Locked in.');
      setIsSaved(true);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 600);
      const noteId = result.noteId;
      setTimeout(() => {
        reset();
        router.push(`/notes/${noteId}`);
      }, 800);
    });
  }

  return (
    <>
      <SaveCelebration active={saveSuccess} />
      <div className="space-y-north-lg pb-20 lg:pb-0">
        {/* Title, Summary, Full Text — full width above the grid */}
        <div className="animate-slide-in-up" style={{ animationDelay: '0ms' }}>
          <NoteFields />
        </div>

        <Separator />

        {/* Two-panel grid: source left, structured editors right */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-north-lg">
          {/* Left column: source preview */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-north-lg">
              <SourcePreview capture={capture} imageUrl={imageUrl} />
            </div>
          </div>

          {/* Right column: structured editors */}
          <div className="lg:col-span-3 space-y-north-sm divide-y divide-border">
            <CollapsibleSection title="Tasks" count={taskCount} delay="50ms" onAdd={addTask}>
              <TasksEditor />
            </CollapsibleSection>

            <div className="pt-north-sm">
              <CollapsibleSection
                title="People"
                count={personCount}
                delay="100ms"
                onAdd={addPerson}
              >
                <PeopleEditor />
              </CollapsibleSection>
            </div>

            <div className="pt-north-sm">
              <CollapsibleSection
                title="Projects"
                count={projectCount}
                delay="150ms"
                onAdd={addProject}
              >
                <ProjectsEditor />
              </CollapsibleSection>
            </div>

            <div className="pt-north-sm">
              <CollapsibleSection
                title="Domains"
                count={domainCount}
                delay="175ms"
                onAdd={addDomain}
              >
                <DomainsEditor />
              </CollapsibleSection>
            </div>

            <div className="pt-north-sm">
              <CollapsibleSection
                title="Decisions"
                count={decisionCount}
                delay="225ms"
                onAdd={addDecision}
              >
                <DecisionsEditor />
              </CollapsibleSection>
            </div>

            <div className="pt-north-sm">
              <CollapsibleSection
                title="Questions"
                count={questionCount}
                delay="275ms"
                onAdd={addQuestion}
              >
                <QuestionsEditor />
              </CollapsibleSection>
            </div>

            <div className="pt-north-sm">
              <CollapsibleSection title="Ideas" count={ideaCount} delay="325ms" onAdd={addIdea}>
                <IdeasEditor />
              </CollapsibleSection>
            </div>
          </div>
        </div>

        {/* Desktop save button */}
        <div className="hidden lg:flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || isSaved}
            size="lg"
            className={cn(
              'transition-[transform,box-shadow] duration-200',
              saveSuccess && 'scale-105 ring-2 ring-primary/25',
            )}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : isSaved ? (
              <span
                key="saved-check"
                className="mr-2 animate-check-draw inline-flex"
                style={{ strokeDasharray: 20 }}
              >
                <Check className="h-4 w-4" />
              </span>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving…' : isSaved ? 'Saved' : 'Save to Notes'}
          </Button>
        </div>
      </div>

      {/* Mobile fixed save bar */}
      <div className="lg:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] inset-x-0 bg-surface border-t border-border p-north-sm z-40">
        <Button
          onClick={handleSave}
          disabled={isSaving || isSaved}
          className={cn(
            'w-full transition-[transform,box-shadow] duration-200',
            saveSuccess && 'scale-[1.02] ring-2 ring-primary/25',
          )}
          size="lg"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : isSaved ? (
            <span
              key="saved-check-mobile"
              className="mr-2 animate-check-draw inline-flex"
              style={{ strokeDasharray: 20 }}
            >
              <Check className="h-4 w-4" />
            </span>
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Saving…' : isSaved ? 'Saved' : 'Save to Notes'}
        </Button>
      </div>
    </>
  );
}
