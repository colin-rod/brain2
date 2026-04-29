import { fetchCaptures } from '@/lib/actions/capture';
import { CaptureForm } from '@/components/inbox/capture-form';
import { CaptureList } from '@/components/inbox/capture-list';
import { PageHeader } from '@/components/shared/page-header';
import type { Capture } from '@/types/database';

export default async function InboxPage() {
  const { data } = await fetchCaptures();
  const captures = (data as Capture[]) ?? [];

  return (
    <div className="space-y-north-lg">
      <PageHeader title="Inbox" />

      <CaptureForm />

      <div>
        <div className="flex items-center gap-north-sm mb-north-md">
          <h2 className="text-section-header text-foreground-secondary">Pending</h2>
          {captures.length > 0 && (
            <span className="text-label font-mono text-foreground-muted bg-surface-subtle px-north-xs rounded-full">
              {captures.length}
            </span>
          )}
        </div>
        <CaptureList captures={captures} />
      </div>
    </div>
  );
}
