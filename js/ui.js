/**
 * UI Component Manager for KBO Feed
 * Dynamically injects Sidebar, Header, and Bottom Nav to keep code DRY.
 */

const UI = {
    // Sidebar HTML structure
    sidebar: `
        <aside class="sidebar">
            <div class="logo-container">
                <a href="/index.html"><img src="/images/logo.png" alt="크보피드 로고" class="logo"></a>
            </div>
            <nav class="nav-links">
                <a href="/index.html" class="nav-item-link">
                    <div class="nav-item" id="nav-home">
                        <i class="fas fa-home"></i>
                        <span>홈</span>
                    </div>
                </a>
                <a href="/explore.html" class="nav-item-link">
                    <div class="nav-item" id="nav-search">
                        <i class="fas fa-hashtag"></i>
                        <span>탐색하기</span>
                    </div>
                </a>
                <a href="/game.html" class="nav-item-link">
                    <div class="nav-item" id="nav-game">
                        <svg viewBox="0 0 24 24" style="width: 20px; height: 20px;">
                            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                            <path d="M7 4.5c3 3 3 12 0 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                            <path d="M17 4.5c-3 3-3 12 0 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                        </svg>
                        <span>경기</span>
                    </div>
                </a>
                <div class="nav-item">
                    <i class="far fa-bell"></i>
                    <span>알림</span>
                </div>
                <div class="nav-item">
                    <i class="far fa-envelope"></i>
                    <span>쪽지</span>
                </div>
                <div class="nav-item">
                    <i class="far fa-bookmark"></i>
                    <span>북마크</span>
                </div>
                <a href="/profile.html" class="nav-item-link">
                    <div class="nav-item" id="nav-profile">
                        <i class="far fa-user"></i>
                        <span>프로필</span>
                    </div>
                </a>
            </nav>
            <button class="post-btn">게시하기</button>
        </aside>
    `,

    // Search Bar Component
    searchBar: `
        <div class="mobile-search-container">
            <div class="search-input-wrapper">
                <i class="fas fa-arrow-left search-back-btn" id="search-back-btn"></i>
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="크보피드 검색" id="mobile-search-input">
                    <i class="fas fa-times-circle search-clear" id="search-clear-btn" style="display: none; cursor: pointer; color: var(--text-secondary); margin-left: 8px;"></i>
                </div>
            </div>
            <div class="search-suggestions" id="mobile-search-suggestions">
                <div class="suggestion-item">
                    <span class="suggestion-category">실시간 트렌드</span>
                    <span class="suggestion-name">#잠실더비</span>
                    <span class="suggestion-count">12.4K 게시물</span>
                </div>
                <div class="suggestion-item">
                    <span class="suggestion-category">실시간 화제</span>
                    <span class="suggestion-name">#고척돔_매진</span>
                    <span class="suggestion-count">3,102 게시물</span>
                </div>
                <div class="suggestion-item">
                    <span class="suggestion-category">커뮤니티</span>
                    <span class="suggestion-name">KIA 타이거즈 원정 응원단</span>
                    <span class="suggestion-count">12.4K 멤버</span>
                </div>
            </div>
        </div>
    `,

    // Header HTML structure
    header: (title, page) => {
        const isHome = page === 'home';
        const isSearch = page === 'explore' || page === 'search-results';
        const isBackNeeded = ['post', 'profile', 'myaccount', 'live'].includes(page);
        
        return `
        <header class="feed-header-group">
            <div class="feed-header">
                <div class="header-left">
                    ${isBackNeeded ? `
                    <div class="header-back-btn" onclick="history.back()">
                        <i class="fas fa-arrow-left"></i>
                    </div>
                    ` : ''}
                </div>
                <div class="mobile-logo-container">
                    <a href="/index.html"><img src="/images/logo.png" alt="크보피드 로고" class="mobile-logo"></a>
                </div>
                <h2 class="desktop-title" style="flex: 2; text-align: center;">${title}</h2>
                <div class="header-right">
                    ${page === 'profile' ? `<a href="/myaccount.html" style="color: var(--primary-color); font-weight: 700; text-decoration: none; font-size: 15px;">수정</a>` : ''}
                </div>
            </div>
            ${isHome ? `
            <div class="feed-tabs">
                <div class="feed-tab active" data-tab="all">전체글</div>
                <div class="feed-tab" data-tab="myteam">내팀</div>
            </div>
            ` : ''}
            ${isSearch ? UI.searchBar : ''}
        </header>
    `},

    // Bottom Nav HTML structure
    bottomNav: (activePage) => `
        <nav class="mobile-nav">
            <div class="nav-container">
                <a href="/index.html" class="nav-item ${activePage === 'home' ? 'active' : ''}">
                    <svg viewBox="0 0 24 24"><path d="M12 2.5c-1.5 0-2.5.8-3.5 1.5L3.5 8.2c-.8.7-1.5 1.8-1.5 3v8.3c0 1.1.9 2 2 2h4.5c.3 0 .5-.2.5-.5v-4.5c0-1.7 1.3-3 3-3s3 1.3 3 3v4.5c0 .3.2.5.5.5h4.5c1.1 0 2-.9 2-2v-8.3c0-1.2-.7-2.3-1.5-3l-5-4.2c-1-.7-2-1.5-3.5-1.5z"></path></svg>
                </a>
                <a href="/explore.html" class="nav-item ${activePage === 'explore' || activePage === 'search-results' ? 'active' : ''}">
                    <svg viewBox="0 0 24 24"><path d="M11 2a9 9 0 1 0 5.6 16.05l4.1 4.1a1.5 1.5 0 1 0 2.12-2.12l-4.1-4.1A9 9 0 0 0 11 2zm0 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12z"></path></svg>
                </a>
                <a href="/game.html" class="nav-item ${activePage === 'game' || activePage === 'live' ? 'active' : ''}">
                    <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                        <path d="M7 4.5c3 3 3 12 0 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                        <path d="M17 4.5c-3 3-3 12 0 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                    </svg>
                </a>
                <a href="/profile.html" class="nav-item ${activePage === 'profile' ? 'active' : ''}">
                    <svg viewBox="0 0 24 24"><path d="M12 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zm0 2c-4.97 0-9 2.46-9 5.5V22h18v-2.5c0-3.04-4.03-5.5-9-5.5z"></path></svg>
                </a>
            </div>
        </nav>
    `,

    // Standardized Tweet Component
    tweet: (data) => `
        <article class="tweet" data-id="${data.id || ''}">
            <div class="user-avatar" style="background-image: url('${data.avatar}'); background-size: cover;"></div>
            <div class="tweet-content">
                <div class="tweet-header" style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                    <span class="display-name" style="font-weight: 800; color: var(--text-primary); white-space: nowrap;">${data.displayName}</span>
                    ${data.isVerified ? '<i class="fas fa-check-circle verified" style="color: var(--primary-color); font-size: 14px; margin-right: 2px;"></i>' : ''}
                    <span class="username" style="color: var(--text-secondary); margin-left: 2px;">${data.username}</span>
                    <span class="dot" style="color: var(--text-secondary);">·</span>
                    <span class="time" style="color: var(--text-secondary);">${data.time}</span>
                </div>
                <div class="tweet-text">
                    ${data.text}
                </div>
                ${data.image ? `<div class="tweet-media"><img src="${data.image}" alt="게시물 이미지"></div>` : ''}
                ${data.originalAuthor ? `<div class="retweet-credit" style="font-size: 13px; color: var(--text-secondary); margin-top: 8px; display: flex; align-items: center; gap: 4px;"><i class="fas fa-retweet"></i> @${data.originalAuthor}님의 글</div>` : ''}
                
                <div class="tweet-actions" style="display: flex; justify-content: space-between; max-width: 425px; margin-top: 12px; color: var(--text-secondary);">
                    <div class="action-item action-comment" onclick="event.stopPropagation();" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <i class="far fa-comment" style="font-size: 16px;"></i> <span style="font-size: 13px;">${data.comments || 0}</span>
                    </div>
                    <div class="action-item action-retweet" onclick="event.stopPropagation(); FeedManager.handleRetweet(this, '${data.id}')" style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: ${data.isRTed ? '#00ba7c' : ''};">
                        <i class="fas fa-retweet" style="font-size: 16px;"></i> <span style="font-size: 13px;">${data.retweets || 0}</span>
                    </div>
                    <div class="action-item action-like" onclick="event.stopPropagation(); FeedManager.handleLike(this, '${data.id}')" style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: ${data.isLiked ? '#f91880' : ''};">
                        <i class="${data.isLiked ? 'fas' : 'far'} fa-heart" style="font-size: 16px;"></i> <span style="font-size: 13px;">${data.likes || 0}</span>
                    </div>
                    <div class="action-item action-views" style="display: flex; align-items: center; gap: 8px;">
                        <i class="far fa-chart-bar" style="font-size: 16px;"></i> <span style="font-size: 13px;">${data.views || 0}</span>
                    </div>
                </div>
            </div>
        </article>
    `,

    init() {
        const appContainer = document.querySelector('.app-container');
        if (!appContainer) return;

        const page = document.body.getAttribute('data-page') || 'home';
        const pageTitleMap = { 
            'home': '홈', 
            'explore': '탐색', 
            'search-results': '검색 결과',
            'game': '경기',
            'live': '상세중계',
            'post': '게시물',
            'profile': '프로필',
            'myaccount': '계정 수정'
        };
        
        // 1. Inject Sidebar
        const sidebarPlaceholder = document.createElement('div');
        sidebarPlaceholder.innerHTML = this.sidebar;
        appContainer.prepend(sidebarPlaceholder.firstElementChild);

        // 2. Set active state for sidebar
        const navPage = page === 'search-results' ? 'explore' : page;
        const navItem = document.getElementById(`nav-${navPage}`);
        if (navItem) navItem.classList.add('active');

        // 3. Inject Header into main-feed
        const mainFeed = document.querySelector('.main-feed');
        if (mainFeed) {
            const headerHTML = this.header(pageTitleMap[page], page);
            mainFeed.insertAdjacentHTML('afterbegin', headerHTML);
        }

        // 4. Inject Bottom Nav
        const existingBottomNav = document.querySelector('.mobile-nav');
        if (existingBottomNav) existingBottomNav.remove();
        appContainer.insertAdjacentHTML('beforeend', this.bottomNav(page));

        // 5. Hybrid Header Scroll Logic
        this.setupHybridHeader();

        // 6. Login Prompt for Home Page
        if (page === 'home') {
            setTimeout(() => this.showLoginPrompt(), 1500); // Small delay for better UX
        }

        // 7. 검색바 엔터키 연동
        setTimeout(() => {
            const searchInputs = document.querySelectorAll('#mobile-search-input, .search-bar input');
            searchInputs.forEach(input => {
                input.onkeypress = (e) => {
                    if (e.key === 'Enter') {
                        const query = input.value.trim();
                        if (query) {
                            window.location.href = `/search.html?q=${encodeURIComponent(query)}`;
                        }
                    }
                };
            });
        }, 500);
    },

    showLoginPrompt() {
        // Only prevent showing if the user is actually logged in
        if (localStorage.getItem('isLoggedIn') === 'true') return;

        const modalHTML = `
            <style>
                .login-prompt-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.4); z-index: 9999;
                    display: flex; justify-content: center; align-items: center;
                    opacity: 0; animation: fadeIn 0.2s forwards;
                }
                .login-prompt-modal {
                    background: #fff; border-radius: 12px; width: 90%; max-width: 340px;
                    padding: 30px 20px 20px; text-align: center; position: relative;
                    transform: translateY(10px); animation: slideUp 0.2s ease-out forwards;
                }
                .login-prompt-close {
                    position: absolute; top: 12px; right: 12px;
                    background: none; border: none; font-size: 18px; color: #000; cursor: pointer;
                    width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
                }
                .login-prompt-title { font-size: 18px; font-weight: 800; margin-bottom: 8px; color: #000; letter-spacing: -0.5px; }
                .login-prompt-desc { font-size: 14px; color: #666; margin-bottom: 24px; line-height: 1.4; letter-spacing: -0.3px; }
                .login-prompt-btn {
                    display: block; width: 100%; padding: 14px; background: #000;
                    color: #fff; text-decoration: none; border-radius: 8px;
                    font-size: 15px; font-weight: 700;
                }
                
                @media (max-width: 600px) {
                    .login-prompt-overlay { align-items: flex-end; }
                    .login-prompt-modal {
                        width: 100%; max-width: 100%; border-radius: 16px 16px 0 0;
                        padding: 30px 20px 25px; margin: 0;
                        transform: translateY(100%);
                    }
                }

                @keyframes fadeIn { to { opacity: 1; } }
                @keyframes slideUp { to { transform: translateY(0); } }
            </style>
            <div class="login-prompt-overlay" id="login-prompt">
                <div class="login-prompt-modal">
                    <button class="login-prompt-close" onclick="document.getElementById('login-prompt').remove();"><i class="fas fa-times"></i></button>
                    <div class="login-prompt-title">크보피드 로그인</div>
                    <div class="login-prompt-desc">로그인하고 더 편하게<br>나만의 야구 소식을 받아보세요.</div>
                    <a href="/login.html" class="login-prompt-btn">로그인 하기</a>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    setupHybridHeader() {
        let lastScrollTop = 0;
        const header = document.querySelector('.feed-header-group');
        if (!header) return;

        // Passive listener for better performance
        window.addEventListener('scroll', () => {
            if (window.innerWidth > 600) {
                header.classList.remove('header-hidden');
                document.body.classList.remove('is-header-hidden');
                return;
            }

            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                header.classList.add('header-hidden');
                document.body.classList.add('is-header-hidden');
            } else {
                header.classList.remove('header-hidden');
                document.body.classList.remove('is-header-hidden');
            }
            lastScrollTop = scrollTop;
        }, { passive: true });
    }
};

// UI 모듈이 로드되면 자동으로 실행 (단, 중복 실행 방지)
if (!window.UI_INITIALIZED) {
    document.addEventListener('DOMContentLoaded', () => {
        UI.init();
        window.UI_INITIALIZED = true;
    });
}
