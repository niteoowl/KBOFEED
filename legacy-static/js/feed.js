/**
 * feed.js - Supabase Posts & Comments Manager
 */

const FeedManager = {
    isFetchingAll: false,
    isFetchingMyTeam: false,

    // 1. Fetch Posts with Profile Info
    async fetchPosts(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 동시 호출 방지 (컨테이너별 락)
        if (containerId === 'feed-all-container') {
            if (this.isFetchingAll) return;
            this.isFetchingAll = true;
        } else if (containerId === 'feed-myteam-container') {
            if (this.isFetchingMyTeam) return;
            this.isFetchingMyTeam = true;
        }

        try {
            // profiles 테이블과 조인하여 작성자 정보와 함께 가져옴
            let query = window.kboSupabase
                .from('posts')
                .select(`
                    *,
                    profiles!posts_user_id_fkey (
                        username,
                        display_name,
                        avatar_url,
                        is_verified
                    ),
                    retweet_post:retweet_id (
                        content,
                        image_url,
                        profiles!posts_user_id_fkey (
                            username,
                            display_name
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            // 유저 ID 필터링 (프로필 페이지용)
            if (options.userId) {
                query = query.eq('user_id', options.userId);
            }

            // 구단 피드 필터링 (team_tag 기준)
            if (options.teamTag) {
                query = query.eq('team_tag', options.teamTag);
            }

            // 구단 모아보기 필터링 (내용에 구단명 포함)
            if (options.searchQuery) {
                query = query.ilike('content', `%${options.searchQuery}%`);
            }

            const { data: posts, error } = await query;

            if (error) throw error;

            if (!posts || posts.length === 0) {
                container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-secondary);">${options.searchQuery || options.teamTag ? '관련 게시물이 없습니다.' : '표시할 게시물이 없습니다.'}</div>`;
                return;
            }

            // 현재 유저가 좋아요/리트윗한 목록 가져오기 (테이블이 없어도 로딩이 멈추지 않게 개별 처리)
            let myLikes = [];
            let myRTs = [];
            if (this.currentUser) {
                try {
                    const { data: likes } = await window.kboSupabase.from('likes').select('post_id').eq('user_id', this.currentUser.id);
                    if (likes) myLikes = likes.map(l => l.post_id);
                    
                    const { data: rts } = await window.kboSupabase.from('retweets').select('post_id').eq('user_id', this.currentUser.id);
                    if (rts) myRTs = rts.map(r => r.post_id);
                } catch (e) {
                    console.warn('[KBO Feed] Likes/RTs table might be missing:', e);
                }
            }

            // 광고 데이터 가져오기 (메인 피드일 경우에만)
            let ads = [];
            if (containerId === 'feed-all-container') {
                const { data: activeAds } = await window.kboSupabase.from('ads').select('*').eq('is_active', true);
                ads = activeAds || [];
            }

            let html = '';
            posts.forEach((post, index) => {
                const isLikedByMe = myLikes.includes(post.id);
                const isRTedByMe = myRTs.includes(post.id);

                let displayContent = post.content || '';
                let displayImage = post.image_url;
                let originalAuthor = null;

                if (post.retweet_id && post.retweet_post) {
                    displayContent = post.retweet_post.content || '';
                    displayImage = post.retweet_post.image_url;
                    originalAuthor = post.retweet_post.profiles?.display_name || post.retweet_post.profiles?.username || '알 수 없는 유저';
                }

                // 게시물 렌더링
                html += UI.tweet({
                    id: post.id,
                    handle: post.profiles?.username || 'user',
                    displayName: post.profiles?.display_name || '알 수 없는 유저',
                    username: `@${post.profiles?.username || 'user'}`,
                    avatar: post.profiles?.avatar_url || '/images/logo.png',
                    isVerified: post.profiles?.is_verified, // 인증 배지 여부 전달
                    time: this.formatTime(post.created_at),
                    text: displayContent,
                    image: displayImage,
                    originalAuthor: originalAuthor,
                    likes: post.likes_count,
                    comments: 0,
                    retweets: post.retweets_count || 0,
                    views: Math.floor(Math.random() * 100),
                    isLiked: isLikedByMe,
                    isRTed: isRTedByMe
                });

                // 5번째 게시물마다 광고 삽입
                if (ads.length > 0 && (index + 1) % 5 === 0) {
                    const ad = ads[Math.floor(Math.random() * ads.length)];
                    html += `
                        <div class="ad-item" style="padding: 16px; border-bottom: 1px solid var(--border-color); background: #fcfcfc;">
                            <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 8px;">
                                <div style="background: #eee; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; color: #888;">AD</div>
                                <div style="font-weight: 700; font-size: 14px;">추천 스폰서 소식</div>
                            </div>
                            <div style="font-size: 15px; margin-bottom: 8px;">${ad.content}</div>
                            ${ad.image_url ? `<img src="${ad.image_url}" style="width: 100%; border-radius: 12px; margin-bottom: 8px; cursor: pointer;" onclick="window.open('${ad.link_url}', '_blank')">` : ''}
                            <div style="display: flex; justify-content: flex-end;">
                                <button onclick="window.open('${ad.link_url}', '_blank')" style="background: #000; color: #fff; border: none; padding: 6px 12px; border-radius: 99px; font-size: 13px; font-weight: 700; cursor: pointer;">더 알아보기</button>
                            </div>
                        </div>
                    `;
                }
            });

            container.innerHTML = html;

            // 게시물 클릭 시 상세 페이지 이동 이벤트 등록
            if (window.KBO_POST_URL) {
                window.KBO_POST_URL.attachTweetClickHandlers(container);
            } else {
                container.querySelectorAll('.tweet').forEach((tweet) => {
                    tweet.onclick = () => {
                        const id = tweet.getAttribute('data-id');
                        if (id) window.location.href = `post.html?id=${encodeURIComponent(id)}`;
                    };
                });
            }

        } catch (error) {
            console.error('Feed Fetch Error:', error);
            if (container) container.innerHTML = '<div style="padding: 20px; text-align: center; color: #ff3b30;">게시물을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</div>';
        } finally {
            if (containerId === 'feed-all-container') this.isFetchingAll = false;
            if (containerId === 'feed-myteam-container') this.isFetchingMyTeam = false;
        }
    },

    // 2. Create New Post
    async createPost(content, imageFile = null) {
        try {
            const { data: { session } } = await window.kboSupabase.auth.getSession();
            if (!session) {
                alert('로그인이 필요한 기능입니다.');
                window.location.href = '/login.html';
                return;
            }

            let imageUrl = null;
            if (imageFile) {
                imageUrl = await this.uploadImageToImgBB(imageFile);
            }

            // 본문에 팀 해시태그나 키워드가 있으면 자동 태깅 (간단한 예시)
            let teamTag = null;
            const teams = ['LG', 'KIA', '삼성', 'SSG', '두산', 'NC', '한화', '롯데', 'KT', '키움'];
            for (const team of teams) {
                if (content.includes(team)) {
                    teamTag = team;
                    break;
                }
            }

            const { data, error } = await window.kboSupabase
                .from('posts')
                .insert({
                    user_id: session.user.id,
                    content: content,
                    image_url: imageUrl,
                    team_tag: teamTag
                })
                .select();

            if (error) throw error;
            
            // 성공 시 피드 새로고침
            this.fetchPosts('feed-all-container');
            return data;

        } catch (error) {
            console.error('Create Post Error:', error);
            alert('게시물 작성에 실패했습니다.');
        }
    },

    async uploadImageToImgBB(file) {
        const apiKey = 'fdd1c97d2f4e24833b2ae441153061f9';
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                return result.data.url;
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error('ImgBB Upload Error:', error);
            alert('이미지 업로드에 실패했습니다.');
            return null;
        }
    },

    // 3. Handle My Team Logic (getSession 우회 및 비로그인 지원)
    async setupMyTeamSafely() {
        // 구단 선택 이벤트 등록 (비로그인도 동작)
        document.querySelectorAll('.team-mini-card').forEach(card => {
            card.onclick = async () => {
                const teamId = card.getAttribute('data-id');
                const teamName = card.getAttribute('data-team');
                
                this.updateMyTeamUI(teamId, teamName);
                localStorage.setItem('selected_team', teamId);
                
                // 프로필 업데이트 (DB 저장 - 로그인 시에만)
                if (this.currentUser) {
                    console.log(`[KBO Feed] Saving favorite team: ${teamId} for user: ${this.currentUser.id}`);
                    const { error } = await window.kboSupabase
                        .from('profiles')
                        .update({ favorite_team: teamId })
                        .eq('id', this.currentUser.id);

                    if (error) console.error('Update Profile Error:', error);
                }

                this.fetchMyTeamData(teamId);
                const pickerEl = document.getElementById('inline-team-picker');
                if (pickerEl) pickerEl.classList.remove('active');
                const teamBtn = document.getElementById('open-team-picker');
                if (teamBtn) teamBtn.textContent = '변경';
            };
        });

        // 서브 탭 전환 이벤트
        document.querySelectorAll('.sub-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const teamId = localStorage.getItem('selected_team');
                if (teamId) this.fetchMyTeamData(teamId);
            };
        });

        // 사용자 프로필에서 응원 구단 가져오기 (초기 로드)
        let currentTeam = localStorage.getItem('selected_team');

        if (this.currentUser) {
            try {
                const { data: profile } = await window.kboSupabase
                    .from('profiles')
                    .select('favorite_team')
                    .eq('id', this.currentUser.id)
                    .single();

                if (profile?.favorite_team) {
                    currentTeam = profile.favorite_team;
                    localStorage.setItem('selected_team', currentTeam);
                }
            } catch (e) {
                console.warn('[KBO Feed] My Team Error:', e);
            }
        }
        
        if (currentTeam) {
            this.updateMyTeamUI(currentTeam);
            this.fetchMyTeamData(currentTeam);
        }
    },

    updateMyTeamUI(teamId, teamName) {
        const nameEl = document.getElementById('current-team-name');
        const logoEl = document.getElementById('current-team-logo');

        if (logoEl && teamId && typeof KBO_CONSTANTS !== 'undefined') {
            const logoFile = KBO_CONSTANTS.TEAM_LOGO_MAP[teamId]
                || KBO_CONSTANTS.TEAM_LOGO_MAP[String(teamId).toUpperCase()];
            if (logoFile) logoEl.src = `images/${logoFile}`;
        }
        
        // 아이디를 기반으로 공식 명칭 찾기
        const upperId = teamId ? teamId.toUpperCase() : '';
        const teamSuffixMap = {
            'LG': '트윈스', 'KIA': '타이거즈', 'SS': '라이온즈', '삼성': '라이온즈',
            'SSG': '랜더스', '두산': '베어스', 'OB': '베어스', 'NC': '다이노스',
            '한화': '이글스', 'HH': '이글스', '롯데': '자이언츠', 'LT': '자이언츠',
            'KT': '위즈', '키움': '히어로즈', 'WO': '히어로즈'
        };
        
        const suffix = teamSuffixMap[upperId] || '';
        const baseName = KBO_CONSTANTS.TEAM_NAME_MAP[upperId] || upperId;
        const officialName = teamName || `${baseName} ${suffix}`.trim();
        
        if (nameEl) nameEl.textContent = officialName; 
    },

    async handleLike(btnEl, postId) {
        // 1. 로그인 체크
        const { data: { session } } = await window.kboSupabase.auth.getSession();
        if (!session) {
            alert('좋아요를 누르려면 로그인이 필요합니다.');
            window.location.href = '/login.html';
            return;
        }

        if (btnEl.classList.contains('processing')) return;
        btnEl.classList.add('processing');

        try {
            const countEl = btnEl.querySelector('span');
            const iconEl = btnEl.querySelector('i');
            // 사용자의 요청에 따라 현재 상태 체크 로직 보정
            const isFilled = iconEl.classList.contains('fas');

            // 2. DB 토글 (RPC 호출)
            const { data: newCount, error } = await window.kboSupabase.rpc('toggle_like', { 
                post_id_input: postId,
                user_id_input: session.user.id
            });

            if (error) throw error;

            // 3. UI 업데이트 (아이콘 상태 반전)
            countEl.textContent = newCount;
            if (isFilled) {
                iconEl.classList.remove('fas');
                iconEl.classList.add('far');
                btnEl.style.color = ''; 
            } else {
                iconEl.classList.remove('far');
                iconEl.classList.add('fas');
                btnEl.style.color = '#f91880'; 
            }

        } catch (error) {
            console.error('Like Toggle Error:', error);
        } finally {
            btnEl.classList.remove('processing');
        }
    },

    async handleRetweet(btnEl, postId) {
        const { data: { session } } = await window.kboSupabase.auth.getSession();
        if (!session) {
            alert('리트윗하려면 로그인이 필요합니다.');
            window.location.href = '/login.html';
            return;
        }

        if (btnEl.classList.contains('processing')) return;
        btnEl.classList.add('processing');

        try {
            const countEl = btnEl.querySelector('span');
            const isActive = btnEl.classList.contains('active') || btnEl.style.color === 'rgb(0, 186, 124)';

            // 1. DB 토글 (RPC 호출)
            const { data: newCount, error } = await window.kboSupabase.rpc('toggle_retweet', { 
                post_id_input: postId,
                user_id_input: session.user.id
            });

            if (error) throw error;

            // 2. 실제 게시물로 리트윗 생성/삭제 (X 스타일)
            if (!isActive) {
                // 리트윗 생성: 원본 글을 참조하는 새 포스트 등록
                await window.kboSupabase.from('posts').insert({
                    user_id: session.user.id,
                    retweet_id: postId,
                    content: null // 순수 리트윗은 내용 없음
                });
                btnEl.classList.add('active');
                btnEl.style.color = '#00ba7c';
            } else {
                // 리트윗 취소: 내가 생성한 리트윗 포스트 삭제
                await window.kboSupabase.from('posts').delete().eq('user_id', session.user.id).eq('retweet_id', postId);
                btnEl.classList.remove('active');
                btnEl.style.color = '';
            }

            countEl.textContent = newCount;
            
            // 리트윗/취소 성공 후 피드 즉시 갱신
            await this.fetchPosts();

        } catch (error) {
            console.error('RT Toggle Error:', error);
            alert('리트윗 처리 중 오류가 발생했습니다. DB 설정을 확인해주세요.');
        } finally {
            btnEl.classList.remove('processing');
        }
    },

    fetchMyTeamData(teamId) {
        const activeSubTab = document.querySelector('.sub-tab.active')?.getAttribute('data-subtab');
        if (activeSubTab === 'collection') {
            this.fetchPosts('feed-myteam-container', { searchQuery: teamId });
        } else {
            this.fetchPosts('feed-myteam-container', { teamTag: teamId });
        }
    },

    // Utility: Format Time (e.g., "5분 전")
    formatTime(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diff = Math.floor((now - past) / 1000);

        if (diff < 60) return '방금 전';
        if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
        return `${Math.floor(diff / 86400)}일 전`;
    },

    // Initialize listeners
    init() {
        const page = document.body.getAttribute('data-page');

        // 로그인 시 무한 로딩(getSession 멈춤) 원천 차단: 비로그인 방식과 동일하게 로컬에서 즉시 파싱
        try {
            const authData = localStorage.getItem('sb-zwjfaepctxoazrbcosix-auth-token');
            if (authData) {
                const session = JSON.parse(authData);
                this.currentUser = session.user || null;
            } else {
                this.currentUser = null;
            }
        } catch (e) {
            this.currentUser = null;
        }

        // 세션 확인 기다리지 않고 피드 즉시 로드 (이상 현상 완벽 제거)
        if (page === 'home') {
            this.isFetchingAll = false; 
            this.fetchPosts('feed-all-container');
            
            // 응원 팀 세팅도 getSession을 쓰지 않고 안전하게 호출
            this.setupMyTeamSafely();
        }

        const inlinePostBtn = document.querySelector('.inline-post-btn');
        const inlineTextarea = document.querySelector('.compose-input-area textarea');
        
        // 모달 관련 요소 선언 복구
        const modalPostBtn = document.querySelector('.modal-post-btn');
        const modalTextarea = document.querySelector('.modal-input');
        
        const imageInput = document.getElementById('image-upload-input');
        const previewContainer = document.getElementById('image-preview-container');
        const previewImg = document.getElementById('compose-image-preview');
        const removeImageBtn = document.getElementById('remove-image-btn');

        let selectedFile = null;

        if (imageInput) {
            imageInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    selectedFile = file;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        previewImg.src = event.target.result;
                        previewContainer.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        if (removeImageBtn) {
            removeImageBtn.onclick = () => {
                selectedFile = null;
                imageInput.value = '';
                previewContainer.style.display = 'none';
                previewImg.src = '';
            };
        }

        const handlePost = async (textarea, targetBtn) => {
            const content = textarea.value.trim();
            if (!content && !selectedFile) return;

            if (targetBtn) {
                targetBtn.disabled = true;
                targetBtn.textContent = '게시 중...';
            }

            await this.createPost(content, selectedFile);
            
            textarea.value = '';
            selectedFile = null;
            if (imageInput) imageInput.value = '';
            if (previewContainer) previewContainer.style.display = 'none';
            
            if (targetBtn) {
                targetBtn.disabled = false;
                targetBtn.textContent = '게시하기';
            }
            
            // 모달이 열려있다면 닫기
            const modal = document.getElementById('post-modal');
            if (modal) modal.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (inlinePostBtn && inlineTextarea) {
            inlinePostBtn.onclick = () => handlePost(inlineTextarea, inlinePostBtn);
        }

        if (modalPostBtn && modalTextarea) {
            modalPostBtn.onclick = () => handlePost(modalTextarea, modalPostBtn);
        }
    }
};

// Initialize Manager
const bootstrapFeed = () => {
    console.log('[KBO Feed] Bootstrapping FeedManager');
    FeedManager.init();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapFeed);
} else {
    bootstrapFeed();
}

// BFCache (뒤로가기) 복원 시 무한 로딩 해결
window.addEventListener('pageshow', (event) => {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        // Supabase 클라이언트가 뒤로가기 시 인증 상태 확인을 위해 내부적으로 무한 대기에 빠지는 현상(Zombie state)이 원인이므로,
        // 어설프게 fetch를 다시 호출하지 않고 깔끔하게 페이지를 새로고침하여 통신 상태를 초기화합니다.
        window.location.reload();
    }
});
