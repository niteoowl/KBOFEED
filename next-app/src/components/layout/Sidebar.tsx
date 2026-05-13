import Link from 'next/link';
import UserAccount from './UserAccount';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <Link href="/">
          <img src="/images/logo.png" alt="크보피드 로고" className="logo" />
        </Link>
      </div>
      <nav className="nav-links">
        <Link href="/" className="nav-item-link">
          <div className="nav-item" id="nav-home">
            <i className="fas fa-home"></i>
            <span>홈</span>
          </div>
        </Link>
        <Link href="/explore" className="nav-item-link">
          <div className="nav-item" id="nav-search">
            <i className="fas fa-search"></i>
            <span>검색</span>
          </div>
        </Link>
        <Link href="/game" className="nav-item-link">
          <div className="nav-item" id="nav-game">
            <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 4.5c3 3 3 12 0 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M17 4.5c-3 3-3 12 0 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>경기</span>
          </div>
        </Link>
        <div className="nav-item">
          <i className="far fa-bell"></i>
          <span>알림</span>
        </div>
        <div className="nav-item">
          <i className="far fa-envelope"></i>
          <span>쪽지</span>
        </div>
        <div className="nav-item">
          <i className="far fa-bookmark"></i>
          <span>북마크</span>
        </div>
        <Link href="/profile" className="nav-item-link">
          <div className="nav-item" id="nav-profile">
            <i className="far fa-user"></i>
            <span>프로필</span>
          </div>
        </Link>
      </nav>
      <button className="post-btn">게시하기</button>
      
      <UserAccount />
    </aside>
  );
};

export default Sidebar;
