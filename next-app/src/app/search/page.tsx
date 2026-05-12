import Link from 'next/link';
import PostList from '@/components/feed/PostList';

export const runtime = 'edge';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  
  return (
    <>
      <header className="feed-header-group">
        <div className="feed-header">
          <div className="header-left">
            <Link href="/" className="header-back-btn">
              <i className="fas fa-arrow-left"></i>
            </Link>
          </div>
          <div className="mobile-logo-container">
            <Link href="/"><img src="/images/logo.png" alt="크보피드 로고" className="mobile-logo" /></Link>
          </div>
          <h2 className="desktop-title" style={{ flex: 2, textAlign: 'center' }}>검색 결과</h2>
          <div className="header-right"></div>
        </div>
        
        {/* Mobile Search Bar in Header (matches ui.js for fidelity) */}
        <div className="mobile-search-container">
            <div className="search-input-wrapper">
                <i className="fas fa-arrow-left search-back-btn"></i>
                <div className="search-bar">
                    <i className="fas fa-search"></i>
                    <input type="text" placeholder="크보피드 검색" defaultValue={query} id="mobile-search-input" />
                </div>
            </div>
        </div>
      </header>

      {/* Search Result Tabs (matches search.html) */}
      <div className="feed-tabs search-tabs">
        <div className="feed-tab active">전체</div>
        <div className="feed-tab">인기</div>
        <div className="feed-tab">최신</div>
        <div className="feed-tab">사용자</div>
        <div className="feed-tab">미디어</div>
      </div>
      
      <div id="search-results-container" className="active" style={{ minHeight: '400px' }}>
         <PostList />
      </div>
    </>
  );
}
