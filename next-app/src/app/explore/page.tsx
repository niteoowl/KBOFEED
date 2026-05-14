import Link from 'next/link';
import SearchHeader from '@/components/search/SearchHeader';

export const runtime = 'edge';

export default function ExplorePage() {
  return (
    <>
      <SearchHeader title="탐색" />

      <section className="explore-section">
        {/* Categorized Trends - High Density Text */}
        <div className="trends-list">
            <h3 className="section-title" style={{ padding: '16px 16px 12px 16px', margin: 0, borderBottom: '1px solid var(--border-color)', fontSize: '20px', fontWeight: 800 }}>실시간 트렌드</h3>
            {[
              { category: "1 · 트렌딩", name: "잠실 더비", count: "12,304 게시물" },
              { category: "2 · 야구/스포츠", name: "김도영 30-30", count: "9,211 게시물" },
              { category: "3 · 야구/스포츠", name: "고척돔 전좌석 매진", count: "5,410 게시물" },
              { category: "4 · 트렌딩", name: "우천 취소", count: "4,028 게시물" },
              { category: "5 · 야구/스포츠", name: "김서현 160km", count: "3,119 게시물" },
              { category: "6 · 야구/스포츠", name: "비디오 판독", count: "2,980 게시물" },
              { category: "7 · 트렌딩", name: "역전 만루홈런", count: "2,105 게시물" },
              { category: "8 · 야구/스포츠", name: "스트라이크 존", count: "1,556 게시물" },
              { category: "9 · 트렌딩", name: "직관 날씨", count: "1,200 게시물" },
              { category: "10 · 트렌딩", name: "구단 굿즈", count: "958 게시물" }
            ].map((trend, idx) => (
              <div className="trend-item" key={idx} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', position: 'relative', cursor: 'pointer' }}>
                <div className="trend-category" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{trend.category}</div>
                <div className="trend-name" style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--text-primary)', margin: '2px 0' }}>{trend.name}</div>
                <div className="trend-count" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{trend.count}</div>
                <i className="fas fa-ellipsis-h" style={{ position: 'absolute', right: '16px', top: '16px', color: 'var(--text-secondary)' }}></i>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}
