'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';

/**
 * Global mobile capture shortcut. Capture is the app's core verb, but it lives on
 * the Inbox screen — so from anywhere else it costs a nav hop first. This floating
 * action button makes it one tap from any list/detail screen.
 *
 * Hidden on:
 *  - desktop (the sidebar + persistent Inbox link cover this)
 *  - the inbox itself (the capture form is already on screen)
 *  - the review route (focused editing task with its own fixed Save bar)
 */
export function CaptureFab() {
  const pathname = usePathname();

  if (pathname === '/inbox' || pathname.startsWith('/review/')) return null;

  return (
    <Link
      href="/inbox"
      aria-label="Capture"
      className="md:hidden fixed right-north-base bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+0.75rem)] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-level-2 transition-transform duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Plus className="h-6 w-6" aria-hidden="true" />
    </Link>
  );
}
