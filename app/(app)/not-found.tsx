import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppNotFound() {
  return (
    <div className="animate-slide-in-up flex flex-col items-center justify-center py-north-2xl text-center">
      <div className="mb-north-base rounded-full border-2 border-dashed border-foreground-muted/40 p-3">
        <FileQuestion className="h-10 w-10 text-foreground-muted" />
      </div>
      <h2 className="text-section-header mb-north-xs">Lost in the library.</h2>
      <p className="text-body text-foreground-secondary mb-north-lg">
        The page or record you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button render={<Link href="/inbox" />}>Back to Inbox</Button>
    </div>
  );
}
