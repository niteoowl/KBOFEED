'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface GlobalHeaderProps {
  title?: string;
  showBackBtn?: boolean;
  children?: React.ReactNode;
}

export default function GlobalHeader({ title = '홈', showBackBtn = false, children }: GlobalHeaderProps) {
  const [show, setShow] = useState(true);
  const lastScrollY = useRef(0);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      // Find the main scrollable container. In Next.js it's often the window itself.
      const currentScrollY = window.scrollY;

      // PC 고정
      if (window.innerWidth >= 768) {
        setShow(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      if (currentScrollY > lastScrollY.current + 5 && currentScrollY > 60) {
        setShow(false);
      } else if (currentScrollY < lastScrollY.current - 5 || currentScrollY <= 0) {
        setShow(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className="global-feed-header" style={{
      transform: show ? 'translateY(0)' : 'translateY(-100%)',
      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      width: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', height: '56px', padding: '0 16px' }}>
        <div className="header-left" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
          {showBackBtn && (
            <button 
              onClick={() => router.back()} 
              style={{ 
                background: 'transparent', color: 'var(--text-primary)', border: 'none', cursor: 'pointer', outline: 'none', 
                width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              <i className="fas fa-arrow-left"></i>
            </button>
          )}
        </div>
        <h2 style={{ flex: 2, textAlign: 'center', fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {title}
        </h2>
        <div className="header-right" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
           <i className="fas fa-cog" style={{ color: 'var(--text-primary)', cursor: 'pointer', display: 'none' }}></i>
        </div>
      </div>
      {children}
    </header>
  );
}
