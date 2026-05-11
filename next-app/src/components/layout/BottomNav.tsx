import Link from 'next/link';

const BottomNav = () => {
  return (
    <nav className="mobile-nav">
      <div className="nav-container">
        <Link href="/" className="nav-item active">
          <svg viewBox="0 0 24 24">
            <path d="M12 2.5c-1.5 0-2.5.8-3.5 1.5L3.5 8.2c-.8.7-1.5 1.8-1.5 3v8.3c0 1.1.9 2 2 2h4.5c.3 0 .5-.2.5-.5v-4.5c0-1.7 1.3-3 3-3s3 1.3 3 3v4.5c0 .3.2.5.5.5h4.5c1.1 0 2-.9 2-2v-8.3c0-1.2-.7-2.3-1.5-3l-5-4.2c-1-.7-2-1.5-3.5-1.5z"></path>
          </svg>
        </Link>
        <Link href="/explore" className="nav-item">
          <svg viewBox="0 0 24 24">
            <path d="M11 2a9 9 0 1 0 5.6 16.05l4.1 4.1a1.5 1.5 0 1 0 2.12-2.12l-4.1-4.1A9 9 0 0 0 11 2zm0 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12z"></path>
          </svg>
        </Link>
        <Link href="/game" className="nav-item">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M7 4.5c3 3 3 12 0 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M17 4.5c-3 3-3 12 0 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
        <Link href="/profile" className="nav-item">
          <svg viewBox="0 0 24 24">
            <path d="M12 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zm0 2c-4.97 0-9 2.46-9 5.5V22h18v-2.5c0-3.04-4.03-5.5-9-5.5z"></path>
          </svg>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNav;
