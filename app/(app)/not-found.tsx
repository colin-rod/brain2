import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-north-2xl text-center">
      <FileQuestion className="h-12 w-12 text-foreground-muted mb-north-base" />
      <h2 className="text-section-header mb-north-xs">Not found</h2>
      <p className="text-body text-foreground-secondary mb-north-lg">
        The page or record you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/inbox"
        className="inline-flex items-center justify-center rounded-md bg-primary px-north-base py-north-sm text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
      >
        Back to Inbox
      </Link>
    </div>
  );
}
