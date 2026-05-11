/**
 * KBO Live Relay Manager
 * Handles fetching real-time relay data based on KBO Integrated API Spec.
 */

const LiveRelay = {
    apiUrl: (gameId) => `${KBO_CONSTANTS.API_BASE_URL}/relay?gameId=${gameId}`,
    gameDetailUrl: (gameId) => `${KBO_CONSTANTS.API_BASE_URL}/game?gameId=${gameId}`,
    
    currentTab: 'relay',
    currentInningFilter: 'all',
    fullRelayData: [],

    getTeamColor(teamName) { return KBO_UTILS.getTeamColor(teamName); },
    getLogoUrl(teamName) { return KBO_UTILS.getLogoUrl(teamName); },

    async fetchRelayData(gameId) {
        try {
            const response = await fetch(this.apiUrl(gameId));
            if (!response.ok) throw new Error('Relay API failed');
            const data = await response.json();
            return data.result;
        } catch (error) {
            console.error('Relay fetch error:', error);
            return null;
        }
    },

    async fetchGameDetail(gameId) {
        try {
            const response = await fetch(this.gameDetailUrl(gameId));
            if (!response.ok) throw new Error('Game Detail API failed');
            const data = await response.json();
            return data.result?.game;
        } catch (error) {
            console.error('Game detail fetch error:', error);
            return null;
        }
    },

    renderMasterScoreboard(relayResult, detailResult) {
        const container = document.getElementById('master-scoreboard');
        if (!container || !detailResult) return;

        const gameState = relayResult?.currentGameState || {};
        const relayInfo = relayResult?.textRelayData || {};
        
        const awayName = detailResult.awayTeamName;
        const homeName = detailResult.homeTeamName;
        const isResult = detailResult.statusCode === 'RESULT';

        // Dynamic Background Colors
        const awayColor = this.getTeamColor(awayName);
        const homeColor = this.getTeamColor(homeName);
        container.style.background = `linear-gradient(105deg, ${awayColor} 49.9%, rgba(255,255,255,0.15) 50%, ${homeColor} 50.1%)`;

        // Score fallbacks
        const awayScore = gameState.awayScore !== undefined ? gameState.awayScore : (detailResult.awayTeamScore || 0);
        const homeScore = gameState.homeScore !== undefined ? gameState.homeScore : (detailResult.homeTeamScore || 0);

        // Inning Data
        const homeInnings = detailResult.homeTeamScoreByInning || [];
        const awayInnings = detailResult.awayTeamScoreByInning || [];
        const [hR, hH, hE, hB] = detailResult.homeTeamRheb || [0,0,0,0];
        const [aR, aH, aE, aB] = detailResult.awayTeamRheb || [0,0,0,0];

        // Format Date (MM.DD HH:mm)
        const date = new Date(detailResult.gameId.substring(0,4), detailResult.gameId.substring(4,6)-1, detailResult.gameId.substring(6,8));
        const dateStr = `${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')} 14:00`;

        const isBefore = detailResult.statusCode === 'BEFORE';
        const weather = detailResult.weatherInfo?.weather || '';
        const temp = detailResult.weatherInfo?.temp || '';

        container.innerHTML = `
            <!-- Top: Core Score -->
            <div class="ms-top">
                <div class="ms-team-section away">
                    <img src="${this.getLogoUrl(awayName)}" alt="${awayName}" class="ms-logo">
                    <div class="ms-team-info">
                        <div class="ms-team-name">${awayName}</div>
                        <div class="ms-pitcher-label">${detailResult.losePitcherName ? `패-${detailResult.losePitcherName}` : (detailResult.awayStarterName || '-')}</div>
                    </div>
                    <div class="ms-score-large">${awayScore}</div>
                </div>

                <div class="ms-center-info">
                    <div class="ms-status-capsule">${isResult ? '경기종료' : (isBefore ? '경기전' : `${relayInfo.inn}회${relayInfo.homeOrAway==='1'?'말':'초'}`)}</div>
                    <div class="ms-datetime">${dateStr}</div>
                    <div class="ms-stadium">${detailResult.stadium || '경기장'}</div>
                    ${isBefore && weather ? `<div class="ms-stadium">${weather} ${temp}</div>` : ''}
                </div>

                <div class="ms-team-section home">
                    <img src="${this.getLogoUrl(homeName)}" alt="${homeName}" class="ms-logo">
                    <div class="ms-team-info">
                        <div class="ms-team-name">${homeName} <span class="home-badge">홈</span></div>
                        <div class="ms-pitcher-label">${detailResult.winPitcherName ? `승-${detailResult.winPitcherName}` : (detailResult.homeStarterName || '-')}</div>
                    </div>
                    <div class="ms-score-large">${homeScore}</div>
                </div>
            </div>

            ${!isBefore ? `
            <div class="ms-divider"></div>
            <!-- Bottom: Inning Table -->
            <div class="ms-bottom">
                <table class="ms-table">
                    <thead>
                        <tr>
                            <th class="ms-table-team">팀명</th>
                            ${Array.from({length: 9}).map((_, i) => `<th class="ms-table-score">${i+1}</th>`).join('')}
                            <th class="ms-table-total">R</th>
                            <th class="ms-table-summary">H</th>
                            <th class="ms-table-summary">E</th>
                            <th class="ms-table-summary">B</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="ms-table-team">${awayName}</td>
                            ${Array.from({length: 9}).map((_, i) => `<td class="ms-table-score">${awayInnings[i] !== undefined ? awayInnings[i] : '-'}</td>`).join('')}
                            <td class="ms-table-total">${aR}</td>
                            <td class="ms-table-summary">${aH}</td>
                            <td class="ms-table-summary">${aE}</td>
                            <td class="ms-table-summary">${aB}</td>
                        </tr>
                        <tr>
                            <td class="ms-table-team">${homeName}</td>
                            ${Array.from({length: 9}).map((_, i) => {
                                let score = homeInnings[i];
                                if (isResult && i === 8 && score === undefined) score = '-'; // 9회말 미진행
                                return `<td class="ms-table-score">${score !== undefined ? score : '-'}</td>`;
                            }).join('')}
                            <td class="ms-table-total">${hR}</td>
                            <td class="ms-table-summary">${hH}</td>
                            <td class="ms-table-summary">${hE}</td>
                            <td class="ms-table-summary">${hB}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            ` : ''}
        `;

        // Generate Inning Tabs if needed
        if (!isBefore) {
            this.generateInningTabs(detailResult.homeTeamScoreByInning?.length || 9);
        }
    },

    generateInningTabs(maxInning) {
        const container = document.getElementById('inning-tabs');
        if (!container) return;

        let html = `
            <div class="sub-tab-item ${this.currentInningFilter === 'all' ? 'active' : ''}" data-inning="all">전체</div>
            <div class="sub-tab-item ${this.currentInningFilter === 'score' ? 'active' : ''}" data-inning="score">득점</div>
        `;

        for (let i = 1; i <= maxInning; i++) {
            html += `<div class="sub-tab-item ${this.currentInningFilter == i ? 'active' : ''}" data-inning="${i}">${i}회</div>`;
        }

        container.innerHTML = html;
        
        // Add listeners
        container.querySelectorAll('.sub-tab-item').forEach(item => {
            item.onclick = () => {
                container.querySelectorAll('.sub-tab-item').forEach(t => t.classList.remove('active'));
                item.classList.add('active');
                this.currentInningFilter = item.dataset.inning;
                this.renderTextRelay(this.fullRelayData);
            };
        });
    },

    setupTabs() {
        const nav = document.querySelector('.live-tabs-nav');
        
        // Sticky Detection for Mobile Gradient
        if (nav) {
            window.addEventListener('scroll', () => {
                if (window.innerWidth <= 600) {
                    const rect = nav.getBoundingClientRect();
                    // 56px is the sticky top offset. If it's at or below that relative to viewport, it's stuck.
                    if (rect.top <= 57) { 
                        nav.classList.add('is-stuck');
                    } else {
                        nav.classList.remove('is-stuck');
                    }
                }
            }, { passive: true });
        }

        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const target = tab.dataset.tab;
                this.currentTab = target;

                document.querySelectorAll('.tab-panel').forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.id === `panel-${target}`) panel.classList.add('active');
                });
            };
        });
    },

    renderDiamond(gameState) {
        if (!gameState) return;

        // Base Runners (Convert string "1"/"0" to boolean)
        document.getElementById('base-1').classList.toggle('active', gameState.base1 == '1');
        document.getElementById('base-2').classList.toggle('active', gameState.base2 == '1');
        document.getElementById('base-3').classList.toggle('active', gameState.base3 == '1');

        // Counts
        this.renderDots('count-b', parseInt(gameState.ball || 0), 3, 'b');
        this.renderDots('count-s', parseInt(gameState.strike || 0), 2, 's');
        this.renderDots('count-o', parseInt(gameState.out || 0), 2, 'o');
    },

    renderDots(containerId, count, max, className) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let html = '';
        for (let i = 0; i < max; i++) {
            html += `<div class="dot ${i < count ? className : ''}"></div>`;
        }
        container.innerHTML = html;
    },

    renderTextRelay(textRelays) {
        const container = document.getElementById('relay-list');
        if (!container) return;

        this.fullRelayData = textRelays;
        const relayGroups = Array.isArray(textRelays) ? textRelays : [];
        
        // Filtering
        let filtered = relayGroups;
        if (this.currentInningFilter === 'score') {
            filtered = relayGroups.filter(g => {
                return g.textOptions?.some(opt => opt.text.includes('득점') || opt.text.includes('홈런') || opt.text.includes('점차'));
            });
        } else if (this.currentInningFilter !== 'all') {
            filtered = relayGroups.filter(g => g.inn == this.currentInningFilter);
        }

        let html = '';
        filtered.slice(0, 50).forEach(group => {
            const options = Array.isArray(group.textOptions) ? group.textOptions : [];
            options.forEach(opt => {
                const info = opt.currentPlayersInfo || {};
                
                // Identify roles more accurately
                let batter = null, pitcher = null;
                if (info.away?.playerType === 'batter') { batter = info.away; pitcher = info.home; }
                else if (info.home?.playerType === 'batter') { batter = info.home; pitcher = info.away; }
                else {
                    // Fallback to searching all entries if playerType is missing/wrong
                    const players = [info.away, info.home].filter(p => p);
                    batter = players.find(p => p.playerType === 'batter') || players[0];
                    pitcher = players.find(p => p.playerType === 'pitcher') || players[1];
                }
                
                const bStats = batter?.currentGamePlayerStats || {};
                const pStats = pitcher?.currentGamePlayerStats || {};

                // Use Regex to extract name from text if missing in stats
                const bNameMatch = opt.text?.match(/^(\d+번타자\s+)?([가-힣a-zA-Z]+)/);
                const bName = bStats.batterName || (bNameMatch ? bNameMatch[2] : '타자');
                const pName = pStats.pitcherName || '투수';
                
                const resultText = opt.text || '';
                const resultTag = resultText.includes(':') ? resultText.split(':')[1].trim().split(' ')[0] : resultText.split(' ').pop();
                
                const aScore = opt.awayScore !== undefined ? opt.awayScore : '-';
                const hScore = opt.homeScore !== undefined ? opt.homeScore : '-';
                const runnerChange = opt.runnerChangeText || '';

                html += `
                    <div class="relay-item">
                        <div class="rc-top">
                            <div class="rc-player-box">
                                <img src="${this.getLogoUrl(batter?.teamName)}" class="rc-profile-img" alt="${bName}" onerror="this.src='/images/players/default.png'">
                                <div class="rc-player-main">
                                    <div class="rc-name-row">
                                        <span class="rc-name">${bName}</span>
                                        <span class="rc-result-tag">${resultTag.substring(0, 5)}</span>
                                    </div>
                                    <div class="rc-player-sub">
                                        <span>${bStats.batterOrder || (opt.text?.match(/^(\d+)번/)?.[1] || '-')}번 타자</span>
                                        <span>${bStats.batterSide || ''}${bStats.batterSide ? '타' : ''}</span>
                                        <span>B${opt.ball || 0} S${opt.strike || 0} O${opt.out || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="rc-score-box">
                                <span class="rc-score-text">${aScore} : ${hScore}</span>
                            </div>
                        </div>

                        <div class="rc-bottom">
                            <div class="rc-detail-row">
                                <div class="rc-label hit">타</div>
                                <div class="rc-detail-text">${resultText}</div>
                            </div>
                            <div class="rc-detail-row">
                                <div class="rc-label pitch">투</div>
                                <div class="rc-pitch-info">
                                    ${pName} | ${opt.velocity || '140'}Km/h ${opt.pitchType || '직구'}
                                    <span style="margin-left:8px; color:#999; font-size:11px;">(투구수: ${pStats.ballCount || 0})</span>
                                </div>
                            </div>
                            ${runnerChange ? `
                            <div class="rc-runners">
                                <div class="rc-runner-item"><i class="fas fa-running" style="margin-right:5px;"></i>${runnerChange}</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            });
        });
        
        container.innerHTML = html || '<div style="padding:40px; text-align:center; color:#999;">중계 데이터가 없습니다.</div>';
    },

    renderStrikeZone(ptsOptions) {
        const szContainer = document.getElementById('strike-zone');
        if (!szContainer) return;

        szContainer.innerHTML = ''; // Clear
        const pts = Array.isArray(ptsOptions) ? ptsOptions : [];

        pts.forEach((p, idx) => {
            // Coordinate mapping: crossPlateX is usually -2 to 2, crossPlateY is 0 to 4
            // Strike Zone box is roughly X:[-0.8, 0.8], Y:[1.5, 3.5]
            const left = ((p.crossPlateX + 1.5) / 3) * 100; // Map -1.5~1.5 to 0~100%
            const top = (1 - (p.crossPlateY / 4)) * 100;    // Map 0~4 to 100~0%

            const ball = document.createElement('div');
            ball.className = `sz-ball ${p.pitchResult === 'B' ? 'ball' : 'strike'}`;
            ball.style.left = `${left}%`;
            ball.style.top = `${top}%`;
            ball.innerHTML = idx + 1;
            szContainer.appendChild(ball);
        });
    },

    renderPlayerInfo(relayData) {
        const pInfo = document.getElementById('player-info');
        if (!pInfo || !relayData || !relayData.textRelays) return;

        const latestGroup = relayData.textRelays[0];
        if (!latestGroup || !latestGroup.textOptions) return;
        const info = latestGroup.textOptions[0]?.currentPlayersInfo;
        if (!info) return;

        const p = info.away?.playerType === 'pitcher' ? info.away : info.home;
        const b = info.away?.playerType === 'batter' ? info.away : info.home;

        // Update Field Labels
        const pName = p.currentGamePlayerStats?.pitcherName || '투수';
        const bName = b.currentGamePlayerStats?.batterName || '타자';
        const bSide = b.currentGamePlayerStats?.batterSide || 'R'; // 'L' or 'R'

        const pLabel = document.getElementById('pos-p');
        if (pLabel) pLabel.textContent = pName;

        const lbLabel = document.getElementById('pos-lb');
        const rbLabel = document.getElementById('pos-rb');
        if (lbLabel && rbLabel) {
            lbLabel.style.display = bSide === 'L' ? 'block' : 'none';
            rbLabel.style.display = bSide === 'R' ? 'block' : 'none';
            lbLabel.textContent = bName;
            rbLabel.textContent = bName;
        }

        pInfo.innerHTML = `
            <div class="info-card">
                <div class="info-label">PITCHER</div>
                <div class="info-name">${pName}</div>
                <div class="info-stats">${p.currentGamePlayerStats?.ballCount || 0}구 ERA ${p.currentSeasonStats?.era || '0.00'}</div>
            </div>
            <div class="info-card">
                <div class="info-label">BATTER</div>
                <div class="info-name">${bName}</div>
                <div class="info-stats">${b.currentGamePlayerStats?.ab || 0}타수 ${b.currentGamePlayerStats?.hit || 0}안타 ${b.currentSeasonStats?.hra || '.000'}</div>
            </div>
        `;
    },

    async init() {
        this.setupTabs();
        const urlParams = new URLSearchParams(window.location.search);
        const gameId = urlParams.get('gameId');
        
        if (!gameId) {
            alert('경기 ID가 없습니다.');
            window.location.href = '/game.html';
            return;
        }

        const update = async () => {
            const [relayResult, detailResult] = await Promise.all([
                this.fetchRelayData(gameId),
                this.fetchGameDetail(gameId)
            ]);

            if (relayResult && detailResult) {
                this.renderMasterScoreboard(relayResult, detailResult);
                this.renderDiamond(relayResult.currentGameState);
                
                const relays = (relayResult.textRelayData ? relayResult.textRelayData.textRelays : null) || relayResult.textRelays || [];
                this.renderTextRelay(relays);

                const latestGroup = relays[0];
                this.renderStrikeZone(latestGroup?.ptsOptions || []);
                this.renderPlayerInfo(relayResult.textRelayData || relayResult);
            }
        };

        await update();
        setInterval(update, 10000);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    LiveRelay.init();
});
