'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="animate-slide-in-up flex flex-col items-center justify-center py-north-2xl text-center">
      <div className="mb-north-base rounded-full border-2 border-dashed border-destructive/30 p-3">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h2 className="text-section-header mb-north-xs">Something stumbled.</h2>
      <p className="text-body text-foreground-secondary mb-north-lg max-w-md">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
