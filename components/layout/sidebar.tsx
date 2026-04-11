'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Inbox,
  FileText,
  CheckSquare,
  Users,
  FolderOpen,
  Layers,
  Scale,
  Download,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/actions/auth';

const navItems = [
  { href: '/inbox', label: 'Inbox', icon: Inbox, iconColor: undefined },
  { href: '/notes', label: 'Notes', icon: FileText, iconColor: 'var(--entity-notes)' },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare, iconColor: 'var(--entity-tasks)' },
  { href: '/people', label: 'People', icon: Users, iconColor: 'var(--entity-people)' },
  { href: '/projects', label: 'Projects', icon: FolderOpen, iconColor: 'var(--entity-projects)' },
  { href: '/domains', label: 'Domains', icon: Layers, iconColor: 'var(--entity-domains)' },
  { href: '/decisions', label: 'Decisions', icon: Scale, iconColor: 'var(--entity-decisions)' },
  { href: '/exports', label: 'Exports', icon: Download, iconColor: undefined },
  { href: '/settings', label: 'Settings', icon: Settings, iconColor: undefined },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-52 lg:w-60 md:flex-col md:fixed md:top-14 md:bottom-0 bg-sidebar border-r border-sidebar-border shadow-[2px_0_8px_rgba(0,0,0,0.03)]">
      <nav aria-label="Main navigation" className="flex-1 px-0 py-north-sm space-y-0">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-north-md px-north-md py-north-xs rounded-none text-[13px] font-mono uppercase tracking-wider transition-all duration-150',
                isActive
                  ? 'border-l-[3px] border-primary bg-sidebar-accent/50 text-foreground font-semibold'
                  : 'border-l-2 border-transparent text-foreground-secondary hover:border-primary/40 hover:bg-sidebar-accent/20 hover:text-foreground',
              )}
            >
              <item.icon
                aria-hidden="true"
                className={cn('h-3.5 w-3.5 shrink-0', !item.iconColor && 'opacity-70')}
                style={item.iconColor ? { color: item.iconColor } : undefined}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-0 py-north-base border-t border-sidebar-border">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-north-md px-north-md py-north-xs rounded-none text-[13px] font-mono uppercase tracking-wider border-l-2 border-transparent text-foreground-secondary hover:border-primary/40 hover:bg-sidebar-accent/20 hover:text-foreground transition-colors"
          >
            <LogOut aria-hidden="true" className="h-3.5 w-3.5 shrink-0 opacity-70" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
