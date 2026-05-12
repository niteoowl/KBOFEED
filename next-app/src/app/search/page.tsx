export const runtime = 'edge';

export default function SearchPage({ searchParams }: { searchParams: { q: string } }) {
  const query = searchParams.q || '';
  
  return (
    <>
      <div className="feed-header-group">
        <div className="feed-header">
          <h2 className="desktop-title">검색 결과: {query}</h2>
        </div>
        <div className="feed-tabs">
          <div className="feed-tab active">인기</div>
          <div className="feed-tab">최신</div>
          <div className="feed-tab">사용자</div>
          <div className="feed-tab">미디어</div>
        </div>
      </div>
      
      <div className="feed-content">
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
           "{query}"에 대한 검색 결과가 없습니다.
        </div>
      </div>
    </>
  );
}
