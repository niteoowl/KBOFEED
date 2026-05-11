/**
 * profile_manager.js - Handles dynamic profile data
 */

const ProfileManager = {
    async init() {
        const page = document.body.getAttribute('data-page');
        if (page !== 'profile') return;

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const targetUserId = urlParams.get('u'); // u 파라미터 확인

            const { data: { session } } = await window.kboSupabase.auth.getSession();
            
            // 로그인 체크 (본인 프로필 볼 때만 강제하거나 전체 차단할지 결정 - 여기선 기본적으로 세션 필요)
            if (!session && !targetUserId) {
                window.location.href = '/login.html';
                return;
            }

            const userIdToFetch = targetUserId || session?.user?.id;

            if (!userIdToFetch) return;

            const { data: profile, error } = await window.kboSupabase
                .from('profiles')
                .select('*')
                .eq('id', userIdToFetch)
                .maybeSingle();

            if (error) throw error;

            if (profile) {
                this.renderProfile(profile);
                // 해당 유저의 피드 로드
                if (window.FeedManager) {
                    window.FeedManager.fetchPosts('profile-feed-container', { userId: userIdToFetch });
                }
            } else {
                alert('사용자를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('Profile Load Error:', error);
        }
    },

    renderProfile(profile) {
        const nameEl = document.querySelector('.profile-name-large');
        const handleEl = document.querySelector('.profile-handle-large');
        const avatarEl = document.querySelector('.profile-avatar-new');
        const bioEl = document.querySelector('.profile-bio-new');
        const teamBadgeImg = document.querySelector('.team-badge img');
        const teamBadgeText = document.querySelector('.team-badge span');
        
        if (nameEl) {
            nameEl.innerHTML = `${profile.display_name} ${profile.is_verified ? '<i class="fas fa-check-circle verified" style="color: var(--primary-color); font-size: 18px; margin-left: 4px;"></i>' : ''}`;
        }
        if (handleEl) handleEl.textContent = `@${profile.username}`;
        if (bioEl) bioEl.textContent = profile.bio || '자기소개가 없습니다.';
        if (avatarEl && profile.avatar_url) {
            avatarEl.style.backgroundImage = `url('${profile.avatar_url}')`;
        }

        // 응원 팀 반영
        if (profile.favorite_team) {
            if (teamBadgeImg) teamBadgeImg.src = KBO_UTILS.getLogoUrl(profile.favorite_team);
            if (teamBadgeText) teamBadgeText.textContent = `${profile.favorite_team} 팬`;
            
            // 바이오 내의 텍스트도 변경 (선택 사항)
            if (bioEl && bioEl.textContent.includes('LG 트윈스')) {
                bioEl.textContent = bioEl.textContent.replace('LG 트윈스', profile.favorite_team);
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ProfileManager.init();
});
