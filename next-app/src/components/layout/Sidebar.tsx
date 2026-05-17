'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import UserAccount from './UserAccount';

const Sidebar = () => {
  const pathname = usePathname();

  // Helper to determine if a route is active
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div style={{ padding: '4px 12px', display: 'inline-block' }}>
        <Link href="/">
          <img 
            src="/images/logo.png" 
            alt="크보피드 로고" 
            style={{ height: '28px', width: 'auto', display: 'block', objectFit: 'contain' }} 
          />
        </Link>
      </div>
      
      <nav className="nav-links" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
        
        {/* 홈 */}
        <Link href="/" className="nav-item-link">
          <div className={`nav-item ${isActive('/') ? 'active' : ''}`} id="nav-home" style={{ padding: '10px 12px' }}>
            <i className={isActive('/') ? 'fas fa-home' : 'far fa-home'} style={{ color: isActive('/') ? 'var(--primary-color)' : 'inherit' }}></i>
            <span style={{ color: isActive('/') ? 'var(--primary-color)' : 'inherit' }}>홈</span>
          </div>
        </Link>
        
        {/* 검색 */}
        <Link href="/explore" className="nav-item-link">
          <div className={`nav-item ${isActive('/explore') || isActive('/search') ? 'active' : ''}`} id="nav-search" style={{ padding: '10px 12px' }}>
            <i className="fas fa-search" style={{ color: isActive('/explore') || isActive('/search') ? 'var(--primary-color)' : 'inherit' }}></i>
            <span style={{ color: isActive('/explore') || isActive('/search') ? 'var(--primary-color)' : 'inherit' }}>검색</span>
          </div>
        </Link>
        
        {/* 경기 */}
        <Link href="/game" className="nav-item-link">
          <div 
            className={`nav-item ${isActive('/game') ? 'active' : ''}`} 
            id="nav-game" 
            style={{ 
              padding: '10px 12px', 
              display: 'flex', 
              alignItems: 'center' 
            }}
          >
            {/* Beautiful, premium redrawn solid baseball SVG with negative space seams and stitch marks */}
            <svg 
              viewBox="0 0 24 24" 
              style={{ 
                width: '24px', 
                height: '24px', 
                display: 'block', 
                marginRight: '20px',
                color: isActive('/game') ? 'var(--primary-color)' : 'var(--text-secondary)',
                transition: 'color 0.2s'
              }}
            >
              {/* Solid Baseball Body */}
              <circle cx="12" cy="12" r="10" fill="currentColor" />
              
              {/* Negative space seam arcs */}
              <path 
                d="M6.5 6.5c1.8 1.8 1.8 9.2 0 11" 
                fill="none" 
                stroke="var(--bg-primary)" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
              />
              <path 
                d="M17.5 6.5c-1.8 1.8-1.8 9.2 0 11" 
                fill="none" 
                stroke="var(--bg-primary)" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
              />
              
              {/* Detailed stitch marks along the left seam */}
              <path d="M7 8.5h-1M7.2 11h-1M7.2 13h-1M7 15.5h-1" stroke="var(--bg-primary)" strokeWidth="1" strokeLinecap="round" />
              
              {/* Detailed stitch marks along the right seam */}
              <path d="M17 8.5h1M16.8 11h1M16.8 13h1M17 15.5h1" stroke="var(--bg-primary)" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span style={{ color: isActive('/game') ? 'var(--primary-color)' : 'inherit' }}>경기</span>
          </div>
        </Link>
        
        {/* 알림 */}
        <Link href="/notifications" className="nav-item-link">
          <div className={`nav-item ${isActive('/notifications') ? 'active' : ''}`} style={{ padding: '10px 12px' }}>
            <i className={isActive('/notifications') ? 'fas fa-bell' : 'far fa-bell'} style={{ color: isActive('/notifications') ? 'var(--primary-color)' : 'inherit' }}></i>
            <span style={{ color: isActive('/notifications') ? 'var(--primary-color)' : 'inherit' }}>알림</span>
          </div>
        </Link>
        
        {/* 쪽지 */}
        <Link href="/messages" className="nav-item-link">
          <div className={`nav-item ${isActive('/messages') ? 'active' : ''}`} style={{ padding: '10px 12px' }}>
            <i className={isActive('/messages') ? 'fas fa-envelope' : 'far fa-envelope'} style={{ color: isActive('/messages') ? 'var(--primary-color)' : 'inherit' }}></i>
            <span style={{ color: isActive('/messages') ? 'var(--primary-color)' : 'inherit' }}>쪽지</span>
          </div>
        </Link>
        
        {/* 북마크 */}
        <div className="nav-item" style={{ padding: '10px 12px' }}>
          <i className="far fa-bookmark"></i>
          <span>북마크</span>
        </div>
        
        {/* 프로필 */}
        <Link href="/profile" className="nav-item-link">
          <div className={`nav-item ${isActive('/profile') ? 'active' : ''}`} id="nav-profile" style={{ padding: '10px 12px' }}>
            <i className={isActive('/profile') ? 'fas fa-user' : 'far fa-user'} style={{ color: isActive('/profile') ? 'var(--primary-color)' : 'inherit' }}></i>
            <span style={{ color: isActive('/profile') ? 'var(--primary-color)' : 'inherit' }}>프로필</span>
          </div>
        </Link>
        
      </nav>
      
      <UserAccount />
    </aside>
  );
};

export default Sidebar;
