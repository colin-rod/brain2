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
      <Sidebar />
      <main id="main-content" className="md:ml-52 lg:ml-60 flex-1 pb-16 md:pb-0">
        <div className="border-b border-border border-t-2 border-t-primary bg-surface px-north-base py-north-xs md:px-north-lg">
          <div className="mx-auto max-w-5xl">
            <GlobalSearch />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-north-base py-north-md md:px-north-lg md:py-north-lg">
          {children}
        </div>
      </main>
      <MobileNav />
      <Toaster position="bottom-right" />
    </SearchProvider>
  );
}
