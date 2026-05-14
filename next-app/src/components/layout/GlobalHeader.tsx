'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function GlobalHeader() {
  const [show, setShow] = useState(true);
  const lastScrollY = useRef(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      // Find the main scrollable container. In Next.js it's often the window itself.
      const currentScrollY = window.scrollY;

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

  // Determine Title and Back button logic
  let title = '홈';
  let showBackBtn = false;

  if (pathname.includes('/search') || pathname.includes('/explore')) {
    title = '탐색';
  } else if (pathname.includes('/game')) {
    title = '경기';
  } else if (pathname.includes('/profile')) {
    title = '프로필';
  } else if (pathname.startsWith('/@') && pathname.split('/').length > 2) {
    title = '게시물';
    showBackBtn = true;
  } else if (pathname.startsWith('/@')) {
    title = '프로필';
    showBackBtn = true;
  }

  // 예외 경로 (글로벌 헤더를 렌더링하지 않아야 할 때 등)
  if (pathname.includes('/login') || pathname.includes('/signup') || pathname.includes('/onboarding')) {
    return null;
  }

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
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      width: '100%',
    }}>
      <div className="header-left" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        {showBackBtn ? (
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
        ) : (
          <Link href="/">
            <img src="/images/logo.png" alt="크보피드 로고" style={{ height: '32px', width: '32px', display: 'none' }} className="mobile-logo-header" />
          </Link>
        )}
      </div>
      <h2 style={{ flex: 2, textAlign: 'center', fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
        {title}
      </h2>
      <div className="header-right" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
         <i className="fas fa-cog" style={{ color: 'var(--text-primary)', cursor: 'pointer', display: 'none' }}></i>
      </div>
    </header>
  );
}
