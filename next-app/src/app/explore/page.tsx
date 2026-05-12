import Link from 'next/link';

export const runtime = 'edge';

export default function ExplorePage() {
  return (
    <>
      <header className="feed-header-group">
        <div className="feed-header">
          <div className="header-left"></div>
          <div className="mobile-logo-container">
            <Link href="/"><img src="/images/logo.png" alt="크보피드 로고" className="mobile-logo" /></Link>
          </div>
          <h2 className="desktop-title" style={{ flex: 2, textAlign: 'center' }}>탐색</h2>
          <div className="header-right"></div>
        </div>
        
        {/* Mobile Search Bar (matches ui.js) */}
        <div className="mobile-search-container">
            <div className="search-input-wrapper">
                <i className="fas fa-arrow-left search-back-btn"></i>
                <div className="search-bar">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="크보피드 검색" id="mobile-search-input" />
                </div>
            </div>
        </div>
      </header>

      <section className="explore-section">
        {/* Highlight Banner */}
        <div className="explore-banner">
            <img src="https://images.unsplash.com/photo-1508344928928-7165b67de128?q=80&w=1000&auto=format&fit=crop" alt="야구 경기장" />
            <div className="banner-text">
                <h3>실시간 KBO 화제</h3>
                <p>지금 가장 뜨거운 야구 소식을 확인하세요</p>
            </div>
        </div>

        {/* Trending Photos Grid */}
        <div className="trends-list">
            <h3 className="section-title">오늘의 베스트 컷</h3>
            <div className="explore-media-grid">
                <div className="media-cell" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1516731415730-0c607149933a?auto=format&fit=crop&w=300')" }}><i className="fas fa-play"></i></div>
                <div className="media-cell" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=300')" }}></div>
                <div className="media-cell" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1533038590840-1cde6b66b721?auto=format&fit=crop&w=300')" }}><i className="far fa-image"></i></div>
                <div className="media-cell" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1510531704581-5b2870972060?auto=format&fit=crop&w=300')" }}></div>
                <div className="media-cell" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=300')" }}></div>
                <div className="media-cell" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1471295253337-3ceaaedca401?auto=format&fit=crop&w=300')" }}></div>
            </div>
        </div>

        {/* Categorized Trends */}
        <div className="trends-list">
            <h3 className="section-title">구장별 핫이슈</h3>
            <div className="trend-item">
                <div className="trend-category">수원 · 뉴스</div>
                <div className="trend-name">KT 위즈파크 오늘 전좌석 매진</div>
                <div className="trend-count">3,102 게시물</div>
            </div>
            <div className="trend-item">
                <div className="trend-category">잠실 · 날씨</div>
                <div className="trend-name">잠실 더비, 우천 취소 가능성?</div>
                <div className="trend-count">1,822 게시물</div>
            </div>
        </div>

        <div className="trends-list">
            <h3 className="section-title">주목받는 선수</h3>
            <div className="trend-item">
                <div className="trend-category">한화 · 화제</div>
                <div className="trend-name">김서현 160km 광속구 폭발</div>
                <div className="trend-count">12.4K 게시물</div>
            </div>
            <div className="trend-item">
                <div className="trend-category">KIA · 기록</div>
                <div className="trend-name">김도영 30-30 달성 초읽기</div>
                <div className="trend-count">8,203 게시물</div>
            </div>
        </div>
      </section>
    </>
  );
}
