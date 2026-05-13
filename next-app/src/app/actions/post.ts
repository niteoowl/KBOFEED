'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db/db';
import { posts, profiles, likes, retweets, notifications } from '@/db/schema';
import { desc, eq, and, sql, like, or } from 'drizzle-orm';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function getPosts() {
  const session = await auth();
  const { env } = getRequestContext();
  const db = getDb(env.DB);
  
  // 1. KV에서 캐시된 기본 게시글 목록 확인
  const cacheKey = 'main_feed_posts';
  let allPosts: any[] | null = null;
  
  const cachedData = await env.KV.get(cacheKey);
  if (cachedData) {
    allPosts = JSON.parse(cachedData);
  } else {
    // 2. 캐시 없으면 D1에서 조회
    allPosts = await db.query.posts.findMany({
      with: {
        profiles: true,
      },
      orderBy: [desc(posts.createdAt)],
      limit: 20,
    });
    // 3. KV에 저장 (60초 만료)
    await env.KV.put(cacheKey, JSON.stringify(allPosts), { expirationTtl: 60 });
  }

  // 4. 유저별 개인화 상태(좋아요 등)는 캐시와 별개로 처리하여 실시간성 유지
  if (session?.user?.id && allPosts) {
    const userLikes = await db.select().from(likes).where(eq(likes.userId, session.user.id));
    const userRetweets = await db.select().from(retweets).where(eq(retweets.userId, session.user.id));
    
    const likeSet = new Set(userLikes.map(l => l.postId));
    const rtSet = new Set(userRetweets.map(r => r.postId));

    return allPosts.map(post => ({
      ...post,
      isLiked: likeSet.has(post.id),
      isRetweeted: rtSet.has(post.id),
    }));
  }

  return (allPosts || []).map(post => ({ ...post, isLiked: false, isRetweeted: false }));
}

/** 내팀 탭: 모아보기(본문에 팀 키워드) / 피드(team_tag 일치) */
export async function getTeamPosts(
  teamTag: string,
  mode: 'collection' | 'feed'
) {
  const session = await auth();
  const { env } = getRequestContext();
  const db = getDb(env.DB);

  const safeTag = teamTag.replace(/%/g, '').slice(0, 32);
  const whereClause =
    mode === 'feed'
      ? eq(posts.teamTag, safeTag)
      : like(posts.content, `%${safeTag}%`);

  const rows = await db.query.posts.findMany({
    where: whereClause,
    with: {
      profiles: true,
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

export async function createPost(content: string, imageUrl?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const { env } = getRequestContext();
  const db = getDb(env.DB);

  await db.insert(posts).values({
    userId: session.user.id,
    content,
    imageUrl,
  });

  // KV 캐시 무효화: 다음 getPosts 호출 시 신규 데이터를 D1에서 읽도록 함
  await env.KV.delete('main_feed_posts');

  revalidatePath('/');
}

export async function toggleLike(postId: number) {
  const session = await auth();
  if (!session?.user?.id) return;

  const { env } = getRequestContext();
  const db = getDb(env.DB);

  const existing = await db.select().from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.userId, session.user.id)))
    .get();

  if (existing) {
    await db.delete(likes).where(eq(likes.id, existing.id));
    await db.update(posts).set({ likesCount: sql`MAX(0, likes_count - 1)` }).where(eq(posts.id, postId));
  } else {
    await db.insert(likes).values({ postId, userId: session.user.id });
    await db.update(posts).set({ likesCount: sql`likes_count + 1` }).where(eq(posts.id, postId));
    
    // 알림 생성
    const post = await db.select().from(posts).where(eq(posts.id, postId)).get();
    if (post && post.userId !== session.user.id) {
      await db.insert(notifications).values({
        receiverId: post.userId,
        senderId: session.user.id,
        type: 'like',
        postId: postId,
      });
    }
  }

  // 캐시 무효화
  await env.KV.delete('main_feed_posts');

  revalidatePath('/');
}

export async function toggleRetweet(postId: number) {
  const session = await auth();
  if (!session?.user?.id) return;

  const { env } = getRequestContext();
  const db = getDb(env.DB);

  const existing = await db.select().from(retweets)
    .where(and(eq(retweets.postId, postId), eq(retweets.userId, session.user.id)))
    .get();

  if (existing) {
    await db.delete(retweets).where(eq(retweets.id, existing.id));
    await db.update(posts).set({ retweetsCount: sql`MAX(0, retweets_count - 1)` }).where(eq(posts.id, postId));
    // 리트윗 게시글 자체도 삭제 (원본 게시글과 연결된 리트윗 포스트)
    await db.delete(posts).where(and(eq(posts.userId, session.user.id), eq(posts.retweetId, postId)));
  } else {
    await db.insert(retweets).values({ postId, userId: session.user.id });
    await db.update(posts).set({ retweetsCount: sql`retweets_count + 1` }).where(eq(posts.id, postId));
    // 리트윗 게시글 생성
    await db.insert(posts).values({
      userId: session.user.id,
      retweetId: postId,
      content: null,
    });

    // 알림 생성
    const post = await db.select().from(posts).where(eq(posts.id, postId)).get();
    if (post && post.userId !== session.user.id) {
      await db.insert(notifications).values({
        receiverId: post.userId,
        senderId: session.user.id,
        type: 'retweet',
        postId: postId,
      });
    }
  }

  // 캐시 무효화
  await env.KV.delete('main_feed_posts');

  revalidatePath('/');
}


export async function searchPosts(query: string) {
  const session = await auth();
  const { env } = getRequestContext();
  const db = getDb(env.DB);
  
  const results = await db.query.posts.findMany({
    where: like(posts.content, `%${query}%`),
    with: {
      profiles: true,
    },
    orderBy: [desc(posts.createdAt)],
    limit: 50,
  });

  if (session?.user?.id) {
    const userLikes = await db.select().from(likes).where(eq(likes.userId, session.user.id));
    const likeSet = new Set(userLikes.map(l => l.postId));
    return results.map(post => ({ ...post, isLiked: likeSet.has(post.id) }));
  }

  return results.map(post => ({ ...post, isLiked: false }));
}

export async function searchUsers(query: string) {
  const { env } = getRequestContext();
  const db = getDb(env.DB);
  
  return await db.select().from(profiles)
    .where(or(
      like(profiles.username, `%${query}%`),
      like(profiles.displayName, `%${query}%`)
    ))
    .limit(10);
}
