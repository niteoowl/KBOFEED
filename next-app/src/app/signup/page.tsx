'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { signUp } from '@/app/actions/auth';
import { KBO_TEAMS, getTeamLogo } from '@/lib/constants';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: number) => {
    if (carouselRef.current) {
      const scrollAmount = 150;
      carouselRef.current.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('password-confirm') as string;

    if (password !== confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    try {
      const result = await signUp(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
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
            <h1>계정을 생성하세요</h1>
          </div>

      <div className="auth-box">
        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div style={{ color: '#f4212e', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
          
          <div className="form-group">
            <input name="displayName" type="text" className="auth-input" placeholder="닉네임" required />
          </div>
          <div className="form-group">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '17px' }}>@</span>
              <input name="username" type="text" className="auth-input" style={{ paddingLeft: '36px' }} placeholder="핸들 (아이디)" required />
            </div>
          </div>
          <div className="form-group">
            <input name="email" type="email" className="auth-input" placeholder="이메일 주소" required />
          </div>
          <div className="form-group">
            <input name="password" type="password" className="auth-input" placeholder="비밀번호 (6자 이상)" required minLength={6} />
          </div>
          <div className="form-group">
            <input name="password-confirm" type="password" className="auth-input" placeholder="비밀번호 확인" required minLength={6} />
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

          <div className="auth-agreement">
            <label className="checkbox-container">
              <input type="checkbox" required />
              <span className="checkmark"></span>
              <span className="agreement-text">이용약관 동의 (필수)</span>
            </label>
            <label className="checkbox-container">
              <input type="checkbox" required />
              <span className="checkmark"></span>
              <span className="agreement-text">개인정보 처리방침 동의 (필수)</span>
            </label>
            <label className="checkbox-container">
              <input type="checkbox" required />
              <span className="checkmark"></span>
              <span className="agreement-text">만 14세 이상입니다 (필수)</span>
            </label>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <div className="auth-footer">
          <p>이미 계정이 있으신가요? <Link href="/login">로그인</Link></p>
        </div>
      </div>
        </div>
      </div>
    </>
  );
}
