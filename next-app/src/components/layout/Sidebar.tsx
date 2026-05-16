import Link from 'next/link';
import UserAccount from './UserAccount';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div style={{ padding: '4px 12px', display: 'inline-block' }}>
        <Link href="/">
          <img src="/images/logo.png" alt="크보피드 로고" style={{ width: '28px', height: '28px', display: 'block' }} />
        </Link>
      </div>
      <nav className="nav-links" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
        <Link href="/" className="nav-item-link">
          <div className="nav-item" id="nav-home" style={{ padding: '10px 12px' }}>
            <i className="fas fa-home"></i>
            <span>홈</span>
          </div>
        </Link>
        <Link href="/explore" className="nav-item-link">
          <div className="nav-item" id="nav-search" style={{ padding: '10px 12px' }}>
            <i className="fas fa-search"></i>
            <span>검색</span>
          </div>
        </Link>
        <Link href="/game" className="nav-item-link">
          <div className="nav-item" id="nav-game" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px', display: 'block' }}>
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 4.5c3 3 3 12 0 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M17 4.5c-3 3-3 12 0 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>

            <span style={{ transform: 'translateY(1px)' }}>경기</span>
          </div>
        </Link>
        <div className="nav-item" style={{ padding: '10px 12px' }}>
          <i className="far fa-bell"></i>
          <span>알림</span>
        </div>
        <div className="nav-item" style={{ padding: '10px 12px' }}>
          <i className="far fa-envelope"></i>
          <span>쪽지</span>
        </div>
        <div className="nav-item" style={{ padding: '10px 12px' }}>
          <i className="far fa-bookmark"></i>
          <span>북마크</span>
        </div>
        <Link href="/profile" className="nav-item-link">
          <div className="nav-item" id="nav-profile" style={{ padding: '10px 12px' }}>
            <i className="far fa-user"></i>
            <span>프로필</span>
          </div>
        </Link>
        <Link href="/settings" className="nav-item-link">
          <div className="nav-item" id="nav-settings" style={{ padding: '10px 12px' }}>
            <i className="fas fa-cog"></i>
            <span>설정</span>
          </div>
        </Link>
      </nav>
      <button className="post-btn">게시하기</button>
      
      <UserAccount />
    </aside>
  );
};

export default Sidebar;
