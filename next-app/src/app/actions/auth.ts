'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db/db';
import { users, profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

const PBKDF2_ITERATIONS = 100_000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derivePbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    key,
    256
  );
  return new Uint8Array(bits);
}

/** PBKDF2-SHA256 (Cloudflare Workers–safe; no WASM) */
async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const hash = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

/** Verify password against stored hash (PBKDF2, legacy SHA-256; Argon2 requires password reset on Edge) */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = base64ToBytes(parts[2]);
    const expected = base64ToBytes(parts[3]);
    const derived = await derivePbkdf2(password, salt, iterations);
    if (derived.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < derived.length; i++) diff |= derived[i] ^ expected[i];
    return diff === 0;
  }

  if (storedHash.startsWith('$argon2id$')) {
    // Argon2 used hash-wasm which is blocked on Cloudflare Workers; user must reset password
    return false;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'KBOFEED_SALT');
  const digest = await crypto.subtle.digest('SHA-256', data);
  const legacyHash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return legacyHash === storedHash;
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

  const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
  if (existingUser) return { error: '이미 존재하는 이메일입니다.' };

  const existingProfile = await db.select().from(profiles).where(eq(profiles.username, username)).get();
  if (existingProfile) return { error: '이미 존재하는 핸들(@아이디)입니다.' };

  const userId = crypto.randomUUID();
  const hashedPassword = await hashPassword(password);

  await db.insert(users).values({
    id: userId,
    email,
    name: displayName,
    password: hashedPassword,
  });

  await db.insert(profiles).values({
    id: userId,
    username: username.replace(/^@/, ''),
    displayName,
    favoriteTeam: team.toUpperCase(),
  });

  redirect('/login?message=signup_success');
}

export async function completeOnboarding(formData: FormData) {
  const { env } = getRequestContext();
  const db = getDb(env.DB);

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

  const existingProfile = await db.select().from(profiles)
    .where(eq(profiles.username, username))
    .get();

  if (existingProfile && existingProfile.id !== session.user.id) {
    return { error: '이미 존재하는 핸들(@아이디)입니다.' };
  }

  await db.update(profiles)
    .set({
      username,
      displayName,
      favoriteTeam: team || null,
    })
    .where(eq(profiles.id, session.user.id));

  await db.update(users)
    .set({ name: displayName })
    .where(eq(users.id, session.user.id));

  return { success: true };
}

export async function checkNeedsOnboarding(userId: string): Promise<boolean> {
  const { env } = getRequestContext();
  const db = getDb(env.DB);

  const profile = await db.select().from(profiles)
    .where(eq(profiles.id, userId))
    .get();

  if (!profile) return true;
  return /^user_[a-f0-9]{8}$/.test(profile.username);
}
