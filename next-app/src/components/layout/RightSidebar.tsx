'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const RightSidebar = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
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
              id="pc-search-input"
            />
          </form>
        </div>
        {/* Search Suggestions */}
        <div className="search-suggestions" id="pc-search-suggestions">
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
