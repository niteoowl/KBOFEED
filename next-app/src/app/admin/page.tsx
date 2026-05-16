'use client';

import { useState, useEffect } from 'react';
import { searchUsers, toggleUserVerification, getActiveAds, createAd, toggleAdStatus, deleteAd } from '@/app/actions/admin';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Ad form state
  const [adContent, setAdContent] = useState('');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adLinkUrl, setAdLinkUrl] = useState('');
  const [ads, setAds] = useState<any[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const data = await getActiveAds();
      setAds(data);
    } catch (err) {
      console.error(err);
      alert('관리자 권한이 없거나, 데이터를 불러오지 못했습니다.');
      router.push('/');
    } finally {
      setLoadingAds(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoadingSearch(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
      alert('검색 중 오류가 발생했습니다.');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserVerification(userId, !currentStatus);
      // Update local state
      setSearchResults(prev => prev.map(u => 
        u.id === userId ? { ...u, isVerified: !currentStatus } : u
      ));
    } catch (err) {
      console.error(err);
      alert('상태 변경 실패');
    }
  };

  const handleCreateAd = async () => {
    if (!adContent.trim()) {
      alert('광고 내용을 입력해주세요.');
      return;
    }
    try {
      await createAd({
        content: adContent,
        imageUrl: adImageUrl,
        linkUrl: adLinkUrl
      });
      setAdContent('');
      setAdImageUrl('');
      setAdLinkUrl('');
      loadAds();
      alert('광고가 성공적으로 등록되었습니다.');
    } catch (err) {
      console.error(err);
      alert('광고 등록 실패');
    }
  };

  const handleToggleAd = async (adId: number, currentStatus: boolean) => {
    try {
      await toggleAdStatus(adId, !currentStatus);
      loadAds();
    } catch (err) {
      console.error(err);
      alert('상태 변경 실패');
    }
  };

  const handleDeleteAd = async (adId: number) => {
    if (!confirm('정말로 이 광고를 삭제하시겠습니까?')) return;
    try {
      await deleteAd(adId);
      loadAds();
    } catch (err) {
      console.error(err);
      alert('삭제 실패');
    }
  };

  if (loadingAds) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>권한 확인 중...</div>;
  }

  return (
    <main className="main-feed" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800 }}>🛠️ Admin Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>사용자 인증 및 광고 관리 시스템</p>
      </header>

      {/* User Verification Section */}
      <section style={{ marginBottom: '60px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>✅ 사용자 공식 인증 배지 부여</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="사용자 핸들(@username) 검색" 
            style={{ flex: 1, padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '15px' }}
          />
          <button 
            onClick={handleSearch}
            disabled={loadingSearch}
            style={{ background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
          >
            {loadingSearch ? '검색...' : '검색'}
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '20px' }}>
            {searchResults.map(user => (
              <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: user.avatarUrl ? `url(${user.avatarUrl}) center/cover` : '#ccc' }} />
                  <div>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {user.displayName || '탐험가'}
                      {user.isVerified && <i className="fas fa-check-circle" style={{ color: 'var(--primary-color)' }}></i>}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>@{user.username}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleVerification(user.id, user.isVerified)}
                  style={{ 
                    padding: '8px 16px', borderRadius: '999px', fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: user.isVerified ? '#f3f4f6' : '#111827',
                    color: user.isVerified ? '#111827' : '#fff'
                  }}
                >
                  {user.isVerified ? '인증 해제' : '인증 부여'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ad Management Section */}
      <section>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>📢 피드 광고 관리</h2>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>광고 문구</label>
            <textarea 
              value={adContent}
              onChange={(e) => setAdContent(e.target.value)}
              placeholder="광고 내용을 입력하세요" 
              style={{ width: '100%', padding: '12px', boxSizing: 'border-box', border: '1px solid var(--border-color)', borderRadius: '8px', minHeight: '80px', resize: 'vertical' }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>이미지 URL (ImgBB 등)</label>
            <input 
              type="text" 
              value={adImageUrl}
              onChange={(e) => setAdImageUrl(e.target.value)}
              placeholder="https://..." 
              style={{ width: '100%', padding: '12px', boxSizing: 'border-box', border: '1px solid var(--border-color)', borderRadius: '8px' }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>랜딩 페이지 링크</label>
            <input 
              type="text" 
              value={adLinkUrl}
              onChange={(e) => setAdLinkUrl(e.target.value)}
              placeholder="https://..." 
              style={{ width: '100%', padding: '12px', boxSizing: 'border-box', border: '1px solid var(--border-color)', borderRadius: '8px' }}
            />
          </div>
          <button 
            onClick={handleCreateAd}
            style={{ width: '100%', background: '#111827', color: 'white', border: 'none', padding: '16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '16px' }}
          >
            광고 등록하기
          </button>
        </div>

        <div style={{ marginTop: '30px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>현재 등록된 광고</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ads.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)' }}>등록된 광고가 없습니다.</div>
            ) : (
              ads.map(ad => (
                <div key={ad.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{ad.content}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleToggleAd(ad.id, ad.isActive)}
                        style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border-color)', background: ad.isActive ? '#10b981' : '#f3f4f6', color: ad.isActive ? '#fff' : '#111827' }}
                      >
                        {ad.isActive ? '활성' : '비활성'}
                      </button>
                      <button 
                        onClick={() => handleDeleteAd(ad.id)}
                        style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', border: 'none', background: '#ef4444', color: '#fff' }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  {ad.imageUrl && (
                    <img src={ad.imageUrl} alt="Ad Visual" style={{ width: '100px', borderRadius: '8px', objectFit: 'cover' }} />
                  )}
                  {ad.linkUrl && (
                    <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', fontSize: '14px' }}>
                      {ad.linkUrl}
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
