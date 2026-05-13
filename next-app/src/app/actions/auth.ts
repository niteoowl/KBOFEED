'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db/db';
import { users, profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

// For simplicity in Edge runtime, we use a basic SHA-256 hash
async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'KBOFEED_SALT'); // Simple salt
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function signUp(formData: FormData) {
  const { env } = getRequestContext();
  const db = getDb(env.DB);

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const username = formData.get('username') as string;
  const displayName = formData.get('displayName') as string;
  const team = formData.get('team') as string;

  if (!email || !password || !username || !displayName) {
    return { error: '모든 필드를 입력해주세요.' };
  }

  // 1. 중복 확인
  const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
  if (existingUser) return { error: '이미 존재하는 이메일입니다.' };

  const existingProfile = await db.select().from(profiles).where(eq(profiles.username, username)).get();
  if (existingProfile) return { error: '이미 존재하는 핸들(@아이디)입니다.' };

  // 2. 유저 생성
  const userId = crypto.randomUUID();
  const hashedPassword = await hashPassword(password);

  await db.insert(users).values({
    id: userId,
    email,
    name: displayName,
    password: hashedPassword,
  });

  // 3. 프로필 생성
  await db.insert(profiles).values({
    id: userId,
    username: username.replace(/^@/, ''),
    displayName,
    favoriteTeam: team.toUpperCase(),
  });

  redirect('/login?message=signup_success');
}

/**
 * 소셜 로그인 후 온보딩: 핸들(@아이디)과 응원팀 설정
 */
export async function completeOnboarding(formData: FormData) {
  const { env } = getRequestContext();
  const db = getDb(env.DB);

  // auth() 를 직접 import하면 순환참조 위험이 있으므로, 
  // 클라이언트에서 세션 userId를 넘기지 않고, 서버에서 auth()로 가져옴
  const { auth } = await import('@/auth');
  const session = await auth();
  if (!session?.user?.id) {
    return { error: '로그인이 필요합니다.' };
  }

  const username = (formData.get('username') as string)?.replace(/^@/, '').trim();
  const displayName = (formData.get('displayName') as string)?.trim();
  const team = formData.get('team') as string;

  if (!username || !displayName) {
    return { error: '닉네임과 핸들을 모두 입력해주세요.' };
  }

  if (!/^[a-zA-Z0-9_]{2,20}$/.test(username)) {
    return { error: '핸들은 영문, 숫자, _만 사용 가능합니다. (2~20자)' };
  }

  // 중복 확인
  const existingProfile = await db.select().from(profiles)
    .where(eq(profiles.username, username))
    .get();

  if (existingProfile && existingProfile.id !== session.user.id) {
    return { error: '이미 존재하는 핸들(@아이디)입니다.' };
  }

  // 프로필 업데이트
  await db.update(profiles)
    .set({
      username,
      displayName,
      favoriteTeam: team || null,
    })
    .where(eq(profiles.id, session.user.id));

  // users 테이블의 name도 업데이트
  await db.update(users)
    .set({ name: displayName })
    .where(eq(users.id, session.user.id));

  return { success: true };
}

/**
 * 프로필이 온보딩 완료 상태인지 확인 (자동생성된 user_xxx 핸들인지)
 */
export async function checkNeedsOnboarding(userId: string): Promise<boolean> {
  const { env } = getRequestContext();
  const db = getDb(env.DB);

  const profile = await db.select().from(profiles)
    .where(eq(profiles.id, userId))
    .get();

  if (!profile) return true;
  // 자동생성된 핸들 패턴: user_xxxxxxxx
  return /^user_[a-f0-9]{8}$/.test(profile.username);
}
