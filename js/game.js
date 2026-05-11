/**
 * KBO Game Data Manager
 * Handles fetching game schedules, scores, and standings.
 */

const GameData = {
    // KBO_UTILS 사용을 위한 래퍼
    getLogoUrl(teamName, emblemUrl) { return KBO_UTILS.getLogoUrl(teamName, emblemUrl); },
    getVenue(teamName) { return KBO_UTILS.getVenue(teamName); },

    // API Endpoints
    gameListUrl(date) {
        return `${KBO_CONSTANTS.API_BASE_URL}/calendar?date=${date}&_t=${Date.now()}`;
    },
    gameDetailUrl(gameId) {
        return `${KBO_CONSTANTS.API_BASE_URL}/game?gameId=${gameId}&_t=${Date.now()}`;
    },
    standingsUrl(year) {
        return `${KBO_CONSTANTS.API_BASE_URL}/rank?year=${year}&_t=${Date.now()}`;
    },

    // Stadium Mapping
    venueMap: {
        'LG': '잠실', '두산': '잠실', '키움': '고척', 'SSG': '문학',
        'KT': '수원', '한화': '대전', '삼성': '대구', '롯데': '사직',
        'KIA': '광주', 'NC': '창원'
    },

    getVenue(teamName) {
        if (!teamName) return '경기장';
        const name = teamName.replace('트윈스', '').replace('타이거즈', '').replace('라이온즈', '').replace('랜더스', '')
                        .replace('베어스', '').replace('다이노스', '').replace('이글스', '').replace('자이언츠', '').replace(' 위즈', '').trim();
        return this.venueMap[name] || '경기장';
    },

    currentDate: new Date(),

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    formatDisplayDate(date) {
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const week = weekdays[date.getDay()];
        return `${year}.${month}.${day} (${week})`;
    },

    renderSkeleton() {
        const container = document.getElementById('game-list-container');
        if (!container) return;
        container.innerHTML = ''; // Clear first
        let html = '';
        for (let i = 0; i < 3; i++) {
            html += `
                <div class="skeleton-card-wide">
                    <div class="skeleton-item" style="width: 60px; height: 60px; border-radius: 50%;"></div>
                    <div class="skeleton-item" style="flex: 1; height: 40px; margin: 0 15px;"></div>
                    <div class="skeleton-item" style="width: 60px; height: 60px; border-radius: 50%;"></div>
                </div>
            `;
        }
        container.innerHTML = html;
    },

    async fetchGames(date) {
        console.log(`[KBO Feed] Fetching schedule from Calendar API: ${date}`);
        try {
            const listResponse = await fetch(this.gameListUrl(date), { cache: 'no-store' });
            if (!listResponse.ok) throw new Error('Calendar API failed');
            const listData = await listResponse.json();
            
            const monthData = listData.result?.dates || [];
            const dayData = monthData.find(d => d.ymd === date);
            
            if (!dayData || !dayData.gameInfos) {
                console.log('[KBO Feed] No games found for this date in calendar.');
                return [];
            }

            // Filter out non-team events
            const matchInfos = dayData.gameInfos.filter(g => g.homeTeamCode && g.awayTeamCode);
            console.log(`[KBO Feed] Found ${matchInfos.length} scheduled matches. Fetching details...`);

            // Fetch details for each game in parallel to get scores
            const gameDetails = await Promise.all(
                matchInfos.map(async (g) => {
                    try {
                        const detailRes = await fetch(this.gameDetailUrl(g.gameId), { cache: 'no-store' });
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
                            venue: game.stadium || this.getVenue(game.homeTeamName)
                        };
                    } catch (e) { return null; }
                })
            );

            return gameDetails.filter(g => g !== null);
        } catch (error) {
            console.error('[KBO Feed] Hybrid Fetch error:', error);
            return [];
        }
    },

    async fetchStandings(year) {
        try {
            const response = await fetch(this.standingsUrl(year), { cache: 'no-store' });
            const data = await response.json();
            return (data.result?.seasonTeamStats || []).map(item => ({
                rank: item.ranking,
                teamName: item.teamName,
                won: item.winGameCount,
                lost: item.loseGameCount,
                tied: item.drawnGameCount,
                winPercentage: item.wra,
                logo: item.teamImageUrl
            }));
        } catch (error) {
            return [];
        }
    },

    renderScoreboard(games) {
        const container = document.getElementById('game-list-container');
        const miniContainer = document.getElementById('mini-game-bar');
        
        if (container) container.innerHTML = ''; // Ensure container is empty before render

        // Monday Check
        const isMonday = this.currentDate.getDay() === 1;
        if (isMonday) {
            if (container) {
                container.innerHTML = `
                    <div style="padding: 60px 20px; text-align: center; width: 100%;">
                        <img src="/images/fiddy/monday.png" alt="Monday" style="width: 180px; opacity: 0.8; margin-bottom: 20px; border-radius: 20px;">
                        <div style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px;">월요일은 경기가 없어요!</div>
                        <div style="font-size: 14px; color: var(--text-secondary);">선수들이 재충전 중입니다. 화요일에 만나요.</div>
                    </div>
                `;
            }
            return;
        }

        if (!games || games.length === 0) {
            if (container) container.innerHTML = '<div style="padding: 60px 20px; text-align: center; color: var(--text-secondary); width: 100%;">해당 날짜에 예정된 경기가 없습니다.</div>';
            return;
        }

        let wideHtml = '';
        let miniHtml = '';

        games.forEach(game => {
            const { gameId, homeTeamName, awayTeamName, homeTeamScore, awayTeamScore, statusInfo, statusCode, homeTeamEmblemUrl, awayTeamEmblemUrl, venue } = game;
            
            // Console Matchup Info
            console.log(`[KBO Feed] Match: ${awayTeamName} vs ${homeTeamName} (${statusInfo})`);

            const awayLogo = this.getLogoUrl(awayTeamName, awayTeamEmblemUrl);
            const homeLogo = this.getLogoUrl(homeTeamName, homeTeamEmblemUrl);
            const venueName = venue || this.getVenue(homeTeamName);

            wideHtml += `
                <a href="/game/live.html?gameId=${gameId}" class="game-card-wide">
                    <div class="team-info">
                        <img src="${awayLogo}" onerror="this.src='/images/logo.png'" class="team-logo-large">
                        <span class="team-name-large">${awayTeamName}</span>
                        <span class="score-large">${statusCode === 'BEFORE' ? '-' : awayTeamScore}</span>
                    </div>
                    <div class="game-mid">
                        <div class="game-status-badge ${statusCode === 'RUNNING' ? 'live' : ''}">${statusInfo}</div>
                        <div class="game-venue">${venueName}</div>
                    </div>
                    <div class="team-info">
                        <img src="${homeLogo}" onerror="this.src='/images/logo.png'" class="team-logo-large">
                        <span class="team-name-large">${homeTeamName}</span>
                        <span class="score-large">${statusCode === 'BEFORE' ? '-' : homeTeamScore}</span>
                    </div>
                </a>
            `;

            miniHtml += `
                <a href="/game/live.html?gameId=${gameId}" class="mini-score-card">
                    <div class="mini-team">
                        <span>${awayTeamName}</span>
                        <span>${statusCode === 'BEFORE' ? '-' : awayTeamScore}</span>
                    </div>
                    <div class="mini-team">
                        <span>${homeTeamName}</span>
                        <span>${statusCode === 'BEFORE' ? '-' : homeTeamScore}</span>
                    </div>
                    <div class="mini-status">${statusInfo}</div>
                </a>
            `;
        });

        if (container) container.innerHTML = wideHtml;
        if (miniContainer && !this.miniInitialized) {
            miniContainer.innerHTML = miniHtml;
            this.miniInitialized = true;
        }
    },

    renderStandings(list) {
        const tbody = document.getElementById('standings-body');
        if (!tbody) return;
        let html = '';
        list.forEach(team => {
            html += `
                <tr>
                    <td>${team.rank}</td>
                    <td>
                        <div class="team-cell">
                            <img src="${this.getLogoUrl(team.teamName, team.logo)}" onerror="this.src='/images/logo.png'">
                            <span>${team.teamName}</span>
                        </div>
                    </td>
                    <td>${team.won}</td><td>${team.lost}</td><td>${team.tied}</td><td>${team.winPercentage}</td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    },

    async updateGameList() {
        const dateText = document.getElementById('current-date-text');
        const dateObj = GameData.currentDate;
        const dateStr = this.formatDate(dateObj);
        const displayStr = this.formatDisplayDate(dateObj);
        
        console.log(`[KBO Feed] >>> Updating UI for date: ${dateStr}`);
        if (dateText) dateText.textContent = displayStr;
        
        this.renderSkeleton();
        
        const games = await this.fetchGames(dateStr);
        this.renderScoreboard(games);
    },

    async init() {
        console.log('[KBO Feed] Initializing GameData Manager');
        this.updateGameList();
        
        const currentYear = GameData.currentDate.getFullYear();
        this.fetchStandings(currentYear).then(s => this.renderStandings(s));

        // Event Listeners for Date Nav
        const prevBtn = document.getElementById('prev-date');
        const nextBtn = document.getElementById('next-date');

        if (prevBtn) {
            prevBtn.onclick = async (e) => {
                e.preventDefault();
                this.currentDate.setDate(this.currentDate.getDate() - 1);
                this.currentDate = new Date(this.currentDate);
                await this.updateGameList();
            };
        }

        if (nextBtn) {
            nextBtn.onclick = async (e) => {
                e.preventDefault();
                this.currentDate.setDate(this.currentDate.getDate() + 1);
                this.currentDate = new Date(this.currentDate);
                await this.updateGameList();
            };
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('[KBO Feed] DOMContentLoaded');
    if (window.UI) UI.init();
    GameData.init();
});
