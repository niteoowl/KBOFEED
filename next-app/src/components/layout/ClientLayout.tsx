'use client';

import { usePathname } from 'next/navigation';
import Sidebar from "@/components/layout/Sidebar";
import RightSidebar from "@/components/layout/RightSidebar";
import BottomNav from "@/components/layout/BottomNav";
import AppHeaderWrapper from "@/components/layout/AppHeaderWrapper";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMessagesPage = pathname === '/messages';

  return (
    <div className={`app-container ${isMessagesPage ? 'messages-layout' : ''}`}>
      {!isMessagesPage && <Sidebar />}
      <main className="main-feed">
        <AppHeaderWrapper />
        {children}
      </main>
      {!isMessagesPage && <RightSidebar />}
      <BottomNav />
    </div>
  );
}
