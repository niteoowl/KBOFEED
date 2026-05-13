'use client';

import { SessionProvider, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  // 온보딩 완료 직후 리다이렉트 루프 방지
  const skipRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const needsOnboarding = (session?.user as any)?.needsOnboarding;
    const isOnboardingPage = pathname === '/onboarding';
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    const isApiRoute = pathname.startsWith('/api');

    // 온보딩 페이지에서 나가는 경우 = 온보딩 완료 → skip 활성화
    if (isOnboardingPage) {
      skipRef.current = false; // 온보딩 페이지에서는 리셋
      return;
    }

    // 온보딩 완료 후 세션이 아직 갱신 전일 수 있으므로, skip이 활성화되면 무시
    if (skipRef.current) return;

    if (needsOnboarding && !isOnboardingPage && !isAuthPage && !isApiRoute) {
      router.replace('/onboarding');
    }
  }, [session, status, pathname, router]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <OnboardingGuard>
        {children}
      </OnboardingGuard>
    </SessionProvider>
  );
}
