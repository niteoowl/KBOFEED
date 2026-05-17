'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { KBO_TEAMS } from '@/lib/constants';

// Clean and map team name/code to emblem URL
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

const TEAM_COLOR_MAP: Record<string, string> = {
  'LG': '#8B001B', 'KIA': '#9D0124', '삼성': '#053673', 'SSG': '#A30B24',
  '두산': '#0E0D24', 'NC': '#05142B', '한화': '#E65C00', '롯데': '#001F40',
  'KT': '#000000', '키움': '#63001C'
};

function getTeamColor(teamName: string | null | undefined): string {
  if (!teamName) return '#2C5DBE';
  const cleanName = teamName.toUpperCase().trim()
    .replace(/(트윈스|타이거즈|라이온즈|랜더스|베어스|다이노스|이글스|자이언츠|위즈)/g, '')
    .trim();
  
  const mappedCode: Record<string, string> = {
    'SS': '삼성', 'OB': '두산', 'HT': 'KIA', 'SK': 'SSG', 'LT': '롯데', 'WO': '키움', 'HH': '한화', 'KT': 'KT', 'NC': 'NC', 'LG': 'LG'
  };
  const finalCode = mappedCode[cleanName] || cleanName;
  return TEAM_COLOR_MAP[finalCode] || '#2C5DBE';
}

interface PageProps {
  params: Promise<{ gameId: string }>;
}

export default function GameDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const gameId = resolvedParams.gameId;

  const [relayData, setRelayData] = useState<any>(null);
  const [gameDetail, setGameDetail] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'relay' | 'cheer' | 'lineup' | 'analysis'>('relay');
  const [inningFilter, setInningFilter] = useState<string>('all');
  
  // Custom interactive cheer board mock state
  const [cheerMsg, setCheerMsg] = useState<string>('');
  const [cheerList, setCheerList] = useState<Array<{ id: number; user: string; text: string; team: string; time: string }>>([
    { id: 1, user: '이글스팬', text: '한화 화이팅! 오늘 8회 극적인 역전승 대단했다 🧡🦅', team: '한화', time: '10분 전' },
    { id: 2, user: '트윈스파워', text: '엘지 선수들 끝까지 포기하지 말고 내일 경기 잡읍시다!', team: 'LG', time: '8분 전' },
    { id: 3, user: '라이온킹', text: '삼성 라이온즈 삼진 아웃 대박!! 투수전 끝내주네 🦁💙', team: '삼성', time: '5분 전' },
  ]);

  const loadAllData = useCallback(async () => {
    try {
      const [relayRes, detailRes] = await Promise.all([
        fetch(`/api/kbo/relay?gameId=${gameId}`),
        fetch(`/api/kbo/game?gameId=${gameId}`)
      ]);

      let relayJson = null;
      let detailJson = null;

      if (relayRes.ok) {
        const rData = await relayRes.json();
        relayJson = rData.result;
      }

      if (detailRes.ok) {
        const dData = await detailRes.json();
        detailJson = dData.result?.game;
      }

      if (relayJson) setRelayData(relayJson);
      if (detailJson) setGameDetail(detailJson);
    } catch (err) {
      console.error('[GameDetailPage] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Polling updates every 5 seconds if the game is active (RUNNING or STARTED)
  useEffect(() => {
    if (!gameDetail) return;
    const isGameActive = gameDetail.statusCode === 'RUNNING' || gameDetail.statusCode === 'STARTED';
    if (!isGameActive) return;

    console.log('[GameDetailPage] Game active. Polling relay updates every 5s...');
    const interval = setInterval(() => {
      loadAllData();
    }, 5000);

    return () => clearInterval(interval);
  }, [gameDetail, loadAllData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '16px', color: 'var(--text-secondary)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>경기 상세 정보 및 실시간 중계 로딩 중...</span>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  if (!gameDetail) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>경기를 찾을 수 없습니다</div>
        <div style={{ fontSize: '14px', marginBottom: '20px' }}>요청하신 경기 상세 정보가 존재하지 않거나 서버 점검 중입니다.</div>
        <Link href="/game" style={{ padding: '10px 20px', backgroundColor: 'var(--primary-color)', color: '#fff', borderRadius: '20px', fontWeight: 700 }}>
          경기 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const gameState = relayData?.currentGameState || {};
  const relayInfo = relayData?.textRelayData || {};
  
  const awayName = gameDetail.awayTeamName;
  const homeName = gameDetail.homeTeamName;
  const isResult = gameDetail.statusCode === 'RESULT';
  const isBefore = gameDetail.statusCode === 'BEFORE';

  const awayColor = getTeamColor(awayName);
  const homeColor = getTeamColor(homeName);

  // Score fallbacks
  const awayScore = gameState.awayScore !== undefined ? gameState.awayScore : (gameDetail.awayTeamScore || 0);
  const homeScore = gameState.homeScore !== undefined ? gameState.homeScore : (gameDetail.homeTeamScore || 0);

  // Inning score lists
  const homeInnings = gameDetail.homeTeamScoreByInning || [];
  const awayInnings = gameDetail.awayTeamScoreByInning || [];
  const [hR, hH, hE, hB] = gameDetail.homeTeamRheb || [0, 0, 0, 0];
  const [aR, aH, aE, aB] = gameDetail.awayTeamRheb || [0, 0, 0, 0];

  // Parse YYYYMMDD date for display
  const dateStr = gameDetail.gameId ? 
    `${gameDetail.gameId.substring(4, 6)}.${gameDetail.gameId.substring(6, 8)} 18:30` : '';

  // Get active text relay array
  const rawRelays = relayInfo?.textRelays || relayData?.textRelays || [];
  
  // Extract latest player info for cards
  const latestGroup = rawRelays[0];
  const activePlayersInfo = latestGroup?.textOptions?.[0]?.currentPlayersInfo || {};
  const pPlayer = activePlayersInfo.away?.playerType === 'pitcher' ? activePlayersInfo.away : activePlayersInfo.home;
  const bPlayer = activePlayersInfo.away?.playerType === 'batter' ? activePlayersInfo.away : activePlayersInfo.home;

  const pName = pPlayer?.currentGamePlayerStats?.pitcherName || gameDetail.homeStarterName || '투수';
  const bName = bPlayer?.currentGamePlayerStats?.batterName || gameDetail.awayStarterName || '타자';
  const bSide = bPlayer?.currentGamePlayerStats?.batterSide || 'R';

  // Coordinate mapping for Strike Zone
  const ptsOptions = latestGroup?.ptsOptions || [];

  // Filter text relays based on selected inning
  const getFilteredRelays = () => {
    const list: any[] = [];
    rawRelays.forEach((group: any) => {
      const options = Array.isArray(group.textOptions) ? group.textOptions : [];
      options.forEach((opt: any) => {
        list.push({
          ...opt,
          inn: group.inn,
          homeOrAway: group.homeOrAway
        });
      });
    });

    if (inningFilter === 'score') {
      return list.filter(item => 
        item.text?.includes('득점') || item.text?.includes('홈런') || item.text?.includes('점차')
      );
    } else if (inningFilter !== 'all') {
      return list.filter(item => String(item.inn) === inningFilter);
    }
    return list;
  };

  // Generate Inning filtering sub-tabs
  const maxInning = Math.max(9, homeInnings.length, awayInnings.length);
  const inningTabs = Array.from({ length: maxInning }, (_, i) => i + 1);

  // Handle cheer submission
  const handleCheerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cheerMsg.trim()) return;
    const newCheer = {
      id: Date.now(),
      user: '나크보팬',
      text: cheerMsg,
      team: '한화', // mock team choice
      time: '방금 전',
    };
    setCheerList([newCheer, ...cheerList]);
    setCheerMsg('');
  };

  return (
    <div className="live-container" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
      
      {/* 1. Header with back button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
        <Link href="/game" style={{ fontSize: '18px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
          <i className="fas fa-arrow-left"></i>
        </Link>
        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>실시간 중계</span>
      </div>

      {/* 2. Unified Master Scoreboard Card (Stunning Angled Gradient) */}
      <section 
        className="master-scoreboard-card" 
        style={{
          margin: '12px',
          borderRadius: '16px',
          color: '#fff',
          overflow: 'hidden',
          boxShadow: 'var(--card-shadow)',
          background: `linear-gradient(105deg, ${awayColor} 49.9%, rgba(255,255,255,0.15) 50%, ${homeColor} 50.1%)`,
          padding: '20px 16px',
          position: 'relative'
        }}
      >
        <div className="ms-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          
          {/* Away Team Info */}
          <div className="ms-team-section away" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', textAlign: 'right' }}>
            <div className="ms-team-info" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="ms-team-name" style={{ fontSize: '18px', fontWeight: 900 }}>{awayName}</span>
              <span className="ms-pitcher-label" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                {gameDetail.losePitcherName ? `패-${gameDetail.losePitcherName}` : `선발-${gameDetail.awayStarterName || '-'}`}
              </span>
            </div>
            <img src={getLogoUrl(awayName)} alt={awayName} className="ms-logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            <span className="ms-score-large" style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', marginLeft: '12px', minWidth: '40px', textAlign: 'center' }}>
              {isBefore ? '-' : awayScore}
            </span>
          </div>

          {/* Central Match Status */}
          <div className="ms-center-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '110px', textAlign: 'center' }}>
            <span className="ms-status-capsule" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
              {isResult ? '경기종료' : isBefore ? '경기전' : `${relayInfo.inn}회${relayInfo.homeOrAway === '1' ? '말' : '초'}`}
            </span>
            <span className="ms-datetime" style={{ fontSize: '12px', fontWeight: 500 }}>{dateStr}</span>
            <span className="ms-stadium" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>{gameDetail.stadium || '구장'}</span>
            {isBefore && gameDetail.weatherInfo?.weather && (
              <span className="ms-stadium" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
                🌡️ {gameDetail.weatherInfo.temp || '18°'} {gameDetail.weatherInfo.weather}
              </span>
            )}
          </div>

          {/* Home Team Info */}
          <div className="ms-team-section home" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '12px', flexDirection: 'row-reverse', textAlign: 'left' }}>
            <div className="ms-team-info" style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="ms-team-name" style={{ fontSize: '18px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {homeName} <span className="home-badge" style={{ fontSize: '9px', background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '3px' }}>홈</span>
              </span>
              <span className="ms-pitcher-label" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                {gameDetail.winPitcherName ? `승-${gameDetail.winPitcherName}` : `선발-${gameDetail.homeStarterName || '-'}`}
              </span>
            </div>
            <img src={getLogoUrl(homeName)} alt={homeName} className="ms-logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            <span className="ms-score-large" style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'Outfit, sans-serif', marginRight: '12px', minWidth: '40px', textAlign: 'center' }}>
              {isBefore ? '-' : homeScore}
            </span>
          </div>

        </div>

        {/* 9-Inning Inning Scoreboard Table */}
        {!isBefore && (
          <>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '12px 0' }} />
            <div className="ms-bottom" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="ms-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
                <thead>
                  <tr style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <th style={{ textAlign: 'left', paddingBottom: '6px', fontWeight: 600, width: '60px' }}>팀명</th>
                    {inningTabs.map(i => (
                      <th key={i} style={{ paddingBottom: '6px', fontWeight: 500 }}>{i}</th>
                    ))}
                    <th style={{ paddingBottom: '6px', fontWeight: 800, color: '#fff', width: '25px' }}>R</th>
                    <th style={{ paddingBottom: '6px', fontWeight: 500, width: '20px' }}>H</th>
                    <th style={{ paddingBottom: '6px', fontWeight: 500, width: '20px' }}>E</th>
                    <th style={{ paddingBottom: '6px', fontWeight: 500, width: '20px' }}>B</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: 'left', fontWeight: 800, fontSize: '12px', padding: '4px 0' }}>{awayName}</td>
                    {inningTabs.map((_, i) => (
                      <td key={i} style={{ padding: '4px 0', opacity: awayInnings[i] !== undefined ? 1 : 0.4 }}>
                        {awayInnings[i] !== undefined ? awayInnings[i] : '-'}
                      </td>
                    ))}
                    <td style={{ fontWeight: 900, fontSize: '13px', color: '#fff' }}>{aR}</td>
                    <td style={{ opacity: 0.8 }}>{aH}</td>
                    <td style={{ opacity: 0.8 }}>{aE}</td>
                    <td style={{ opacity: 0.8 }}>{aB}</td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: 'left', fontWeight: 800, fontSize: '12px', padding: '4px 0' }}>{homeName}</td>
                    {inningTabs.map((_, i) => {
                      let score = homeInnings[i];
                      if (isResult && i === 8 && score === undefined) score = '-'; // no 9th end inning needed
                      return (
                        <td key={i} style={{ padding: '4px 0', opacity: score !== undefined ? 1 : 0.4 }}>
                          {score !== undefined ? score : '-'}
                        </td>
                      );
                    })}
                    <td style={{ fontWeight: 900, fontSize: '13px', color: '#fff' }}>{hR}</td>
                    <td style={{ opacity: 0.8 }}>{hH}</td>
                    <td style={{ opacity: 0.8 }}>{hE}</td>
                    <td style={{ opacity: 0.8 }}>{hB}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* 3. Navigation Tabs (Modern Clean Design) */}
      <nav className="live-tabs-nav" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', sticky: 'top', zIndex: 10 }}>
        {(['relay', 'cheer', 'lineup', 'analysis'] as const).map(tab => (
          <div 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`tab-item ${activeTab === tab ? 'active' : ''}`}
            style={{ 
              flex: 1, 
              padding: '14px 0', 
              textAlign: 'center', 
              fontSize: '14px', 
              fontWeight: 800, 
              cursor: 'pointer',
              color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-secondary)',
              position: 'relative',
              transition: 'color 0.2s'
            }}
          >
            {tab === 'relay' ? '중계' : tab === 'cheer' ? '응원톡' : tab === 'lineup' ? '라인업' : '분석'}
            {activeTab === tab && (
              <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '30px', height: '3px', backgroundColor: 'var(--primary-color)', borderRadius: '2px' }} />
            )}
          </div>
        ))}
      </nav>

      {/* 4. Tab Panels */}
      
      {/* 4.1 Broadcast Relay Panel */}
      {activeTab === 'relay' && (
        <div id="panel-relay" style={{ animation: 'fadeIn 0.3s ease' }}>
          
          {/* Inning Filter Navigation */}
          {!isBefore && (
            <div className="relay-sub-tabs" style={{ display: 'flex', overflowX: 'auto', padding: '12px 16px', gap: '8px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', scrollbarWidth: 'none' }}>
              <button 
                onClick={() => setInningFilter('all')}
                className={`sub-tab-item ${inningFilter === 'all' ? 'active' : ''}`}
                style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid var(--border-color)', backgroundColor: inningFilter === 'all' ? 'var(--primary-color)' : 'var(--bg-primary)', color: inningFilter === 'all' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                전체
              </button>
              <button 
                onClick={() => setInningFilter('score')}
                className={`sub-tab-item ${inningFilter === 'score' ? 'active' : ''}`}
                style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid var(--border-color)', backgroundColor: inningFilter === 'score' ? 'var(--primary-color)' : 'var(--bg-primary)', color: inningFilter === 'score' ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                득점
              </button>
              {inningTabs.map(i => (
                <button 
                  key={i}
                  onClick={() => setInningFilter(String(i))}
                  className={`sub-tab-item ${inningFilter === String(i) ? 'active' : ''}`}
                  style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid var(--border-color)', backgroundColor: inningFilter === String(i) ? 'var(--primary-color)' : 'var(--bg-primary)', color: inningFilter === String(i) ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {i}회
                </button>
              ))}
            </div>
          )}

          {/* Defense Field Position Mapping Radar */}
          <section className="field-section" style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', borderBottom: '8px solid var(--divider-color)' }}>
            <div 
              className="field-wrapper" 
              style={{ 
                position: 'relative', 
                width: '100%', 
                maxWidth: '600px', 
                margin: '0 auto', 
                aspectRatio: '600 / 400', 
                backgroundImage: "url('/images/field.jpeg')", 
                backgroundSize: 'cover', 
                backgroundPosition: 'center', 
                borderRadius: '16px', 
                overflow: 'hidden', 
                border: '1px solid var(--border-color)',
                boxShadow: 'inset 0 0 100px rgba(0,0,0,0.3)'
              }}
            >
              <div className="player-label" style={{ position: 'absolute', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, transform: 'translate(-50%, -50%)', left: '15%', top: '35%' }}>좌익수</div>
              <div className="player-label" style={{ position: 'absolute', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, transform: 'translate(-50%, -50%)', left: '48%', top: '22%' }}>중견수</div>
              <div className="player-label" style={{ position: 'absolute', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, transform: 'translate(-50%, -50%)', left: '81%', top: '35%' }}>우익수</div>
              
              <div className="player-label" style={{ position: 'absolute', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, transform: 'translate(-50%, -50%)', left: '26%', top: '65%' }}>3루수</div>
              <div className="player-label" style={{ position: 'absolute', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, transform: 'translate(-50%, -50%)', left: '48%', top: '52%' }}>2루수</div>
              <div className="player-label" style={{ position: 'absolute', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, transform: 'translate(-50%, -50%)', left: '72%', top: '65%' }}>1루수</div>
              
              <div className="player-label" style={{ position: 'absolute', background: 'var(--primary-color)', color: '#fff', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, transform: 'translate(-50%, -50%)', left: '48%', top: '69%', border: '1px solid rgba(255,255,255,0.3)' }}>
                ⚾ {pName}
              </div>

              {/* Dynamic Batter Box Indicator based on Left/Right side */}
              {bSide === 'L' ? (
                <div className="player-label" style={{ position: 'absolute', background: 'var(--accent-color)', color: '#fff', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, transform: 'translate(-50%, -50%)', left: '40%', top: '90%', border: '1px solid rgba(255,255,255,0.3)' }}>
                  🏏 {bName}
                </div>
              ) : (
                <div className="player-label" style={{ position: 'absolute', background: 'var(--accent-color)', color: '#fff', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 800, transform: 'translate(-50%, -50%)', left: '56%', top: '90%', border: '1px solid rgba(255,255,255,0.3)' }}>
                  🏏 {bName}
                </div>
              )}
            </div>
          </section>

          {/* Counts & Strike Zone & Batter Stats */}
          {!isBefore && (
            <section className="game-cast-section" style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderBottom: '8px solid var(--divider-color)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
                
                {/* 1. Ball Counts & Player Stats Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* SBO Indicators */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '16px', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>B</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[1, 2, 3].map(i => (
                          <div 
                            key={i} 
                            style={{ 
                              width: '12px', 
                              height: '12px', 
                              borderRadius: '50%', 
                              backgroundColor: i <= parseInt(gameState.ball || 0) ? '#00ba7c' : '#ddd',
                              boxShadow: i <= parseInt(gameState.ball || 0) ? '0 0 6px #00ba7c' : 'none'
                            }} 
                          />
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '16px', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>S</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[1, 2].map(i => (
                          <div 
                            key={i} 
                            style={{ 
                              width: '12px', 
                              height: '12px', 
                              borderRadius: '50%', 
                              backgroundColor: i <= parseInt(gameState.strike || 0) ? '#ffcc00' : '#ddd',
                              boxShadow: i <= parseInt(gameState.strike || 0) ? '0 0 6px #ffcc00' : 'none'
                            }} 
                          />
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '16px', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>O</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {[1, 2].map(i => (
                          <div 
                            key={i} 
                            style={{ 
                              width: '12px', 
                              height: '12px', 
                              borderRadius: '50%', 
                              backgroundColor: i <= parseInt(gameState.out || 0) ? '#ff4d6d' : '#ddd',
                              boxShadow: i <= parseInt(gameState.out || 0) ? '0 0 6px #ff4d6d' : 'none'
                            }} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pitcher & Batter Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '2px' }}>PITCHER</div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{pName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {pPlayer?.currentGamePlayerStats?.ballCount || 0}구 | ERA {pPlayer?.currentSeasonStats?.era || '0.00'}
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '2px' }}>BATTER</div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{bName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {bPlayer?.currentGamePlayerStats?.ab || 0}타수 {bPlayer?.currentGamePlayerStats?.hit || 0}안타 | 타율 {bPlayer?.currentSeasonStats?.hra || '.000'}
                      </div>
                    </div>
                  </div>

                </div>

                {/* 2. Live Strike Zone Plotter */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '1px' }}>STRIKE ZONE</div>
                  <div 
                    style={{ 
                      width: '150px', 
                      height: '190px', 
                      backgroundColor: 'var(--bg-secondary)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px',
                      position: 'relative',
                      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)'
                    }}
                  >
                    {/* Inner high-contrast box representing the official strike zone bounds */}
                    <div 
                      style={{ 
                        position: 'absolute',
                        left: '25px',
                        top: '35px',
                        width: '100px',
                        height: '120px',
                        border: '2px dashed var(--text-primary)',
                        backgroundColor: 'rgba(255,255,255,0.4)',
                        borderRadius: '4px'
                      }}
                    />

                    {/* Plots the actual pitches from ptsOptions */}
                    {ptsOptions.map((pitch: any, idx: number) => {
                      // Map pitch.crossPlateX (-1.5 to 1.5) to X % (0 to 100)
                      const leftPercent = ((pitch.crossPlateX + 1.5) / 3) * 100;
                      // Map pitch.crossPlateY (0 to 4.0) to Y % (100 down to 0)
                      const topPercent = (1 - (pitch.crossPlateY / 4)) * 100;
                      
                      const isStrike = pitch.pitchResult !== 'B';

                      return (
                        <div 
                          key={pitch.pitchId || idx}
                          style={{
                            position: 'absolute',
                            left: `${leftPercent}%`,
                            top: `${topPercent}%`,
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: isStrike ? '#ff4d6d' : '#00ba7c',
                            boxShadow: `0 2px 4px ${isStrike ? 'rgba(255,77,109,0.3)' : 'rgba(0,186,124,0.3)'}`,
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 900,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10
                          }}
                        >
                          {idx + 1}
                        </div>
                      );
                    })}

                  </div>
                </div>

              </div>
            </section>
          )}

          {/* Text Play-by-Play List Log */}
          <section className="relay-list-container" style={{ padding: '0', backgroundColor: 'var(--bg-primary)' }}>
            <h4 style={{ padding: '16px 20px', fontSize: '15px', fontWeight: 800, borderBottom: '1px solid var(--border-color)' }}>실시간 문자 중계</h4>
            
            {getFilteredRelays().length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                중계된 문자 이벤트 기록이 없습니다.
              </div>
            ) : (
              getFilteredRelays().map((group: any, idx: number) => {
                const isStrikeOut = group.text?.includes('삼진');
                const isHit = group.text?.includes('안타') || group.text?.includes('홈런');
                
                return (
                  <div 
                    key={idx} 
                    className="relay-item" 
                    style={{ 
                      padding: '16px 20px', 
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: isHit ? 'rgba(255,123,0,0.02)' : isStrikeOut ? 'rgba(2,65,211,0.01)' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--hover-bg)', color: 'var(--primary-color)' }}>
                          {group.inn}회{group.homeOrAway === '1' ? '말' : '초'}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {group.currentPlayersInfo?.away?.currentGamePlayerStats?.batterName || '타석'}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'Outfit', color: 'var(--text-secondary)' }}>
                        {group.awayScore || 0} : {group.homeScore || 0}
                      </div>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', lineHeight: 1.4 }}>
                      {group.text}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span>투수: {group.currentPlayersInfo?.away?.currentGamePlayerStats?.pitcherName || '투수'}</span>
                      {group.velocity && <span>구속: {group.velocity}km/h</span>}
                      {group.pitchType && <span>구종: {group.pitchType}</span>}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>
      )}

      {/* 4.2 Cheer Chat Panel (Stunning Modern Layout) */}
      {activeTab === 'cheer' && (
        <div id="panel-cheer" style={{ padding: '20px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Form */}
            <form onSubmit={handleCheerSubmit} style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                placeholder="선수들을 위한 열정적인 한마디를 나누세요!"
                value={cheerMsg}
                onChange={(e) => setCheerMsg(e.target.value)}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid var(--border-color)', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '14px' }}
              />
              <button 
                type="submit"
                style={{ padding: '10px 20px', backgroundColor: 'var(--primary-color)', color: '#fff', borderRadius: '24px', border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
              >
                전송
              </button>
            </form>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              {cheerList.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '14px', borderRadius: '16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', boxShadow: 'var(--card-shadow)' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: getTeamColor(item.team), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>
                    {item.team.substring(0, 2)}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{item.user}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.time}</span>
                    </div>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0, fontWeight: 500, lineHeight: 1.4 }}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 4.3 Lineup Panel (Clean Table Details) */}
      {activeTab === 'lineup' && (
        <div id="panel-lineup" style={{ padding: '20px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Away Lineup */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '2px solid var(--border-color)', paddingBottom: '6px' }}>{awayName} 선발 라인업</h4>
              {Array.from({ length: 9 }).map((_, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{idx + 1}번 타자</span>
                  <span style={{ fontWeight: 700 }}>선수 {idx + 1}</span>
                </div>
              ))}
            </div>

            {/* Home Lineup */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '2px solid var(--border-color)', paddingBottom: '6px' }}>{homeName} 선발 라인업</h4>
              {Array.from({ length: 9 }).map((_, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{idx + 1}번 타자</span>
                  <span style={{ fontWeight: 700 }}>선수 {idx + 1}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 4.4 Analysis Panel */}
      {activeTab === 'analysis' && (
        <div id="panel-analysis" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', animation: 'fadeIn 0.3s ease' }}>
          <i className="fas fa-chart-pie" style={{ fontSize: '48px', color: 'var(--primary-color)', marginBottom: '16px', display: 'block' }}></i>
          <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>데이터 정밀 분석</h4>
          <p style={{ fontSize: '13px', margin: 0 }}>투수와 타자 간의 시즌 상대 성적, 구종별 피안타율 등 정밀 데이터 분석 페이지가 곧 업데이트됩니다!</p>
        </div>
      )}

      {/* CSS Keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { transform: translateY(0); opacity: 1; }
        }
      `}} />

    </div>
  );
}
