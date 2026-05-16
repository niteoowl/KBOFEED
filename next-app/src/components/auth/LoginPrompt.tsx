'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function LoginPrompt() {
  const { data: session, status } = useSession();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === 'loading' || session) return;
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, [session, status]);

  if (!visible || session) return null;

  return (
    <div className="login-prompt-overlay" id="login-prompt">
      <div className="login-prompt-modal" role="dialog">
        <button
          type="button"
          className="login-prompt-close"
          onClick={() => setVisible(false)}
          aria-label="닫기"
        >
          <i className="fas fa-times" />
        </button>
        <div className="login-prompt-title">크보피드 로그인</div>
        <div className="login-prompt-desc">
          로그인하고 더 편하게
          <br />
          나만의 야구 소식을 받아보세요.
        </div>
        <Link href="/login" className="login-prompt-btn">
          로그인 하기
        </Link>
      </div>
    </div>
  );
}
