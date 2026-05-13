'use client';

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get('message') === 'signup_success') {
      setSuccess('회원가입이 완료되었습니다. 로그인해주세요.');
    }
  }, [searchParams]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("이메일 또는 비밀번호가 일치하지 않습니다.");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="auth-page">
        <div className="auth-container">
            <div className="auth-header">
                <img src="/images/logo.png" alt="크보피드" className="auth-logo" />
                <h1>지금 크보피드에<br />로그인하세요</h1>
            </div>

            <div className="auth-box">
                {error && <div style={{ color: '#f4212e', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
                {success && <div style={{ color: '#00ba7c', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{success}</div>}

                <div className="social-auth">
                    <button 
                      className="social-btn google" 
                      onClick={() => signIn("google", { callbackUrl: "/" })}
                    >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" />
                        Google 계정으로 로그인
                    </button>
                    <button className="social-btn kakao" onClick={() => alert('카카오 로그인은 준비 중입니다.')}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg" alt="Kakao" />
                        카카오톡으로 로그인
                    </button>
                </div>

                <div className="auth-divider">
                    <span>또는</span>
                </div>

                <form className="auth-form" onSubmit={handleEmailLogin}>
                    <div className="form-group">
                        <input 
                          type="email" 
                          className="auth-input" 
                          placeholder="이메일 주소" 
                          required 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <input 
                          type="password" 
                          className="auth-input" 
                          placeholder="비밀번호" 
                          required 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                      {loading ? '로그인 중...' : '로그인'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>계정이 없으신가요? <Link href="/signup">가입하기</Link></p>
                </div>
            </div>
        </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <style>{`
        .sidebar, .right-sidebar, .mobile-nav { display: none !important; }
        .main-feed { max-width: 100% !important; border: none !important; }
        .app-container { display: block !important; }
      `}</style>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginContent />
      </Suspense>
    </>
  );
}
