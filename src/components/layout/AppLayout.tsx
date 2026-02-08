import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { DesktopNav } from './DesktopNav';
import { DesktopFooter } from './DesktopFooter';

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppLayout({ children, hideNav }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!hideNav && <DesktopNav />}
      <main className={`${hideNav ? '' : 'pb-20 md:pb-0'} max-w-6xl mx-auto w-full flex-1`}>
        {children}
      </main>
      {!hideNav && <DesktopFooter />}
      {!hideNav && <BottomNav />}
    </div>
  );
}
