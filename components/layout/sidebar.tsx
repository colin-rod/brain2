'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Inbox,
  FileText,
  CheckSquare,
  Users,
  FolderOpen,
  Scale,
  Download,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/actions/auth';

const navItems = [
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/people', label: 'People', icon: Users },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/decisions', label: 'Decisions', icon: Scale },
  { href: '/exports', label: 'Exports', icon: Download },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-12 items-center gap-north-sm px-north-md border-b border-sidebar-border">
        <span className="font-mono text-[11px] text-primary select-none">[</span>
        <span className="font-mono text-sm font-semibold uppercase tracking-widest text-foreground">
          BRAIN2
        </span>
        <span className="font-mono text-[11px] text-primary select-none">]</span>
      </div>

      <nav className="flex-1 px-0 py-north-sm space-y-0">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-north-md px-north-md py-north-xs rounded-none text-[13px] font-mono uppercase tracking-wider border-l-2 transition-colors',
                isActive
                  ? 'border-primary bg-sidebar-accent/40 text-foreground'
                  : 'border-transparent text-foreground-secondary hover:border-primary/40 hover:bg-sidebar-accent/20 hover:text-foreground',
              )}
            >
              <item.icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
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
            <LogOut className="h-3.5 w-3.5 shrink-0 opacity-70" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
