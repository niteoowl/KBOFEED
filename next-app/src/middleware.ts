import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** 단일 세그먼트 라우트 (예: /login)와 충돌하지 않도록 보류 */
const RESERVED_FIRST_SEGMENTS = new Set([
  'login',
  'explore',
  'search',
  'game',
  'profile',
  'api',
  '_next',
]);

/**
 * 레거시 /username/123 → /@username/123 (표준 canonical)
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length !== 2) return NextResponse.next();

  const [first, second] = segments;
  if (first.startsWith('@')) return NextResponse.next();
  if (!/^\d+$/.test(second)) return NextResponse.next();
  if (RESERVED_FIRST_SEGMENTS.has(first.toLowerCase())) return NextResponse.next();

  url.pathname = `/@${encodeURIComponent(first)}/${second}`;
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
