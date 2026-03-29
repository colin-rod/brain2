'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, FileText, CheckSquare, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNavItems = [
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/people', label: 'People', icon: Users },
  { href: '/settings', label: 'More', icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface border-t border-border z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-north-sm py-north-xs transition-colors',
                isActive ? 'text-primary' : 'text-foreground-muted',
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
