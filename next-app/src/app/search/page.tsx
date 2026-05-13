import Link from 'next/link';
import PostList from '@/components/feed/PostList';
import SearchHeader from '@/components/search/SearchHeader';
import { Suspense } from 'react';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';
  
  return (
    <>
      <SearchHeader initialQuery={query} title="검색 결과" />

      {/* Search Result Tabs (matches search.html) */}
      <div className="feed-tabs search-tabs">
        <div className="feed-tab active">전체</div>
        <div className="feed-tab">인기</div>
        <div className="feed-tab">최신</div>
        <div className="feed-tab">사용자</div>
        <div className="feed-tab">미디어</div>
      </div>
      
      <div id="search-results-container" className="active" style={{ minHeight: '400px' }}>
         <Suspense fallback={<div style={{ padding: 20, textAlign: 'center' }}>검색 중...</div>}>
            <PostList query={query} />
         </Suspense>
      </div>
    </>
  );
}


