'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { KBO_TEAMS } from '@/lib/constants';

// Clean and map old/new/English team codes to actual KBO team logos
function getLogoUrl(teamName: string | null | undefined, emblemUrl?: string): string {
  if (!teamName) return emblemUrl || '/images/logo.png';
  const cleanName = teamName.toUpperCase().trim()
    .replace(/(트윈스|타이거즈|라이온즈|랜더스|베어스|다이노스|이글스|자이언츠|위즈)/g, '')
    .trim();
  
  const mappedCode: Record<string, string> = {
    'SS': '삼성', 'OB': '두산', 'HT': 'KIA', 'SK': 'SSG', 'LT': '롯데', 'WO': '키움', 'HH': '한화', 'KT': 'KT', 'NC': 'NC', 'LG': 'LG'
  };
  const finalCode = mappedCode[cleanName] || cleanName;

  const team = KBO_TEAMS.find(t => t.id === finalCode || t.fullName.includes(finalCode));
  if (team) return `/images/${team.file}.svg`;
  return emblemUrl || '/images/logo.png';
}

const VENUE_MAP: Record<string, string> = {
  'LG': '잠실', '두산': '잠실', '키움': '고척', 'SSG': '문학',
  'KT': '수원', '한화': '대전', '삼성': '대구', '롯데': '사직',
  'KIA': '광주', 'NC': '창원'
};

function getVenue(teamName: string | null | undefined): string {
  if (!teamName) return '경기장';
  const cleanName = teamName.replace(/(트윈스|타이거즈|라이온즈|랜더스|베어스|다이노스|이글스|자이언츠|위즈)/g, '').trim();
  return VENUE_MAP[cleanName] || '경기장';
}

interface Game {
  gameId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamScore: number | string;
  awayTeamScore: number | string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  statusInfo: string;
  statusCode: 'RESULT' | 'RUNNING' | 'BEFORE' | string;
  venue?: string;
}

interface Standing {
  rank: number;
  teamName: string;
  won: number;
  lost: number;
  tied: number;
  winPercentage: string | number;
  logoUrl?: string;
}

export default function GamePage() {
  // Use 2026-05-09 as default date since specification mentions it has multiple matches,
  // but if the date is later, we can default dynamically. Let's start with 2026-05-09.
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-05-09'));
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loadingGames, setLoadingGames] = useState<boolean>(true);
  const [loadingStandings, setLoadingStandings] = useState<boolean>(true);
  
  // Calendar Modal State
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(5); // May
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState<boolean>(false);

  // Formatting utilities
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date): string => {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const week = weekdays[date.getDay()];
    return `${year}.${month}.${day} (${week})`;
  };

  // 1. Fetching games for selected date
  const loadGames = useCallback(async (dateStr: string) => {
    setLoadingGames(true);
    try {
      console.log(`[GamePage] Fetching games for ${dateStr}...`);
      
      // Try Direct /api/kbo list first
      const res = await fetch(`/api/kbo?date=${dateStr}`);
      if (!res.ok) throw new Error('Failed to fetch from main list endpoint');
      const data = await res.json();
      
      let fetchedGames: Game[] = [];
      const apiGames = data.result?.games;

      if (Array.isArray(apiGames) && apiGames.length > 0) {
        fetchedGames = apiGames.map((game: any) => ({
          gameId: game.gameId,
          homeTeamName: game.homeTeamName,
          awayTeamName: game.awayTeamName,
          homeTeamScore: game.homeTeamScore,
          awayTeamScore: game.awayTeamScore,
          homeTeamLogo: game.homeTeamEmblemUrl,
          awayTeamLogo: game.awayTeamEmblemUrl,
          statusInfo: game.statusInfo,
          statusCode: game.statusCode,
          venue: game.stadium || getVenue(game.homeTeamName)
        }));
      } else {
        // Fallback to Hybrid calendar + details fetch if list endpoint is empty
        console.log('[GamePage] Main endpoint returned no games. Trying hybrid calendar fallback...');
        const calendarRes = await fetch(`/api/kbo/calendar?date=${dateStr}`);
        if (calendarRes.ok) {
          const calendarData = await calendarRes.json();
          const monthData = calendarData.result?.dates || [];
          const dayData = monthData.find((d: any) => d.ymd === dateStr);
          
          if (dayData && Array.isArray(dayData.gameInfos)) {
            const matchInfos = dayData.gameInfos.filter((g: any) => g.homeTeamCode && g.awayTeamCode);
            
            const detailedGames = await Promise.all(
              matchInfos.map(async (g: any) => {
                try {
                  const detailRes = await fetch(`/api/kbo/game?gameId=${g.gameId}`);
                  if (!detailRes.ok) return null;
                  const detailData = await detailRes.json();
                  const game = detailData.result?.game;
                  if (!game) return null;
                  
                  return {
                    gameId: game.gameId,
                    homeTeamName: game.homeTeamName,
                    awayTeamName: game.awayTeamName,
                    homeTeamScore: game.homeTeamScore,
                    awayTeamScore: game.awayTeamScore,
                    homeTeamLogo: game.homeTeamEmblemUrl,
                    awayTeamLogo: game.awayTeamEmblemUrl,
                    statusInfo: game.statusInfo,
                    statusCode: game.statusCode,
                    venue: game.stadium || getVenue(game.homeTeamName)
                  };
                } catch {
                  return null;
                }
              })
            );
            fetchedGames = detailedGames.filter((g): g is Game => g !== null);
          }
        }
      }
      
      setGames(fetchedGames);
    } catch (err) {
      console.error('[GamePage] Fetch error:', err);
      setGames([]);
    } finally {
      setLoadingGames(false);
    }
  }, []);

  // 2. Fetch Standings
  const loadStandings = useCallback(async () => {
    setLoadingStandings(true);
    try {
      const res = await fetch(`/api/kbo/rank?year=2026`);
      if (!res.ok) throw new Error('Standings fetch failed');
      const data = await res.json();
      
      const stats = data.result?.seasonTeamStats || [];
      const mappedStandings: Standing[] = stats.map((item: any) => ({
        rank: item.ranking,
        teamName: item.teamName,
        won: item.winGameCount,
        lost: item.loseGameCount,
        tied: item.drawnGameCount,
        winPercentage: item.wra,
        logoUrl: item.teamImageUrl
      }));
      setStandings(mappedStandings);
    } catch (err) {
      console.error('[GamePage] Standings error:', err);
    } finally {
      setLoadingStandings(false);
    }
  }, []);

  // 3. Fetch monthly calendar metadata for the selected year-month
  const loadCalendarMonth = useCallback(async (year: number, month: number) => {
    setLoadingCalendar(true);
    try {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const res = await fetch(`/api/kbo/calendar?date=${dateStr}`);
      if (!res.ok) throw new Error('Calendar fetch failed');
      const data = await res.json();
      setCalendarData(data.result?.dates || []);
    } catch (err) {
      console.error('[GamePage] Calendar month fetch error:', err);
      setCalendarData([]);
    } finally {
      setLoadingCalendar(false);
    }
  }, []);

  // Trigger loads on mount or date change
  useEffect(() => {
    const dateStr = formatDate(currentDate);
    loadGames(dateStr);
  }, [currentDate, loadGames]);

  useEffect(() => {
    loadStandings();
  }, [loadStandings]);

  // Load calendar monthly data if the calendar modal opens or month changes
  useEffect(() => {
    if (showCalendar) {
      loadCalendarMonth(calendarYear, calendarMonth);
    }
  }, [showCalendar, calendarYear, calendarMonth, loadCalendarMonth]);

  // Auto-refreshing logic for RUNNING / STARTED games
  useEffect(() => {
    const hasRunningGames = games.some(g => g.statusCode === 'RUNNING' || g.statusCode === 'STARTED');
    if (!hasRunningGames) return;

    console.log('[GamePage] Running games detected. Registering score poll (10s interval)...');
    const interval = setInterval(() => {
      loadGames(formatDate(currentDate));
    }, 10000);

    return () => clearInterval(interval);
  }, [games, currentDate, loadGames]);

  // Navigation handlers
  const handlePrevDate = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  // Calendar render helpers
  const handleCalendarDayClick = (ymdStr: string) => {
    const newDate = new Date(ymdStr);
    setCurrentDate(newDate);
    setCalendarYear(newDate.getFullYear());
    setCalendarMonth(newDate.getMonth() + 1);
    setShowCalendar(false);
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 1) {
      setCalendarMonth(12);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 12) {
      setCalendarMonth(1);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  // Calculate calendar grid days
  const getDaysInMonthGrid = () => {
    const firstDayIndex = new Date(calendarYear, calendarMonth - 1, 1).getDay();
    const totalDays = new Date(calendarYear, calendarMonth, 0).getDate();
    
    const grid = [];
    // Padding from previous month
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }
    // Days of current month
    for (let day = 1; day <= totalDays; day++) {
      const ymdStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      grid.push({ day, ymdStr });
    }
    return grid;
  };

  const isMonday = currentDate.getDay() === 1;

  return (
    <>
      {/* Horizontal Game Bar (Mini Scores) */}
      <section className="game-day-bar" id="mini-game-bar" style={{ gap: '16px', display: 'flex', alignItems: 'center' }}>
        {loadingGames ? (
          <div className="loading-state" style={{ padding: '8px 20px', textAlign: 'center', width: '100%', color: 'var(--text-secondary)' }}>
            경기 실시간 스코어 불러오는 중...
          </div>
        ) : games.length === 0 ? (
          <div className="no-mini-games" style={{ padding: '8px 20px', color: 'var(--text-secondary)', fontSize: '13px', width: '100%', textAlign: 'center' }}>
            {isMonday ? '월요일은 KBO 정기 휴식일입니다 ⚾' : '오늘 예정된 경기가 없습니다.'}
          </div>
        ) : (
          games.map(game => (
            <Link key={game.gameId} href={`/game/${game.gameId}`} className="mini-score-card" style={{ transition: 'transform 0.2s', display: 'block' }}>
              <div className="mini-team">
                <span className="mini-team-name">{game.awayTeamName}</span>
                <span className="mini-score">{game.statusCode === 'BEFORE' ? '-' : game.awayTeamScore}</span>
              </div>
              <div className="mini-team">
                <span className="mini-team-name">{game.homeTeamName}</span>
                <span className="mini-score">{game.statusCode === 'BEFORE' ? '-' : game.homeTeamScore}</span>
              </div>
              <div className="mini-status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                {(game.statusCode === 'RUNNING' || game.statusCode === 'STARTED') && (
                  <span className="live-dot-pulse" style={{ width: '6px', height: '6px', backgroundColor: '#ff4d6d', borderRadius: '50%', display: 'inline-block', animatePulse: 'pulse 1s infinite' }}></span>
                )}
                {game.statusInfo}
              </div>
            </Link>
          ))
        )}
      </section>

      {/* Game Section with Sticky Nav */}
      <div className="game-section-wrapper" style={{ padding: '0 0 20px 0' }}>
        {/* Date Navigation Selector */}
        <section className="date-selector" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
          <button id="prev-date" className="date-nav-btn" onClick={handlePrevDate} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '8px', fontSize: '16px', color: 'var(--text-primary)' }}>
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <div 
            className="current-date-display" 
            id="current-date-text" 
            onClick={() => setShowCalendar(true)}
            style={{ 
              fontSize: '17px', 
              fontWeight: 800, 
              color: 'var(--text-primary)', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              backgroundColor: 'var(--hover-bg)',
              transition: 'background-color 0.2s'
            }}
          >
            <span>{formatDisplayDate(currentDate)}</span>
            <i className="far fa-calendar-alt" style={{ fontSize: '15px', color: 'var(--primary-color)' }}></i>
          </div>
          
          <button id="next-date" className="date-nav-btn" onClick={handleNextDate} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '8px', fontSize: '16px', color: 'var(--text-primary)' }}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </section>

        {/* Main Scoreboard (Wide Cards) */}
        <section id="game-list-container">
          {loadingGames ? (
            <div style={{ padding: '24px 20px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-card-wide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div className="skeleton-item" style={{ width: '80px', height: '80px', borderRadius: '50%' }}></div>
                  <div className="skeleton-item" style={{ flex: 1, height: '40px', margin: '0 30px', borderRadius: '8px' }}></div>
                  <div className="skeleton-item" style={{ width: '80px', height: '80px', borderRadius: '50%' }}></div>
                </div>
              ))}
            </div>
          ) : isMonday ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', width: '100%', backgroundColor: 'var(--bg-primary)', borderBottom: '8px solid var(--divider-color)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚾🔋</div>
              <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>월요일은 경기가 없어요!</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>선수들이 재충전 중입니다. 화요일에 다시 만나요.</div>
            </div>
          ) : games.length === 0 ? (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-secondary)', width: '100%', borderBottom: '8px solid var(--divider-color)' }}>
              해당 날짜에 예정된 KBO 프로야구 경기가 없습니다.
            </div>
          ) : (
            games.map(game => (
              <Link key={game.gameId} href={`/game/${game.gameId}`} className="game-card-wide" style={{ transition: 'background-color 0.2s', display: 'flex', borderBottom: '8px solid var(--divider-color)' }}>
                <div className="team-info">
                  <img 
                    src={getLogoUrl(game.awayTeamName, game.awayTeamLogo)} 
                    alt={game.awayTeamName} 
                    className="team-logo-large"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/logo.png'; }}
                  />
                  <span className="team-name-large">{game.awayTeamName}</span>
                  <span className="score-large">{game.statusCode === 'BEFORE' ? '-' : game.awayTeamScore}</span>
                </div>
                
                <div className="game-mid">
                  <div 
                    className={`game-status-badge ${game.statusCode === 'RUNNING' || game.statusCode === 'STARTED' ? 'live' : ''}`}
                    style={game.statusCode === 'RUNNING' || game.statusCode === 'STARTED' ? { backgroundColor: 'var(--hover-bg-light)', color: 'var(--accent-color)' } : {}}
                  >
                    {game.statusInfo}
                  </div>
                  <div className="game-venue">{game.venue || getVenue(game.homeTeamName)} 구장</div>
                </div>
                
                <div className="team-info">
                  <img 
                    src={getLogoUrl(game.homeTeamName, game.homeTeamLogo)} 
                    alt={game.homeTeamName} 
                    className="team-logo-large"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/logo.png'; }}
                  />
                  <span className="team-name-large">{game.homeTeamName}</span>
                  <span className="score-large">{game.statusCode === 'BEFORE' ? '-' : game.homeTeamScore}</span>
                </div>
              </Link>
            ))
          )}
        </section>
      </div>

      {/* Standings Section */}
      <section className="standings-section" style={{ borderBottom: '8px solid var(--divider-color)', padding: '24px 20px', backgroundColor: 'var(--bg-primary)' }}>
        <h3 className="section-title" style={{ padding: '0 0 12px 0', fontSize: '18px', fontWeight: 800 }}>정규리그 팀 순위 (2026)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="standings-table">
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th className="rank-num" style={{ fontWeight: 800 }}>순위</th>
                <th>팀명</th>
                <th style={{ textAlign: 'center' }}>승</th>
                <th style={{ textAlign: 'center' }}>패</th>
                <th style={{ textAlign: 'center' }}>무</th>
                <th style={{ textAlign: 'center' }}>승률</th>
              </tr>
            </thead>
            <tbody>
              {loadingStandings ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td className="rank-num"><div className="skeleton-item" style={{ width: '20px', height: '20px', borderRadius: '4px' }}></div></td>
                    <td><div className="skeleton-item" style={{ width: '120px', height: '20px', borderRadius: '4px' }}></div></td>
                    <td style={{ textAlign: 'center' }}><div className="skeleton-item" style={{ width: '20px', height: '20px', borderRadius: '4px', margin: '0 auto' }}></div></td>
                    <td style={{ textAlign: 'center' }}><div className="skeleton-item" style={{ width: '20px', height: '20px', borderRadius: '4px', margin: '0 auto' }}></div></td>
                    <td style={{ textAlign: 'center' }}><div className="skeleton-item" style={{ width: '20px', height: '20px', borderRadius: '4px', margin: '0 auto' }}></div></td>
                    <td style={{ textAlign: 'center' }}><div className="skeleton-item" style={{ width: '40px', height: '20px', borderRadius: '4px', margin: '0 auto' }}></div></td>
                  </tr>
                ))
              ) : standings.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>순위표 데이터를 불러올 수 없습니다.</td>
                </tr>
              ) : (
                standings.map(team => (
                  <tr key={team.teamName} style={{ transition: 'background-color 0.2s' }}>
                    <td className="rank-num" style={{ fontWeight: 800 }}>{team.rank}</td>
                    <td>
                      <div className="team-cell">
                        <img 
                          src={getLogoUrl(team.teamName, team.logoUrl)} 
                          alt={team.teamName}
                          onError={(e) => { (e.target as HTMLImageElement).src = '/images/logo.png'; }}
                        />
                        <span>{team.teamName}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 500 }}>{team.won}</td>
                    <td style={{ textAlign: 'center', fontWeight: 500 }}>{team.lost}</td>
                    <td style={{ textAlign: 'center', fontWeight: 500 }}>{team.tied}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--primary-color)' }}>{team.winPercentage}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Baseball News Section */}
      <section className="news-section" style={{ padding: '24px 20px', backgroundColor: 'var(--bg-primary)' }}>
        <h3 className="section-title" style={{ padding: '0 0 16px 0', fontSize: '18px', fontWeight: 800 }}>주요 야구 뉴스</h3>
        <div className="news-item" style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
          <img src="https://images.unsplash.com/photo-1508344928928-7165b67de128?q=80&w=200&auto=format&fit=crop" className="news-thumb" alt="뉴스" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px' }} />
          <div className="news-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
            <div className="news-title" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>'괴물투수' 류현진, 마침내 KBO 통산 100승 금자탑</div>
            <div className="trend-category" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>스포츠서울 · 1시간 전</div>
          </div>
        </div>
        <div className="news-item" style={{ display: 'flex', gap: '16px', padding: '12px 0', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}>
          <img src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=200&auto=format&fit=crop" className="news-thumb" alt="뉴스" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px' }} />
          <div className="news-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px' }}>
            <div className="news-title" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>잠실 더비 예매 전쟁... 5분 만에 전석 매진</div>
            <div className="trend-category" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>KBO 뉴스 · 3시간 전</div>
          </div>
        </div>
      </section>

      {/* Premium Interactive Calendar Modal */}
      {showCalendar && (
        <div 
          className="calendar-modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowCalendar(false)}
        >
          <div 
            className="calendar-modal-content"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '380px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              style={{ 
                padding: '20px 20px 12px 20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-color)'
              }}
            >
              <h4 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {calendarYear}년 {calendarMonth}월 경기 일정
              </h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handlePrevMonth}
                  style={{ border: 'none', background: 'var(--hover-bg)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <i className="fas fa-chevron-left" style={{ fontSize: '12px', color: 'var(--text-primary)' }}></i>
                </button>
                <button 
                  onClick={handleNextMonth}
                  style={{ border: 'none', background: 'var(--hover-bg)', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <i className="fas fa-chevron-right" style={{ fontSize: '12px', color: 'var(--text-primary)' }}></i>
                </button>
              </div>
            </div>

            {/* Calendar Grid Container */}
            <div style={{ padding: '16px' }}>
              {/* Day of Week Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '8px' }}>
                {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                  <span 
                    key={day} 
                    style={{ 
                      fontSize: '12px', 
                      fontWeight: 700, 
                      color: idx === 0 ? '#ff4d6d' : idx === 6 ? 'var(--primary-color)' : 'var(--text-secondary)',
                      padding: '4px 0' 
                    }}
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* Monthly Days Grid */}
              {loadingCalendar ? (
                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  일정을 불러오고 있습니다...
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '6px' }}>
                  {getDaysInMonthGrid().map((cell, idx) => {
                    if (!cell) return <div key={`empty-${idx}`} />;
                    
                    const calendarDayInfo = calendarData.find(d => d.ymd === cell.ymdStr);
                    const gameCount = calendarDayInfo ? calendarDayInfo.gameCount : 0;
                    const isSelected = formatDate(currentDate) === cell.ymdStr;
                    
                    // Highlight colors
                    let dateColor = 'var(--text-primary)';
                    if (idx % 7 === 0) dateColor = '#ff4d6d'; // Sunday
                    if (idx % 7 === 6) dateColor = 'var(--primary-color)'; // Saturday

                    return (
                      <div 
                        key={cell.ymdStr}
                        onClick={() => handleCalendarDayClick(cell.ymdStr)}
                        style={{
                          aspectRatio: '1',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--primary-color)' : 'transparent',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                      >
                        <span 
                          style={{ 
                            fontSize: '14px', 
                            fontWeight: isSelected ? 800 : 500, 
                            color: isSelected ? '#ffffff' : dateColor 
                          }}
                        >
                          {cell.day}
                        </span>
                        
                        {/* Game Count Badge Marker */}
                        {gameCount > 0 && (
                          <span 
                            style={{ 
                              fontSize: '9px', 
                              fontWeight: 800,
                              color: isSelected ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)',
                              transform: 'scale(0.85)',
                              marginTop: '2px',
                              lineHeight: 1
                            }}
                          >
                            {gameCount}G
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowCalendar(false)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '13px',
                  padding: '6px 12px',
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* slideUp keyframe style injection */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />
    </>
  );
}
