import Link from 'next/link';
import UserAccount from './UserAccount';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="logo-container">
        <Link href="/">
          <img src="/images/logo.png" alt="크보피드" className="logo" />
        </Link>
      </div>
      <nav className="nav-links">
        <Link href="/" className="nav-item">
          <i className="fas fa-home"></i>
          <span>홈</span>
        </Link>
        <Link href="/explore" className="nav-item">
          <i className="fas fa-hashtag"></i>
          <span>탐색하기</span>
        </Link>
        <Link href="/game" className="nav-item">
          <i className="fas fa-baseball-ball"></i>
          <span>경기</span>
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
        <Link href="/profile" className="nav-item">
          <i className="far fa-user"></i>
          <span>프로필</span>
        </Link>
      </nav>
      <button className="post-btn">게시하기</button>
      
      <UserAccount />
    </aside>
  );
};

export default Sidebar;
