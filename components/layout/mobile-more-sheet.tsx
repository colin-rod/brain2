'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Layers, Scale, Lightbulb, Download, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/actions/auth';

const sheetItems = [
  { href: '/people', label: 'People', icon: Users, iconColor: 'var(--entity-people)' },
  { href: '/domains', label: 'Domains', icon: Layers, iconColor: 'var(--entity-domains)' },
  { href: '/decisions', label: 'Decisions', icon: Scale, iconColor: 'var(--entity-decisions)' },
  { href: '/ideas', label: 'Ideas', icon: Lightbulb, iconColor: 'var(--entity-ideas)' },
  { href: '/exports', label: 'Exports', icon: Download, iconColor: undefined },
  { href: '/settings', label: 'Settings', icon: Settings, iconColor: undefined },
];

interface MobileMoreSheetProps {
  onClose: () => void;
}

export function MobileMoreSheet({ onClose }: MobileMoreSheetProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[60] md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed bottom-0 inset-x-0 bg-surface border-t border-border z-[70] rounded-t-lg md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-center pt-north-sm pb-north-xs">
          <div className="w-8 h-1 rounded-full bg-border" />
        </div>

        <nav className="py-north-sm">
          {sheetItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-north-md px-north-lg py-north-sm text-body font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-foreground-secondary hover:text-foreground',
                )}
              >
                <item.icon
                  className={cn('h-4 w-4 shrink-0', !item.iconColor && 'opacity-70')}
                  style={item.iconColor ? { color: item.iconColor } : undefined}
                />
                {item.label}
              </Link>
            );
          })}

          <div className="border-t border-border mt-north-xs pt-north-xs">
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-north-md px-north-lg py-north-sm text-body font-medium text-foreground-secondary hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0 opacity-70" />
                Sign out
              </button>
            </form>
          </div>
        </nav>
      </div>
    </>
  );
}
