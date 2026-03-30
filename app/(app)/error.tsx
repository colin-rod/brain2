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
    <div className="flex flex-col items-center justify-center py-north-2xl text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-north-base" />
      <h2 className="text-section-header mb-north-xs">Something went wrong</h2>
      <p className="text-body text-foreground-secondary mb-north-lg max-w-md">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
