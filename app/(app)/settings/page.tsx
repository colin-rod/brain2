import { PageHeader } from '@/components/shared/page-header';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="space-y-north-lg">
      <PageHeader title="Settings" description="Application configuration." />

      <div className="rounded-lg border border-border bg-surface p-north-lg space-y-north-base">
        <div>
          <h2 className="text-section-header">Parser</h2>
          <p className="text-body text-foreground-secondary mt-north-xs">
            OpenAI GPT-4o with Structured Outputs
          </p>
        </div>

        <Separator />

        <div>
          <h2 className="text-section-header">Storage</h2>
          <p className="text-body text-foreground-secondary mt-north-xs">
            Supabase (Postgres + Storage)
          </p>
        </div>

        <Separator />

        <div>
          <h2 className="text-section-header">Authentication</h2>
          <p className="text-body text-foreground-secondary mt-north-xs">
            Supabase Auth (email/password)
          </p>
        </div>

        <Separator />

        <div>
          <h2 className="text-section-header">About</h2>
          <p className="text-body text-foreground-secondary mt-north-xs">
            Brain2 V1 — Turn messy work inputs into durable, structured knowledge.
          </p>
        </div>
      </div>
    </div>
  );
}
