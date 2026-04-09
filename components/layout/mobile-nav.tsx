'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, FileText, CheckSquare, FolderOpen, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileMoreSheet } from './mobile-more-sheet';

const mobileNavItems = [
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
];

export function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border z-50 pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="flex items-center justify-around h-14">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-north-sm py-north-xs transition-all duration-150',
                  isActive ? 'text-primary' : 'text-foreground-muted',
                )}
              >
                <item.icon
                  aria-hidden="true"
                  className={cn(
                    'h-5 w-5 transition-transform duration-150',
                    isActive && 'scale-110',
                  )}
                />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center gap-0.5 px-north-sm py-north-xs transition-colors text-foreground-muted"
          >
            <MoreHorizontal aria-hidden="true" className="h-5 w-5" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>
      {showMore && <MobileMoreSheet onClose={() => setShowMore(false)} />}
    </>
  );
}
