import { redirect } from 'next/navigation';
import { createTextCapture } from '@/lib/actions/capture';

interface SharePageProps {
  searchParams: Promise<{
    title?: string;
    text?: string;
    url?: string;
  }>;
}

export default async function ShareCapturePage({ searchParams }: SharePageProps) {
  const { title, text, url } = await searchParams;

  const combined = [title, text, url]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
    .join('\n\n');

  if (!combined) {
    redirect('/inbox');
  }

  const result = await createTextCapture(combined, 'text');

  if (result.error) {
    redirect(`/inbox?shareError=${encodeURIComponent(result.error)}`);
  }

  redirect('/inbox?shared=1');
}
