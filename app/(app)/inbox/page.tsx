import { fetchCaptures } from '@/lib/actions/capture';
import { CaptureForm } from '@/components/inbox/capture-form';
import { CaptureList } from '@/components/inbox/capture-list';
import type { Capture } from '@/types/database';

export default async function InboxPage() {
  const { data } = await fetchCaptures();
  const captures = (data as Capture[]) ?? [];

  return (
    <div className="space-y-north-lg">
      <div>
        <h1 className="text-page-title">Inbox</h1>
      </div>

      <CaptureForm />

      <div>
        <h2 className="text-section-header mb-north-md">Recent Captures</h2>
        <CaptureList captures={captures} />
      </div>
    </div>
  );
}
