'use client';

import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="auth-page">
        <div className="auth-container">
            <div className="auth-header">
                <img src="/images/logo.png" alt="크보피드" className="auth-logo" />
                <h1>지금 크보피드에<br />로그인하세요</h1>
            </div>

            <div className="auth-box">
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

                <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                        <input type="email" className="auth-input" placeholder="이메일 주소" required />
                    </div>
                    <div className="form-group">
                        <input type="password" className="auth-input" placeholder="비밀번호" required />
                    </div>
                    <button type="submit" className="auth-submit-btn" onClick={() => alert('이메일 로그인은 준비 중입니다. 구글 로그인을 이용해주세요.')}>로그인</button>
                </form>

                <div className="auth-footer">
                    <p>계정이 없으신가요? <Link href="/signup">가입하기</Link></p>
                </div>
            </div>
        </div>
    </div>
  );
}
