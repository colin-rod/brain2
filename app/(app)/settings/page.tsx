import { PageHeader } from '@/components/shared/page-header';
import { Separator } from '@/components/ui/separator';

function EmailCaptureSection() {
  const secret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  const emailAddress = process.env.INBOUND_EMAIL_ADDRESS;

  const webhookUrl =
    appUrl && secret ? `${appUrl}/api/webhook/email?token=${secret}` : null;

  return (
    <div>
      <h2 className="text-section-header">Email Capture</h2>
      <p className="text-body text-foreground-secondary mt-north-xs">
        Forward emails to your capture address and they&apos;ll appear in your inbox automatically,
        ready to parse and review.
      </p>

      <div className="mt-north-base space-y-north-sm">
        {emailAddress && (
          <div>
            <p className="text-metadata text-foreground-muted uppercase tracking-wide mb-north-xs">
              Forward emails to
            </p>
            <code className="block rounded bg-surface-subtle px-north-sm py-north-xs text-body font-mono break-all">
              {emailAddress}
            </code>
          </div>
        )}

        <div>
          <p className="text-metadata text-foreground-muted uppercase tracking-wide mb-north-xs">
            Webhook URL
          </p>
          {webhookUrl ? (
            <code className="block rounded bg-surface-subtle px-north-sm py-north-xs text-body font-mono break-all">
              {webhookUrl}
            </code>
          ) : (
            <p className="text-body text-foreground-muted italic">
              {!secret
                ? 'Not configured — set INBOUND_EMAIL_WEBHOOK_SECRET env var'
                : 'Not configured — set NEXT_PUBLIC_APP_URL env var'}
            </p>
          )}
        </div>

        <p className="text-metadata text-foreground-secondary">
          Powered by SendGrid Inbound Parse. Add an MX record on your domain pointing to{' '}
          <code className="text-foreground">mx.sendgrid.net</code> (priority 10), then configure
          the webhook URL above in SendGrid&apos;s Inbound Parse settings.
        </p>
      </div>
    </div>
  );
}

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

        <EmailCaptureSection />

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
