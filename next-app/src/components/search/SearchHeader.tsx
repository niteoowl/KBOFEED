'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SearchHeaderProps {
  initialQuery?: string;
  title?: string;
}

export default function SearchHeader({ initialQuery = '', title = '탐색' }: SearchHeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <header className="feed-header-group">
      <div className="feed-header">
        <div className="header-left">
          <button onClick={() => router.back()} className="header-back-btn" style={{ background: 'none', border: 'none', padding: 0 }}>
            <i className="fas fa-arrow-left"></i>
          </button>
        </div>
        <div className="mobile-logo-container">
          <Link href="/">
            <img src="/images/logo.png" alt="크보피드 로고" className="mobile-logo" />
          </Link>
        </div>
        <h2 className="desktop-title" style={{ flex: 2, textAlign: 'center' }}>{title}</h2>
        <div className="header-right"></div>
      </div>
      
      {/* Mobile Search Bar */}
      <div className="mobile-search-container">
        <div className="search-input-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="search-bar" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <i className="fas fa-search" style={{ marginRight: '8px' }}></i>
            <input 
              type="text" 
              placeholder="크보피드 검색" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
              id="mobile-search-input"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none' }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
