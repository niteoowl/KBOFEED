'use client';

import { usePathname } from 'next/navigation';
import GlobalHeader from './GlobalHeader';

export default function AppHeaderWrapper() {
  const pathname = usePathname();
  
  if (pathname === '/' || pathname.includes('/explore') || pathname.includes('/login') || pathname.includes('/signup') || pathname.includes('/onboarding')) {
    return null;
  }
  
  let title = '홈';
  let showBackBtn = false;

  if (pathname.includes('/search')) {
    title = '검색';
  } else if (pathname.includes('/game')) {
    title = '경기';
  } else if (pathname.includes('/profile')) {
    title = '프로필';
  } else if (pathname.startsWith('/@') && pathname.split('/').length > 2) {
    title = '게시물';
    showBackBtn = true;
  } else if (pathname.startsWith('/@')) {
    title = '프로필';
    showBackBtn = true;
  }

  return <GlobalHeader title={title} showBackBtn={showBackBtn} />;
}
