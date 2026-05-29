'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useReviewStore } from '@/lib/stores/review-store';
import { saveReviewedNote } from '@/lib/actions/save-note';
import { deleteCapture } from '@/lib/actions/capture';
import { SourcePreview } from './source-preview';
import { NoteFields } from './note-fields';
import { TasksEditor } from './tasks-editor';
import { PeopleEditor } from './people-editor';
import { ProjectsEditor } from './projects-editor';
import { DomainsEditor } from './domains-editor';
import { DecisionsEditor } from './decisions-editor';
import { QuestionsEditor } from './questions-editor';
import { IdeasEditor } from './ideas-editor';
import { SuggestedLinksEditor } from './suggested-links-editor';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import type { Capture, ParsedNoteJson, Person, Project, Domain } from '@/types/database';

interface ReviewClientProps {
  capture: Capture;
  imageUrl: string | null;
  existingPeople: Pick<Person, 'id' | 'name' | 'role'>[];
  existingProjects: Pick<Project, 'id' | 'name'>[];
  existingDomains: Pick<Domain, 'id' | 'name' | 'description'>[];
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
  // Populated sections open by default everywhere (mobile included) so the user can
  // verify the parsed result without tapping each one open. Empty sections stay closed.
  const hasContent = count > 0;
  const [userToggled, setUserToggled] = useState(false);
  const [openOverride, setOpenOverride] = useState(false);
  const open = userToggled ? openOverride : hasContent;

  function handleOpenChange(next: boolean) {
    setUserToggled(true);
    setOpenOverride(next);
  }

  return (
    <div className="animate-slide-in-up" style={{ animationDelay: delay }}>
      <Collapsible open={open} onOpenChange={handleOpenChange}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger
            className={cn(
              'flex items-center gap-north-xs py-north-xs min-h-11 hover:text-foreground transition-colors duration-200',
              !hasContent && 'text-foreground-muted',
            )}
          >
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdd}
            className={cn(
              'gap-1 h-11 lg:h-9 px-3 lg:px-2',
              // De-emphasize "Add" on empty sections until the header is engaged.
              !hasContent && 'opacity-60',
            )}
          >
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

export function ReviewClient({ capture, imageUrl, existingPeople, existingProjects, existingDomains }: ReviewClientProps) {
  const router = useRouter();
  const [isSaving, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
  const suggestedLinkCount = useReviewStore((s) => s.suggestedNoteLinks.length);
  const approvedLinkCount = useReviewStore((s) => s.approvedNoteLinkIds.length);

  const addTask = useReviewStore((s) => s.addTask);
  const addPerson = useReviewStore((s) => s.addPerson);
  const addProject = useReviewStore((s) => s.addProject);
  const addDomain = useReviewStore((s) => s.addDomain);
  const addDecision = useReviewStore((s) => s.addDecision);
  const addQuestion = useReviewStore((s) => s.addQuestion);
  const addIdea = useReviewStore((s) => s.addIdea);

  // Compact "what you're about to save" summary, shown beside the Save action so
  // the common case (looks right → save) doesn't require scrolling the whole page.
  const summaryParts = [
    [taskCount, 'task'],
    [personCount, 'person', 'people'],
    [projectCount, 'project'],
    [domainCount, 'domain'],
    [decisionCount, 'decision'],
    [questionCount, 'question'],
    [ideaCount, 'idea'],
    [approvedLinkCount, 'link'],
  ] as const;
  const saveSummary = summaryParts
    .filter(([n]) => (n as number) > 0)
    .map(([n, singular, plural]) => {
      const count = n as number;
      const word = count === 1 ? singular : (plural ?? `${singular}s`);
      return `${count} ${word}`;
    })
    .join(' · ');

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
        approvedNoteLinkIds: state.approvedNoteLinkIds,
      });

      if (result.validationErrors) {
        result.validationErrors.forEach((e) => toast.error(e.message));
        return;
      }

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Note saved.');
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

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteCapture(capture.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Capture deleted.');
      reset();
      router.push('/inbox');
    });
  }

  return (
    <>
      <SaveCelebration active={saveSuccess} />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup>
            <DialogTitle>Discard this capture?</DialogTitle>
            <DialogDescription>
              This will permanently delete the capture and cannot be undone.
            </DialogDescription>
            <div className="flex justify-end gap-north-sm">
              <DialogClose
                render={
                  <Button variant="ghost" disabled={isDeleting}>
                    Cancel
                  </Button>
                }
              />
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {isDeleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </DialogPopup>
        </DialogPortal>
      </Dialog>
      <div className="space-y-north-lg pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
        {/* Title, Summary, Full Text — full width above the grid */}
        <div className="animate-slide-in-up" style={{ animationDelay: '0ms' }}>
          <NoteFields />
        </div>

        <Separator />

        {/* Two-panel grid: source left, structured editors right */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-north-lg">
          {/* Left column: source preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-14 z-20 bg-background lg:top-north-lg lg:z-auto">
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
                <PeopleEditor existingPeople={existingPeople} />
              </CollapsibleSection>
            </div>

            <div className="pt-north-sm">
              <CollapsibleSection
                title="Projects"
                count={projectCount}
                delay="150ms"
                onAdd={addProject}
              >
                <ProjectsEditor existingProjects={existingProjects} />
              </CollapsibleSection>
            </div>

            <div className="pt-north-sm">
              <CollapsibleSection
                title="Domains"
                count={domainCount}
                delay="175ms"
                onAdd={addDomain}
              >
                <DomainsEditor existingDomains={existingDomains} />
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

            <div className="pt-north-sm">
              <CollapsibleSection
                title="Related Notes"
                count={approvedLinkCount || suggestedLinkCount}
                delay="375ms"
                onAdd={() => {}}
              >
                <SuggestedLinksEditor />
              </CollapsibleSection>
            </div>
          </div>
        </div>

        {/* Desktop save button */}
        <div className="hidden lg:flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            disabled={isSaving || isSaved || isDeleting}
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete capture
          </Button>
          <div className="flex items-center gap-north-md">
            {saveSummary && (
              <span className="text-metadata text-foreground-muted">{saveSummary}</span>
            )}
            <Button
              onClick={handleSave}
              disabled={isSaving || isSaved || isDeleting}
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
      </div>

      {/* Mobile fixed save bar — sits flush at the bottom since the global nav is
          hidden on the review route (see MobileNav). */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border p-north-sm pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] z-40 flex flex-col gap-north-xs">
        {saveSummary && (
          <p className="text-metadata text-foreground-muted text-center mb-north-xs">
            {saveSummary}
          </p>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving || isSaved || isDeleting}
          className={cn(
            'w-full transition-[transform,box-shadow] duration-200',
            saveSuccess && 'scale-105 ring-2 ring-primary/25',
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
        <Button
          variant="ghost"
          size="sm"
          disabled={isSaving || isSaved || isDeleting}
          onClick={() => setIsDeleteDialogOpen(true)}
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete capture
        </Button>
      </div>
    </>
  );
}
