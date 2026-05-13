'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { completeOnboarding } from '@/app/actions/auth';
import { KBO_TEAMS, getTeamLogo } from '@/lib/constants';

export const runtime = 'edge';

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: direction * 150, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await completeOnboarding(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        // ★ 세션 갱신 후 하드 리다이렉트로 완전히 새로운 세션을 로드
        // router.push('/')는 클라이언트 캐시된 세션이 needsOnboarding=true를 유지해
        // OnboardingGuard가 다시 온보딩으로 보내는 문제가 있음
        await update();
        window.location.href = '/';
      }
    } catch (err) {
      setError('프로필 설정 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .sidebar, .right-sidebar, .mobile-nav { display: none !important; }
        .main-feed { max-width: 100% !important; border: none !important; }
        .app-container { display: block !important; }
      `}</style>
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <img src="/images/logo.png" alt="크보피드" className="auth-logo" />
            <h1>프로필을 완성하세요</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '8px' }}>
              환영합니다{session?.user?.name ? `, ${session.user.name}님` : ''}! 마지막 단계입니다.
            </p>
          </div>

          <div className="auth-box">
            <form className="auth-form" action={handleSubmit}>
              {error && <div style={{ color: '#f4212e', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

              <div className="form-group">
                <input name="displayName" type="text" className="auth-input" placeholder="닉네임" required defaultValue={session?.user?.name || ''} />
              </div>
              <div className="form-group">
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '17px' }}>@</span>
                  <input name="username" type="text" className="auth-input" style={{ paddingLeft: '36px' }} placeholder="핸들 (아이디)" required />
                </div>
              </div>

              <div className="form-group">
                <p style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>나의 응원팀 선택</p>
                <div className="team-carousel-container">
                  <button type="button" className="carousel-nav" onClick={() => scrollCarousel(-1)}>
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <div className="team-carousel" ref={carouselRef}>
                    {KBO_TEAMS.map((team) => (
                      <label key={team.id} className="team-option">
                        <input type="radio" name="team" value={team.id} required />
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

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? '저장 중...' : '시작하기'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
