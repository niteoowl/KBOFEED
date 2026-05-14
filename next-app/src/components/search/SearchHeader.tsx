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
        </div>
      </div>
    </header>
  );
}
