'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db/db';
import { profiles, posts, likes, retweets, follows } from '@/db/schema';
import { eq, and, desc, count } from 'drizzle-orm';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function getProfile(username: string) {
  const { env } = getRequestContext();
  const db = getDb(env.DB);

  // 1. 유저 기본 정보 조회
  const profile = await db.select().from(profiles).where(eq(profiles.username, username)).get();
  if (!profile) return null;

  // 2. 팔로잉/팔로워 수 조회
  const followersResult = await db.select({ value: count() }).from(follows).where(eq(follows.followingId, profile.id)).get();
  const followingResult = await db.select({ value: count() }).from(follows).where(eq(follows.followerId, profile.id)).get();
  const session = await auth();
  let isFollowing = false;
  if (session?.user?.id) {
    const existingFollow = await db.select().from(follows).where(and(eq(follows.followerId, session.user.id), eq(follows.followingId, profile.id))).get();
    if (existingFollow) isFollowing = true;
  }

  return {
    ...profile,
    followersCount: followersResult?.value || 0,
    followingCount: followingResult?.value || 0,
    isFollowing,
  };
}

export async function getUserPosts(userId: string) {
  const session = await auth();
  const { env } = getRequestContext();
  const db = getDb(env.DB);

  const rows = await db.query.posts.findMany({
    where: eq(posts.userId, userId),
    with: {
      profiles: true,
      originalPost: { with: { profiles: true } },
    },
    orderBy: [desc(posts.createdAt)],
    limit: 50,
  });

  if (session?.user?.id && rows.length) {
    const userLikes = await db.select().from(likes).where(eq(likes.userId, session.user.id));
    const userRetweets = await db.select().from(retweets).where(eq(retweets.userId, session.user.id));
    const likeSet = new Set(userLikes.map((l) => l.postId));
    const rtSet = new Set(userRetweets.map((r) => r.postId));
    return rows.map((post) => ({
      ...post,
      isLiked: likeSet.has(post.id),
      isRetweeted: rtSet.has(post.id),
    }));
  }

  return rows.map((post) => ({ ...post, isLiked: false, isRetweeted: false }));
}

export async function updateProfile(data: { displayName?: string; bio?: string; favoriteTeam?: string; avatarUrl?: string; coverUrl?: string }) {
  const session = await auth();
  const username = (session?.user as any)?.username;
  if (!username) {
    throw new Error('Not authenticated');
  }

  const { env } = getRequestContext();
  const db = getDb(env.DB);

  await db.update(profiles)
    .set({
      displayName: data.displayName !== undefined ? data.displayName : undefined,
      bio: data.bio !== undefined ? data.bio : undefined,
      favoriteTeam: data.favoriteTeam !== undefined ? data.favoriteTeam : undefined,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
      coverUrl: data.coverUrl !== undefined ? data.coverUrl : undefined,
    })
    .where(eq(profiles.username, username as string));

  return true;
}

export async function toggleFollow(targetUserId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not authenticated');

  const { env } = getRequestContext();
  const db = getDb(env.DB);
  const myId = session.user.id;

  if (myId === targetUserId) throw new Error('Cannot follow yourself');

  const existing = await db.select().from(follows)
    .where(and(eq(follows.followerId, myId), eq(follows.followingId, targetUserId)))
    .get();

  if (existing) {
    await db.delete(follows).where(eq(follows.id, existing.id));
  } else {
    await db.insert(follows).values({
      followerId: myId,
      followingId: targetUserId,
    });
  }

  revalidatePath('/');
}
