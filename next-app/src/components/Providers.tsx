'use client';

import { SessionProvider, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const needsOnboarding = (session?.user as any)?.needsOnboarding;
    const isOnboardingPage = pathname === '/onboarding';
    const isAuthPage = pathname === '/login' || pathname === '/signup';
    const isApiRoute = pathname.startsWith('/api');

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
