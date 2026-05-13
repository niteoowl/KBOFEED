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
