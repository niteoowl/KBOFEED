/**
 * admin.js - Admin Dashboard Logic
 */

const AdminManager = {
    async init() {
        document.getElementById('search-user-btn').onclick = () => this.searchUser();
        document.getElementById('create-ad-btn').onclick = () => this.createAd();
        this.fetchAds();
    },

    async searchUser() {
        const query = document.getElementById('user-search-input').value.trim().replace('@', '');
        if (!query) return;

        const resultArea = document.getElementById('user-result-area');
        resultArea.style.display = 'block';
        resultArea.innerHTML = '검색 중...';

        const { data: user, error } = await window.kboSupabase
            .from('profiles')
            .select('*')
            .eq('username', query)
            .maybeSingle();

        if (error || !user) {
            resultArea.innerHTML = '사용자를 찾을 수 없습니다.';
            return;
        }

        const isVerified = user.is_verified === true;

        resultArea.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${user.avatar_url || '/images/logo.png'}" style="width: 50px; height: 50px; border-radius: 50%;">
                    <div>
                        <div style="font-weight: 700;">${user.display_name} ${isVerified ? '✅' : ''}</div>
                        <div style="color: var(--text-secondary); font-size: 14px;">@${user.username}</div>
                    </div>
                </div>
                <button id="verify-toggle-btn" style="background: ${isVerified ? '#ff3b30' : '#007aff'}; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">
                    ${isVerified ? '인증 취소' : '공식 인증'}
                </button>
            </div>
        `;

        document.getElementById('verify-toggle-btn').onclick = () => this.toggleVerify(user.id, isVerified);
    },

    async toggleVerify(userId, currentStatus) {
        const newStatus = !currentStatus;
        
        console.log(`[Admin] Switching user ${userId} to is_verified: ${newStatus}`);

        const { error } = await window.kboSupabase
            .from('profiles')
            .update({ is_verified: newStatus })
            .eq('id', userId);

        if (error) {
            console.error('Update Failed:', error);
            alert(`업데이트 실패: ${error.message}`);
        } else {
            alert(newStatus ? '공식 인증 배지가 부여되었습니다.' : '인증이 취소되었습니다.');
            this.searchUser();
        }
    },

    async createAd() {
        const content = document.getElementById('ad-content').value.trim();
        const imageUrl = document.getElementById('ad-image-url').value.trim();
        const linkUrl = document.getElementById('ad-link-url').value.trim();

        if (!content) {
            alert('광고 문구를 입력하세요.');
            return;
        }

        const { error } = await window.kboSupabase
            .from('ads')
            .insert({
                content,
                image_url: imageUrl,
                link_url: linkUrl
            });

        if (error) {
            alert('광고 등록 실패: ' + error.message);
        } else {
            alert('광고가 등록되었습니다.');
            document.getElementById('ad-content').value = '';
            document.getElementById('ad-image-url').value = '';
            document.getElementById('ad-link-url').value = '';
            this.fetchAds();
        }
    },

    async fetchAds() {
        const container = document.getElementById('active-ads-list');
        const { data: ads, error } = await window.kboSupabase
            .from('ads')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error || !ads) return;

        container.innerHTML = ads.map(ad => `
            <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 600;">${ad.content}</div>
                    <div style="font-size: 12px; color: var(--text-secondary);">${ad.link_url || '링크 없음'}</div>
                </div>
                <button onclick="AdminManager.deleteAd(${ad.id})" style="color: #ff3b30; background: none; border: none; cursor: pointer;">삭제</button>
            </div>
        `).join('');
    },

    async deleteAd(id) {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        const { error } = await window.kboSupabase.from('ads').delete().eq('id', id);
        if (error) alert('삭제 실패');
        else this.fetchAds();
    }
};

document.addEventListener('DOMContentLoaded', () => AdminManager.init());
window.AdminManager = AdminManager;
