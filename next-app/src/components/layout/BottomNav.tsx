import Link from 'next/link';

const BottomNav = () => {
  return (
    <nav className="mobile-nav">
      <div className="nav-container">
        <Link href="/" className="nav-item">
          <i className="fas fa-home" style={{ fontSize: '24px' }}></i>
        </Link>
        <Link href="/explore" className="nav-item">
          <i className="fas fa-search" style={{ fontSize: '24px' }}></i>
        </Link>
        <Link href="/game" className="nav-item">
          <i className="fas fa-baseball-ball" style={{ fontSize: '24px' }}></i>
        </Link>
        <Link href="/profile" className="nav-item">
          <i className="far fa-user" style={{ fontSize: '24px' }}></i>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
