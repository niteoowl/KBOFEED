/**
 * myaccount.js - Handles profile editing logic
 */

const MyAccountManager = {
    async init() {
        console.log('[KBO Feed] Initializing MyAccount Manager');
        
        try {
            // 1. 세션 확인
            const { data: { session } } = await window.kboSupabase.auth.getSession();
            if (!session) {
                alert('로그인이 필요한 페이지입니다.');
                window.location.href = '/login.html';
                return;
            }

            this.userId = session.user.id;

            // 2. 현재 프로필 데이터 로드
            const { data: profile, error } = await window.kboSupabase
                .from('profiles')
                .select('*')
                .eq('id', this.userId)
                .single();

            if (error) throw error;

            if (profile) {
                this.populateForm(profile);
            }

            // 3. 폼 제출 이벤트 리스너
            const form = document.getElementById('edit-profile-form');
            if (form) {
                form.onsubmit = (e) => this.handleSubmit(e);
            }

        } catch (error) {
            console.error('Account Load Error:', error);
            alert('정보를 불러오는 중 오류가 발생했습니다.');
        }
    },

    populateForm(profile) {
        document.getElementById('edit-display-name').value = profile.display_name || '';
        document.getElementById('edit-username').value = profile.username || '';
        document.getElementById('edit-bio').value = profile.bio || ''; 
    },

    async handleSubmit(e) {
        e.preventDefault();
        
        const displayName = document.getElementById('edit-display-name').value.trim();
        const username = document.getElementById('edit-username').value.trim();
        const bio = document.getElementById('edit-bio').value.trim();

        if (!displayName || !username) {
            alert('이름과 핸들은 필수 항목입니다.');
            return;
        }

        try {
            const { error } = await window.kboSupabase
                .from('profiles')
                .update({
                    display_name: displayName,
                    username: username,
                    bio: bio 
                })
                .eq('id', this.userId);

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    alert('이미 사용 중인 핸들입니다.');
                } else {
                    throw error;
                }
                return;
            }

            alert('정보가 성공적으로 수정되었습니다.');
            window.location.href = '/profile.html';

        } catch (error) {
            console.error('Profile Update Error:', error);
            alert('수정 중 오류가 발생했습니다.');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MyAccountManager.init();
});
