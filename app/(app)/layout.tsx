import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { SearchProvider } from '@/components/search/search-provider';
import { GlobalSearch } from '@/components/search/global-search';
import { Toaster } from 'sonner';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SearchProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:rounded focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 w-full h-14 flex items-center gap-north-md border-b border-border border-t-2 border-t-primary bg-surface px-north-md shadow-header pt-[env(safe-area-inset-top,0px)]">
        <span className="font-mono text-[11px] text-primary select-none">[</span>
        <span className="font-accent text-lg font-semibold tracking-tight text-foreground">
          Brain<span className="text-primary italic">2</span>
        </span>
        <span className="font-mono text-[11px] text-primary select-none">]</span>
        <div className="flex-1 ml-north-md">
          <GlobalSearch />
        </div>
      </header>
      <Sidebar />
      <main
        id="main-content"
        className="md:ml-52 lg:ml-60 flex-1 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0"
      >
        <div className="w-full px-north-base py-north-md md:px-north-md md:py-north-lg lg:px-north-lg">
          {children}
        </div>
      </main>
      <MobileNav />
      <Toaster position="bottom-right" />
    </SearchProvider>
  );
}
