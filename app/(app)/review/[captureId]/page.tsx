import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ReviewClient } from '@/components/review/review-client';
import type { Capture } from '@/types/database';

interface ReviewPageProps {
  params: Promise<{ captureId: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { captureId } = await params;
  const supabase = await createClient();

  const [{ data: capture, error }, { data: existingPeople }, { data: existingProjects }, { data: existingDomains }] =
    await Promise.all([
      supabase.from('captures').select('*').eq('id', captureId).single(),
      supabase.from('people').select('id, name, role').order('name'),
      supabase.from('projects').select('id, name').order('name'),
      supabase.from('domains').select('id, name, description').order('name'),
    ]);

  if (error || !capture) {
    notFound();
  }

  const typedCapture = capture as Capture;

  // Generate signed URL for image captures
  let imageUrl: string | null = null;
  if (typedCapture.source_type === 'image' && typedCapture.file_path) {
    const { data: signedData } = await supabase.storage
      .from('captures')
      .createSignedUrl(typedCapture.file_path, 3600);
    imageUrl = signedData?.signedUrl ?? null;
  }

  return (
    <div className="space-y-north-lg">
      <div>
        <h1 className="text-page-title">Review</h1>
      </div>

      <ReviewClient
        capture={typedCapture}
        imageUrl={imageUrl}
        existingPeople={existingPeople ?? []}
        existingProjects={existingProjects ?? []}
        existingDomains={existingDomains ?? []}
      />
    </div>
  );
}
