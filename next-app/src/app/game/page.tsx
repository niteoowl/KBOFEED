export const runtime = 'edge';

export default function GamePage() {
  return (
    <>
      {/* Horizontal Game Bar (Mini Scores) */}
      <section className="game-day-bar" id="mini-game-bar">
          <div className="loading-state" style={{ padding: '20px', textAlign: 'center', width: '100%', color: 'var(--text-secondary)' }}>경기 정보를 불러오는 중...</div>
      </section>

      {/* Game Section with Sticky Nav */}
      <div className="game-section-wrapper">
          {/* Date Navigation Selector */}
          <section className="date-selector">
              <button id="prev-date" className="date-nav-btn"><i className="fas fa-chevron-left"></i></button>
              <div className="current-date-display" id="current-date-text">2026.05.09 (토)</div>
              <button id="next-date" className="date-nav-btn"><i className="fas fa-chevron-right"></i></button>
          </section>

          {/* Main Scoreboard (Wide Cards) */}
          <section id="game-list-container">
              <div className="loading-state" style={{ padding: '20px', textAlign: 'center', width: '100%', color: 'var(--text-secondary)' }}>경기 정보를 불러오는 중...</div>
          </section>
      </div>

      {/* Standings Section */}
      <section className="standings-section">
          <h3 className="section-title">정규리그 순위</h3>
          <div style={{ overflowX: 'auto' }}>
              <table className="standings-table">
                  <thead>
                      <tr>
                          <th>순위</th>
                          <th>팀명</th>
                          <th>승</th>
                          <th>패</th>
                          <th>무</th>
                          <th>승률</th>
                      </tr>
                  </thead>
                  <tbody id="standings-body">
                      {/* Dynamic content placeholder */}
                  </tbody>
              </table>
          </div>
      </section>

      {/* Baseball News Section */}
      <section className="news-section">
          <h3 className="section-title">주요 야구 뉴스</h3>
          <div className="news-item">
              <img src="https://images.unsplash.com/photo-1508344928928-7165b67de128?q=80&w=200&auto=format&fit=crop" className="news-thumb" alt="뉴스" />
              <div className="news-info">
                  <div className="news-title">'괴물투수' 류현진, 마침내 KBO 통산 100승 금자탑</div>
                  <div className="trend-category">스포츠서울 · 1시간 전</div>
              </div>
          </div>
          <div className="news-item">
              <img src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop" className="news-thumb" alt="뉴스" />
              <div className="news-info">
                  <div className="news-title">잠실 더비 예매 전쟁... 5분 만에 전석 매진</div>
                  <div className="trend-category">KBO 뉴스 · 3시간 전</div>
              </div>
          </div>
      </section>
    </>
  );
}
