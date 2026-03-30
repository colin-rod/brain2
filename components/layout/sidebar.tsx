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
  Brain,
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
      <div className="flex h-14 items-center gap-north-sm px-north-lg border-b border-sidebar-border">
        <Brain className="h-5 w-5 text-primary" />
        <span className="font-accent text-section-header">Brain2</span>
      </div>

      <nav className="flex-1 px-north-sm py-north-base space-y-north-xs">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-north-md px-north-md py-north-sm rounded-md text-body transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-foreground-secondary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-north-sm py-north-base border-t border-sidebar-border">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-north-md px-north-md py-north-sm rounded-md text-body text-foreground-secondary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
