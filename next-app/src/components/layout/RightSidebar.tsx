'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { searchUsers } from '@/app/actions/post';

const RightSidebar = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 실시간 유저 검색 (디바운스)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (!query.trim()) {
      setUserResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(query.trim());
        setUserResults(results);
      } catch {
        setUserResults([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsFocused(false);
    }
  };

  const goToUser = (username: string) => {
    setIsFocused(false);
    setQuery('');
    router.push(`/@${username}`);
  };

  return (
<aside className="right-sidebar">
      <div className="search-container">
        <div className="search-bar-sticky-wrapper">
          <form onSubmit={handleSearch} className="search-bar">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="검색" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              id="pc-search-input"
              autoComplete="off"
            />
          </form>
        </div>
        {/* Search Suggestions with live user search */}
        <div
          className="search-suggestions"
          id="pc-search-suggestions"
          style={{ display: isFocused && (userResults.length > 0 || query.trim()) ? 'block' : undefined }}
        >
          {userResults.length > 0 ? (
            userResults.slice(0, 5).map((user: any) => (
              <div
                key={user.id}
                className="suggestion-item"
                onClick={() => goToUser(user.username)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
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
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                    {user.displayName || user.username}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>@{user.username}</div>
                </div>
              </div>
            ))
          ) : query.trim() ? (
            <div className="suggestion-item" style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
              '{query}'에 대한 사용자 결과 없음
            </div>
          ) : (
            <>
              <div className="suggestion-item">
                <span className="suggestion-category">트렌드 중</span>
                <span className="suggestion-name">#잠실더비</span>
                <span className="suggestion-count">12,402 게시물</span>
              </div>
              <div className="suggestion-item">
                <span className="suggestion-category">실시간 화제</span>
                <span className="suggestion-name">끝내기 홈런 실황</span>
                <span className="suggestion-count">5,201 게시물</span>
              </div>
            </>
          )}
        </div>
      </div>

      <section className="trends-container">
        <h3 className="section-title">최신 야구 뉴스</h3>
        <div className="trend-item">
          <div className="trend-category">뉴스 · 실시간</div>
          <div className="trend-name">'홈런 공동 선두' 강백호, 올시즌 홈런왕 가나</div>
          <div className="trend-count">2,402명이 읽음</div>
        </div>
        <div className="trend-item">
          <div className="trend-category">뉴스 · 실시간</div>
          <div className="trend-name">한화, 류현진 복귀 후 관중 수 30% 증가</div>
          <div className="trend-count">5,102명이 읽음</div>
        </div>
      </section>

      <section className="trends-container">
        <h3 className="section-title">나를 위한 트렌드</h3>
        <div className="trend-item">
          <div className="trend-category">트렌드 중</div>
          <div className="trend-name">잠실더비</div>
          <div className="trend-count">12.4K 게시물</div>
        </div>
        <div className="trend-item">
          <div className="trend-category">트렌드 중</div>
          <div className="trend-name">9회말 역전패</div>
          <div className="trend-count">8,203 게시물</div>
        </div>
      </section>

      <section className="trends-container">
        <h3 className="section-title">추천 팔로우</h3>
        <div className="follow-item">
            <div className="follow-info">
                <div className="user-avatar" style={{ backgroundImage: "url('https://i.pravatar.cc/150?u=5')", backgroundSize: 'cover', width: '40px', height: '40px' }}></div>
                <div className="follow-text">
                    <div className="follow-name">KIA 타이거즈</div>
                    <div className="follow-username">@kiatigers</div>
                </div>
            </div>
            <button className="follow-btn">팔로우</button>
        </div>
        <div className="follow-item">
            <div className="follow-info">
                <div className="user-avatar" style={{ backgroundImage: "url('https://i.pravatar.cc/150?u=6')", backgroundSize: 'cover', width: '40px', height: '40px' }}></div>
                <div className="follow-text">
                    <div className="follow-name">삼성 라이온즈</div>
                    <div className="follow-username">@samsunglions</div>
                </div>
            </div>
            <button className="follow-btn">팔로우</button>
        </div>
      </section>
    </aside>
  );
};

export default RightSidebar;
