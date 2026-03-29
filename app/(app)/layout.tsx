import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Toaster } from 'sonner';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Sidebar />
      <main className="md:ml-60 flex-1 pb-16 md:pb-0">
        <div className="mx-auto max-w-5xl px-north-base py-north-lg md:px-north-lg md:py-north-xl">
          {children}
        </div>
      </main>
      <MobileNav />
      <Toaster position="bottom-right" />
    </>
  );
}
