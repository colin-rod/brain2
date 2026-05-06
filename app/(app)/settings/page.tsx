import { PageHeader } from '@/components/shared/page-header';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="space-y-north-lg">
      <PageHeader title="Settings" />

      <div className="rounded-lg border border-border bg-surface p-north-lg space-y-north-base">
        <div>
          <h2 className="text-section-header">Parser</h2>
          <p className="text-body text-foreground-secondary mt-north-xs">
            AI analysis — reads your uploads and extracts tasks, people, decisions, and more
          </p>
        </div>

        <Separator />

        <div>
          <h2 className="text-section-header">Storage</h2>
          <p className="text-body text-foreground-secondary mt-north-xs">
            Cloud storage — your notes and uploads are stored securely in the cloud
          </p>
        </div>

        <Separator />

        <div>
          <h2 className="text-section-header">Authentication</h2>
          <p className="text-body text-foreground-secondary mt-north-xs">
            Sign-in — email and password. No third-party accounts required.
          </p>
        </div>

        <Separator />

        <div>
          <h2 className="text-section-header">About</h2>
          <p className="text-body text-foreground-secondary mt-north-xs">
            Brain2 — Turns messy work inputs into structured, searchable knowledge.
          </p>
        </div>
      </div>
    </div>
  );
}
