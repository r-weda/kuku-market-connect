import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { DesktopNav } from './DesktopNav';

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppLayout({ children, hideNav }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {!hideNav && <DesktopNav />}
      <main className={`${hideNav ? '' : 'pb-20 md:pb-0'} max-w-6xl mx-auto`}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
