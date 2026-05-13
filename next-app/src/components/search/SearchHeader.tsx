'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { searchUsers } from '@/app/actions/post';

interface SearchHeaderProps {
  initialQuery?: string;
  title?: string;
}

export default function SearchHeader({ initialQuery = '', title = '탐색' }: SearchHeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [userResults, setUserResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Handle body class for mobile search overlay
  useEffect(() => {
    if (isFocused) {
      document.body.classList.add('search-open');
    } else {
      document.body.classList.remove('search-open');
    }
    return () => document.body.classList.remove('search-open');
  }, [isFocused]);

  // 실시간 유저 검색 (디바운스)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (!query.trim() || query.trim().length < 1) {
      setUserResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(query.trim());
        setUserResults(results);
      } catch {
        setUserResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsFocused(false);
    }
  };

  const selectSuggestion = (name: string) => {
    setQuery(name);
    router.push(`/search?q=${encodeURIComponent(name)}`);
    setIsFocused(false);
  };

  const goToUser = (username: string) => {
    setIsFocused(false);
    router.push(`/@${username}`);
  };

  return (
    <header className="feed-header-group">
      <div className="feed-header">
        <div className="header-left">
          <button 
            onClick={() => {
              if (isFocused) setIsFocused(false);
              else router.back();
            }} 
            className="header-back-btn" 
            style={{ background: 'none', border: 'none', padding: 0 }}
          >
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
        <div className="search-input-wrapper">
          <i className="fas fa-arrow-left search-back-btn" onClick={() => setIsFocused(false)}></i>
          <div className="search-bar">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="크보피드 검색" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
              onFocus={() => setIsFocused(true)}
              id="mobile-search-input"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Search Suggestions */}
        <div className={`search-suggestions ${isFocused ? 'active' : ''}`}>
          {/* 실시간 유저 검색 결과 */}
          {userResults.length > 0 && (
            <>
              {userResults.slice(0, 5).map((user: any) => (
                <div
                  key={user.id}
                  className="suggestion-item"
                  onClick={() => goToUser(user.username)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <div
                    style={{
                      backgroundImage: user.avatarUrl
                        ? `url(${user.avatarUrl})`
                        : `url(https://i.pravatar.cc/150?u=${user.username})`,
                      backgroundSize: 'cover',
                      width: '32px',
                      height: '32px',
                      minWidth: '32px',
                      borderRadius: '50%',
                    }}
                  />
                  <div>
                    <span className="suggestion-name" style={{ display: 'block', fontWeight: 600 }}>
                      {user.displayName || user.username}
                    </span>
                    <span className="suggestion-category" style={{ fontSize: '13px' }}>@{user.username}</span>
                  </div>
                </div>
              ))}
            </>
          )}
          {/* 기본 제안 (쿼리가 비었거나 유저 결과가 없을 때) */}
          {userResults.length === 0 && !searching && (
            <>
              <div className="suggestion-item" onClick={() => selectSuggestion('#잠실더비')}>
                <span className="suggestion-category">실시간 트렌드</span>
                <span className="suggestion-name">#잠실더비</span>
                <span className="suggestion-count">12,4K 게시물</span>
              </div>
              <div className="suggestion-item" onClick={() => selectSuggestion('#고척돔_매진')}>
                <span className="suggestion-category">실시간 화제</span>
                <span className="suggestion-name">#고척돔_매진</span>
                <span className="suggestion-count">3,102 게시물</span>
              </div>
              <div className="suggestion-item" onClick={() => selectSuggestion('KIA 타이거즈')}>
                <span className="suggestion-category">커뮤니티</span>
                <span className="suggestion-name">KIA 타이거즈 원정 응원단</span>
                <span className="suggestion-count">12.4K 멤버</span>
              </div>
              <div className="suggestion-item" onClick={() => selectSuggestion('끝내기 홈런')}>
                <span className="suggestion-category">인기 키워드</span>
                <span className="suggestion-name">끝내기 홈런</span>
                <span className="suggestion-count">8.2K 게시물</span>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
