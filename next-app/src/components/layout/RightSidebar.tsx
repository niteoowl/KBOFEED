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
      <form onSubmit={handleSearch} className="search-container">
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input 
            type="text" 
            placeholder="검색" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </form>

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
        <div className="p-4 text-center text-sm text-zinc-500">
          로그인 후 추천 팔로우를 확인하세요.
        </div>
      </section>
    </aside>
  );
};

export default RightSidebar;
