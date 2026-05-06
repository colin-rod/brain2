import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { QuestionsList } from '@/components/questions/questions-list';
import { HelpCircle } from 'lucide-react';
import type { OpenQuestion } from '@/types/database';

type QuestionWithNote = OpenQuestion & {
  notes: { id: string; title: string } | null;
};

export default async function QuestionsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('open_questions')
    .select('*, notes(id, title)')
    .order('created_at', { ascending: false });

  const questions = (data ?? []) as QuestionWithNote[];

  return (
    <div className="space-y-north-lg">
      <PageHeader title="Questions" icon={HelpCircle} iconColor="var(--entity-questions)" />

      {questions.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="Nothing unresolved — or nothing captured yet."
          description="Brain2 flags open questions from your captures so nothing slips through the cracks."
          iconColor="var(--entity-questions)"
          bgColor="var(--entity-questions-tint)"
          ctaLabel="Capture something"
          ctaHref="/inbox"
        />
      ) : (
        <QuestionsList questions={questions} />
      )}
    </div>
  );
}
