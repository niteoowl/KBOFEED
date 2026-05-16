'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useProfile } from '@/context/ProfileContext';
import { updateProfile, getProfile } from '@/app/actions/user';
import { KBO_TEAMS, getTeamLogo } from '@/lib/constants';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { refreshProfile } = useProfile();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const username = (session?.user as any)?.username;

  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    favoriteTeam: '',
    avatarUrl: '',
    coverUrl: '',
  });

  useEffect(() => {
    if (username) {
      getProfile(username).then((profile) => {
        if (profile) {
          setEditForm({
            displayName: profile.displayName || '',
            bio: profile.bio || '',
            favoriteTeam: profile.favoriteTeam || '',
            avatarUrl: profile.avatarUrl || '',
            coverUrl: profile.coverUrl || '',
          });
        }
        setIsFetching(false);
      });
    } else {
      setIsFetching(false);
    }
  }, [username]);

  const scrollCarousel = (direction: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: direction * 150, behavior: 'smooth' });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile(editForm);
      await updateSession({
        name: editForm.displayName,
        image: editForm.avatarUrl || undefined,
      });
      await refreshProfile();
      setSuccess('프로필이 성공적으로 업데이트되었습니다.');
      setTimeout(() => {
        router.push(`/@${username}`);
      }, 1000);
    } catch (err) {
      setError('프로필 설정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (isFetching) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;
  }

  return (
    <main className="main-feed" style={{ borderTop: 'none', paddingTop: 0 }}>
      <section className="profile-container" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '8px solid var(--divider-color)', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
        
        <header style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', position: 'relative' }}>
          <button onClick={() => router.back()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--text-primary)', position: 'absolute', left: 16 }}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 auto', textAlign: 'center', flex: 1 }}>정보 수정</h1>
        </header>

        <div style={{ padding: '24px' }}>
          <form onSubmit={handleSaveProfile}>
            {error && <div style={{ color: '#f4212e', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
            {success && <div style={{ color: '#00ba7c', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{success}</div>}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 700 }}>커버 이미지 URL</label>
              <input 
                value={editForm.coverUrl} onChange={e => setEditForm({...editForm, coverUrl: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '15px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
                placeholder="https://..."
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 700 }}>프로필 이미지 URL</label>
              <input 
                value={editForm.avatarUrl} onChange={e => setEditForm({...editForm, avatarUrl: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '15px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
                placeholder="https://..."
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 700 }}>이름 (Display Name)</label>
              <input 
                value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '15px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 700 }}>소개글 (Bio)</label>
              <textarea 
                value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', minHeight: '80px', fontSize: '15px', background: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }} 
              />
            </div>

            <div className="form-group" style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>나의 응원팀 선택</label>
              <div className="team-carousel-container" style={{ margin: 0 }}>
                <button type="button" className="carousel-nav" onClick={() => scrollCarousel(-1)}>
                  <i className="fas fa-chevron-left"></i>
                </button>
                <div className="team-carousel" ref={carouselRef}>
                  {KBO_TEAMS.map((team) => (
                    <label key={team.id} className="team-option">
                      <input 
                        type="radio" 
                        name="team" 
                        value={team.id} 
                        checked={editForm.favoriteTeam === team.id}
                        onChange={(e) => setEditForm({...editForm, favoriteTeam: e.target.value})}
                      />
                      <div className="team-card">
                        <img src={getTeamLogo(team.id)} alt={team.shortLabel} />
                        <span>{team.shortLabel}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <button type="button" className="carousel-nav" onClick={() => scrollCarousel(1)}>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit"
                disabled={loading}
                style={{ 
                  padding: '12px 24px', 
                  borderRadius: '9999px', 
                  border: 'none', 
                  background: 'var(--primary-color)', 
                  color: '#fff', 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  fontWeight: 700,
                  fontSize: '15px'
                }}
              >
                {loading ? '저장 중...' : '변경사항 저장'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
