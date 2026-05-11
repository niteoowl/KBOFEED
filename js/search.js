/**
 * search.js - Handles real-time search for posts and users
 */

const SearchManager = {
    query: '',
    isSearching: false,

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const rawQuery = urlParams.get('q') || '';
        this.query = decodeURIComponent(rawQuery).trim();

        // 검색창에 검색어 채우기 (ID: search-input 및 mobile-search-input 대응)
        const searchInput = document.getElementById('search-input') || document.getElementById('mobile-search-input');
        if (searchInput) searchInput.value = this.query;

        console.log(`[KBO Feed] Final Search Query: "${this.query}"`);
        
        // 검색어가 없으면 안내 메시지 표시
        if (!this.query) {
            this.showEmptyState();
            return;
        }

        // 초기 탭 설정 및 검색 실행
        this.handleTabChange('all');

        // 탭 클릭 이벤트 연결
        document.querySelectorAll('.feed-tab').forEach(tab => {
            tab.onclick = (e) => {
                e.preventDefault();
                const target = tab.getAttribute('data-tab');
                this.handleTabChange(target);
            };
        });
    },

    showEmptyState() {
        const container = document.getElementById('search-results-container');
        if (container) container.innerHTML = '<div style="padding: 100px 20px; text-align: center; color: var(--text-secondary);">검색어를 입력하여 야구 소식을 찾아보세요.</div>';
    },

    async handleTabChange(tab) {
        if (this.isSearching) return;
        
        console.log(`[KBO Feed] Switching tab to: ${tab}`);

        // UI 상태 업데이트
        document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`.feed-tab[data-tab="${tab}"]`);
        if (activeTab) activeTab.classList.add('active');

        if (tab === 'all') {
            await this.searchAll();
        } else if (tab === 'users' || tab === 'people') {
            await this.searchUsers();
        } else {
            await this.searchPosts(tab === 'latest' ? 'latest' : 'top');
        }
    },

    async searchAll() {
        const container = document.getElementById('search-results-container');
        if (!container) return;

        this.isSearching = true;
        container.innerHTML = '<div class="loading-spinner" style="padding: 60px; text-align: center;"><i class="fas fa-circle-notch fa-spin" style="font-size: 28px; color: var(--primary-color);"></i></div>';

        try {
            // 전체 탭: 사용자 2명 + 게시물 인기순 10개
            const usersPromise = window.kboSupabase.from('profiles').select('*').or(`display_name.ilike.%${this.query}%,username.ilike.%${this.query}%`).limit(2);
            const postsPromise = window.kboSupabase.from('posts').select('*, profiles(*)').ilike('content', `%${this.query}%`).order('likes_count', { ascending: false }).limit(10);

            const [usersRes, postsRes] = await Promise.all([usersPromise, postsPromise]);

            let html = '';

            // 1. 사용자 결과 + 해당 사용자의 게시물
            if (usersRes.data && usersRes.data.length > 0) {
                html += '<div style="padding: 12px 16px; font-weight: 800; border-bottom: 1px solid var(--border-color); color: var(--primary-color);">검색된 사용자</div>';
                
                for (const user of usersRes.data) {
                    html += this.renderUserCard(user);
                    
                    // 해당 사용자의 최신글 2개 추가 조회
                    const { data: userPosts } = await window.kboSupabase
                        .from('posts')
                        .select('*, profiles(*)')
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(2);
                    
                    if (userPosts && userPosts.length > 0) {
                        html += '<div style="padding: 8px 32px; font-size: 13px; color: var(--text-secondary); background: #f8f9fa;">작성한 최신 게시물</div>';
                        html += userPosts.map(post => UI.tweet({
                            id: post.id,
                            displayName: post.profiles?.display_name,
                            username: `@${post.profiles?.username}`,
                            avatar: post.profiles?.avatar_url,
                            isVerified: post.profiles?.is_verified === true,
                            time: this.formatTime(post.created_at),
                            text: post.content,
                            image: post.image_url,
                            likes: post.likes_count,
                            comments: 0, retweets: 0, views: 100
                        })).join('');
                    }
                }
                html += '<div style="height: 8px; background: var(--border-color); opacity: 0.3;"></div>';
            }

            // 2. 일반 게시물 결과
            if (postsRes.data && postsRes.data.length > 0) {
                html += '<div style="padding: 12px 16px; font-weight: 800; border-bottom: 1px solid var(--border-color);">인기 게시물</div>';
                html += postsRes.data.map(post => UI.tweet({
                    id: post.id,
                    displayName: post.profiles?.display_name,
                    username: `@${post.profiles?.username}`,
                    avatar: post.profiles?.avatar_url,
                    isVerified: post.profiles?.is_verified === true,
                    time: this.formatTime(post.created_at),
                    text: post.content,
                    image: post.image_url,
                    likes: post.likes_count,
                    comments: 0, retweets: 0, views: 100
                })).join('');
            }

            if (!html) {
                container.innerHTML = `<div style="padding: 60px 20px; text-align: center; color: var(--text-secondary);">"${this.query}"에 대한 결과가 없습니다.</div>`;
            } else {
                container.innerHTML = html;
            }

        } catch (error) {
            console.error('Search All Error:', error);
        } finally {
            this.isSearching = false;
        }
    },

    renderUserCard(user) {
        const isVerified = user.is_verified === true;
        return `
            <div class="user-result-card" onclick="window.location.href='/profile.html?u=${user.id}'" style="cursor: pointer; padding: 16px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 12px; background: #fff;">
                <div class="user-avatar" style="background-image: url('${user.avatar_url || '/images/logo.png'}'); width: 52px; height: 52px; background-size: cover; border-radius: 50%; border: 1px solid var(--border-color);"></div>
                <div class="user-info" style="flex: 1; min-width: 0;">
                    <div class="user-main" style="display: flex; align-items: center; gap: 4px;">
                        <span class="display-name" style="font-weight: 800; font-size: 16px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.display_name}</span>
                        ${isVerified ? '<i class="fas fa-check-circle verified" style="color: var(--primary-color); font-size: 14px;"></i>' : ''}
                        <span class="username" style="color: var(--text-secondary); font-size: 14px; margin-left: 2px;">@${user.username}</span>
                    </div>
                    <p class="user-bio" style="font-size: 14px; margin-top: 2px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${user.bio || '야구팬입니다.'}</p>
                </div>
                <button class="follow-btn" style="background: #000; color: #fff; border: none; border-radius: 99px; padding: 8px 16px; font-weight: 700; font-size: 13px; flex-shrink: 0;">팔로우</button>
            </div>
        `;
    },

    async searchPosts(mode = 'top') {
        const container = document.getElementById('search-results-container');
        if (!container) return;

        this.isSearching = true;
        container.innerHTML = '<div class="loading-spinner" style="padding: 60px; text-align: center;"><i class="fas fa-circle-notch fa-spin" style="font-size: 28px; color: var(--primary-color);"></i></div>';

        try {
            let queryBuilder = window.kboSupabase
                .from('posts')
                .select(`
                    *,
                    profiles (
                        username,
                        display_name,
                        avatar_url,
                        is_verified
                    )
                `)
                .ilike('content', `%${this.query}%`);

            if (mode === 'latest') {
                queryBuilder = queryBuilder.order('created_at', { ascending: false });
            } else {
                queryBuilder = queryBuilder.order('likes_count', { ascending: false });
            }

            const { data: posts, error } = await queryBuilder.limit(30);

            if (error) throw error;

            if (!posts || posts.length === 0) {
                container.innerHTML = `<div style="padding: 60px 20px; text-align: center; color: var(--text-secondary);">"${this.query}"에 대한 게시물이 없습니다.</div>`;
                return;
            }

            container.innerHTML = posts.map(post => {
                return UI.tweet({
                    id: post.id,
                    displayName: post.profiles?.display_name || '알 수 없는 유저',
                    username: `@${post.profiles?.username || 'user'}`,
                    avatar: post.profiles?.avatar_url || '/images/logo.png',
                    isVerified: post.profiles?.is_verified === true,
                    time: this.formatTime(post.created_at),
                    text: post.content,
                    image: post.image_url,
                    likes: post.likes_count,
                    comments: 0,
                    retweets: 0,
                    views: Math.floor(Math.random() * 100)
                });
            }).join('');

            // 클릭 이벤트
            container.querySelectorAll('.tweet').forEach(tweet => {
                tweet.onclick = () => {
                    const id = tweet.getAttribute('data-id');
                    if (id) window.location.href = `/post.html?id=${id}`;
                };
            });

        } catch (error) {
            console.error('Search Posts Error:', error);
            container.innerHTML = '<div style="padding: 40px; text-align: center; color: #ff3b30;">검색 중 오류가 발생했습니다.</div>';
        } finally {
            this.isSearching = false;
        }
    },

    async searchUsers() {
        const container = document.getElementById('search-results-container');
        if (!container) return;

        this.isSearching = true;
        container.innerHTML = '<div class="loading-spinner" style="padding: 60px; text-align: center;"><i class="fas fa-circle-notch fa-spin" style="font-size: 28px; color: var(--primary-color);"></i></div>';

        try {
            console.log(`[KBO Feed] Executing User Search for: ${this.query}`);

            // 쿼리 방식을 더 원시적으로(Raw) 시도하여 필터링 누락 방지
            const { data: users, error } = await window.kboSupabase
                .from('profiles')
                .select('*')
                .or(`display_name.ilike.%${this.query}%,username.ilike.%${this.query}%`)
                .limit(20);

            if (error) throw error;

            if (!users || users.length === 0) {
                container.innerHTML = `<div style="padding: 60px 20px; text-align: center; color: var(--text-secondary);">"${this.query}" 사용자를 찾을 수 없습니다.</div>`;
                return;
            }

            let html = '';
            for (const user of users) {
                html += this.renderUserCard(user);
            }
            container.innerHTML = html;

        } catch (error) {
            console.error('Search Users Error:', error);
            container.innerHTML = '<div style="padding: 40px; text-align: center; color: #ff3b30;">사용자 검색 중 오류가 발생했습니다.</div>';
        } finally {
            this.isSearching = false;
        }
    },

    formatTime(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diff = Math.floor((now - past) / 1000);
        if (diff < 60) return '방금 전';
        if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
        return `${Math.floor(diff / 86400)}일 전`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    SearchManager.init();
});
