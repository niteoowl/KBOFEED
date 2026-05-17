'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db/db';
import { posts, profiles, likes, retweets, comments, notifications, bookmarks, ads } from '@/db/schema';
import { extractMentions } from '@/lib/content';
import { desc, eq, and, sql, like, or, count } from 'drizzle-orm';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { generateShortId } from '@/lib/short-id';

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
    const rawPosts = await db.query.posts.findMany({
      with: {
        profiles: true,
        originalPost: { with: { profiles: true } },
      },
      orderBy: [desc(posts.createdAt)],
      limit: 20,
    });

    // 활성화된 광고 가져오기
    const activeAds = await db.select().from(ads).where(eq(ads.isActive, true)).execute().catch(() => []);
    
    if (activeAds && activeAds.length > 0) {
      const mixedPosts: any[] = [];
      let adIndex = 0;
      
      rawPosts.forEach((post, index) => {
        mixedPosts.push(post);
        if ((index + 1) % 5 === 0 && adIndex < activeAds.length) {
          const ad = activeAds[adIndex];
          mixedPosts.push({
            id: `ad_${ad.id}`,
            isAd: true,
            content: ad.content,
            imageUrl: ad.imageUrl,
            linkUrl: ad.linkUrl,
            createdAt: ad.createdAt || new Date().toISOString(),
            likesCount: 0,
            retweetsCount: 0,
            commentsCount: 0,
            viewsCount: 0,
            profiles: {
              id: 'ad_system',
              username: 'sponsor',
              displayName: '스폰서 광고',
              avatarUrl: 'https://cdn-icons-png.flaticon.com/512/5482/5482912.png',
              isVerified: true
            }
          });
          adIndex = (adIndex + 1) % activeAds.length;
        }
      });
      allPosts = mixedPosts;
    } else {
      allPosts = rawPosts;
    }

    // 3. KV에 저장 (60초 만료)
    await env.KV.put(cacheKey, JSON.stringify(allPosts), { expirationTtl: 60 });
  }

  // 4. 유저별 개인화 상태(좋아요 등)는 캐시와 별개로 처리하여 실시간성 유지
  if (session?.user?.id && allPosts) {
    const userLikes = await db.select().from(likes).where(eq(likes.userId, session.user.id));
    const userRetweets = await db.select().from(retweets).where(eq(retweets.userId, session.user.id));
    const userBookmarks = await db.select().from(bookmarks).where(eq(bookmarks.userId, session.user.id));
    
    const likeSet = new Set(userLikes.map(l => l.postId));
    const rtSet = new Set(userRetweets.map(r => r.postId));
    const bookmarkSet = new Set(userBookmarks.map((b) => b.postId));

    return allPosts.map(post => ({
      ...post,
      isLiked: likeSet.has(post.id),
      isRetweeted: rtSet.has(post.id),
      isBookmarked: bookmarkSet.has(post.id),
    }));
  }

  return (allPosts || []).map(post => ({ ...post, isLiked: false, isRetweeted: false, isBookmarked: false }));
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
      originalPost: { with: { profiles: true } },
    },
    orderBy: [desc(posts.createdAt)],
    limit: 50,
  });

  if (session?.user?.id && rows.length) {
    const userLikes = await db.select().from(likes).where(eq(likes.userId, session.user.id));
    const userRetweets = await db.select().from(retweets).where(eq(retweets.userId, session.user.id));
    const userBookmarks = await db.select().from(bookmarks).where(eq(bookmarks.userId, session.user.id));
    const likeSet = new Set(userLikes.map((l) => l.postId));
    const rtSet = new Set(userRetweets.map((r) => r.postId));
    const bookmarkSet = new Set(userBookmarks.map((b) => b.postId));
    return rows.map((post) => ({
      ...post,
      isLiked: likeSet.has(post.id),
      isRetweeted: rtSet.has(post.id),
      isBookmarked: bookmarkSet.has(post.id),
    }));
  }

  return rows.map((post) => ({ ...post, isLiked: false, isRetweeted: false, isBookmarked: false }));
}

export async function createPost(content: string, imageUrl?: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const { env } = getRequestContext();
  const db = getDb(env.DB);

  const shortId = generateShortId();

  await db.insert(posts).values({
    id: shortId,
    userId: session.user.id,
    content,
    imageUrl,
  });

  await notifyMentions(db, content, session.user.id, shortId);

  await env.KV.delete('main_feed_posts');

  revalidatePath('/');
  return shortId;
}

async function notifyMentions(
  db: ReturnType<typeof getDb>,
  content: string,
  senderId: string,
  postId: string
) {
  const handles = extractMentions(content);
  for (const handle of handles) {
    const mentioned = await db.select().from(profiles).where(eq(profiles.username, handle)).get();
    if (mentioned && mentioned.id !== senderId) {
      await db.insert(notifications).values({
        receiverId: mentioned.id,
        senderId,
        type: 'mention',
        postId,
      }).catch(() => {});
    }
  }
}

export async function deletePost(postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const { env } = getRequestContext();
  const db = getDb(env.DB);
  
  const post = await db.select().from(posts).where(eq(posts.id, postId)).get();
  if (post && post.userId === session.user.id) {
    await db.delete(posts).where(eq(posts.id, postId));
    await env.KV.delete('main_feed_posts');
    revalidatePath('/');
  }
}

export async function updatePost(postId: string, newContent: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  const { env } = getRequestContext();
  const db = getDb(env.DB);
  
  const post = await db.select().from(posts).where(eq(posts.id, postId)).get();
  if (post && post.userId === session.user.id) {
    await db.update(posts).set({ content: newContent }).where(eq(posts.id, postId));
    await env.KV.delete('main_feed_posts');
    revalidatePath('/');
  }
}

export async function toggleLike(postId: string) {
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

export async function toggleRetweet(postId: string) {
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
    const rtShortId = generateShortId();
    await db.insert(posts).values({
      id: rtShortId,
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
      originalPost: { with: { profiles: true } },
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

export async function getPostDetail(postId: string) {
  const session = await auth();
  const { env } = getRequestContext();
  const db = getDb(env.DB);

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
    with: {
      profiles: true,
      originalPost: { with: { profiles: true } },
    },
  });

  if (!post) return null;

  let isLiked = false;
  let isRetweeted = false;

  let isBookmarked = false;
  if (session?.user?.id) {
    const likeCount = await db.select({ value: count() }).from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, session.user.id)))
      .get();
    const rtCount = await db.select({ value: count() }).from(retweets)
      .where(and(eq(retweets.postId, postId), eq(retweets.userId, session.user.id)))
      .get();
    const bm = await db.select().from(bookmarks)
      .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, session.user.id)))
      .get();
    
    isLiked = (likeCount?.value || 0) > 0;
    isRetweeted = (rtCount?.value || 0) > 0;
    isBookmarked = !!bm;
  }

  // view count increment logic here (soft increment to bypass heavy writes, but for now just basic update)
  await db.update(posts).set({ viewsCount: sql`views_count + 1` }).where(eq(posts.id, postId)).run();

  return { ...post, isLiked, isRetweeted, isBookmarked, viewsCount: (post.viewsCount || 0) + 1 };
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

// ========================
// 댓글 (Comments) 기능
// ========================

/** 특정 게시물의 댓글 목록 조회 */
export async function getComments(postId: string) {
  const { env } = getRequestContext();
  const db = getDb(env.DB);

  return await db.query.comments.findMany({
    where: eq(comments.postId, postId),
    with: {
      profiles: true,
    },
    orderBy: [desc(comments.createdAt)],
    limit: 100,
  });
}

/** 특정 댓글 1개 조회 (ID 기반) */
export async function getCommentDetail(commentId: string) {
  const { env } = getRequestContext();
  const db = getDb(env.DB);

  return await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
  });
}

/** 댓글 작성 */
export async function createComment(postId: string, content: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    if (!content.trim()) throw new Error('Content is empty');

    const { env } = getRequestContext();
    const db = getDb(env.DB);
    
    const shortId = generateShortId();

    await db.insert(comments).values({
      id: shortId,
      postId,
      userId: session.user.id,
      content: content.trim(),
    });

    // 안전하게 카운트 증가
    await db.update(posts).set({ commentsCount: sql`comments_count + 1` }).where(eq(posts.id, postId)).execute().catch(() => {});

    // 알림 생성
    try {
      const post = await db.select().from(posts).where(eq(posts.id, postId)).get();
      if (post && post.userId !== session.user.id) {
        await db.insert(notifications).values({
          receiverId: post.userId,
          senderId: session.user.id,
          type: 'comment',
          postId,
        });
      }
      await notifyMentions(db, content.trim(), session.user.id, postId);
    } catch (notifErr) {
      console.error('Notification creation failed', notifErr);
    }

    try {
      if (env.KV) await env.KV.delete('main_feed_posts');
      revalidatePath('/');
    } catch (e) {}

    return { success: true };
  } catch (err: any) {
    console.error('createComment error:', err);
    throw new Error('Comment insertion failed');
  }
}

// ========================
// 프로필 탭: 좋아요한 게시물
// ========================

/** 특정 유저가 좋아요한 게시물 목록 */
export async function getUserLikedPosts(userId: string) {
  const session = await auth();
  const { env } = getRequestContext();
  const db = getDb(env.DB);

  // likes 테이블에서 해당 유저의 좋아요를 찾고, 연결된 post 조회
  const userLikeRows = await db.select().from(likes)
    .where(eq(likes.userId, userId))
    .orderBy(desc(likes.createdAt))
    .limit(50);

  if (userLikeRows.length === 0) return [];

  const postIds = userLikeRows.map(l => l.postId);
  
  // 각 postId에 대해 post+profile 조회
  const likedPosts = [];
  for (const pid of postIds) {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, pid),
      with: { 
        profiles: true,
        originalPost: { with: { profiles: true } }
      },
    });
    if (post) likedPosts.push(post);
  }

  // 현재 로그인 사용자의 좋아요/리트윗 상태
  if (session?.user?.id && likedPosts.length) {
    const myLikes = await db.select().from(likes).where(eq(likes.userId, session.user.id));
    const myRetweets = await db.select().from(retweets).where(eq(retweets.userId, session.user.id));
    const likeSet = new Set(myLikes.map(l => l.postId));
    const rtSet = new Set(myRetweets.map(r => r.postId));
    return likedPosts.map(post => ({
      ...post,
      isLiked: likeSet.has(post.id),
      isRetweeted: rtSet.has(post.id),
    }));
  }

  return likedPosts.map(post => ({ ...post, isLiked: false, isRetweeted: false }));
}

/** 특정 유저가 작성한 댓글(답글) 목록 + 연결된 원본 게시물 */
export async function getUserComments(userId: string) {
  const { env } = getRequestContext();
  const db = getDb(env.DB);

  const userComments = await db.query.comments.findMany({
    where: eq(comments.userId, userId),
    with: {
      profiles: true,
      post: {
        with: {
          profiles: true,
        },
      },
    },
    orderBy: [desc(comments.createdAt)],
    limit: 50,
  });

  return userComments;
}

export async function toggleBookmark(postId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not authenticated');

  const { env } = getRequestContext();
  const db = getDb(env.DB);

  const existing = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.postId, postId), eq(bookmarks.userId, session.user.id)))
    .get();

  if (existing) {
    await db.delete(bookmarks).where(eq(bookmarks.id, existing.id));
  } else {
    await db.insert(bookmarks).values({ postId, userId: session.user.id });
  }

  revalidatePath('/');
}

export async function getUserSavedPosts(userId: string) {
  const session = await auth();
  const { env } = getRequestContext();
  const db = getDb(env.DB);

  const rows = await db.select().from(bookmarks).where(eq(bookmarks.userId, userId)).orderBy(desc(bookmarks.createdAt)).limit(50);
  if (!rows.length) return [];

  const saved: Awaited<ReturnType<typeof getPosts>> = [];
  for (const b of rows) {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, b.postId),
      with: { profiles: true, originalPost: { with: { profiles: true } } },
    });
    if (post) saved.push(post as any);
  }

  if (session?.user?.id) {
    const userLikes = await db.select().from(likes).where(eq(likes.userId, session.user.id));
    const likeSet = new Set(userLikes.map((l) => l.postId));
    return saved.map((p) => ({ ...p, isLiked: likeSet.has(p.id), isBookmarked: true }));
  }
  return saved.map((p) => ({ ...p, isLiked: false, isBookmarked: true }));
}

export async function getNotifications() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const { env } = getRequestContext();
  const db = getDb(env.DB);

  return db.query.notifications.findMany({
    where: eq(notifications.receiverId, session.user.id),
    with: {
      sender: true,
      post: { with: { profiles: true } },
    },
    orderBy: [desc(notifications.createdAt)],
    limit: 50,
  });
}

export async function markNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) return;
  const { env } = getRequestContext();
  const db = getDb(env.DB);
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.receiverId, session.user.id));
}

export async function voteInPoll(postId: string, optionIndex: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('로그인이 필요합니다.');

  const { env } = getRequestContext();
  const db = getDb(env.DB);

  // 1. 게시글 가져오기
  const post = await db.select().from(posts).where(eq(posts.id, postId)).get();
  if (!post) throw new Error('게시글을 찾을 수 없습니다.');

  // 2. Poll 파싱
  const { parsePoll } = await import('@/lib/content');
  const { text, poll } = parsePoll(post.content || '');
  if (!poll) throw new Error('투표가 없는 게시글입니다.');

  // 3. 투표 종료 여부 확인
  const expired = poll.endsAt ? new Date(poll.endsAt) < new Date() : false;
  if (expired) throw new Error('종료된 투표입니다.');

  // 4. 중복 투표 방지
  const votedUsers = poll.votedUsers || {};
  if (votedUsers[session.user.id] !== undefined) {
    throw new Error('이미 투표에 참여하셨습니다.');
  }

  // 5. 표 수 및 유저 투표 정보 업데이트
  const votes = poll.votes || {};
  const optionKey = String(optionIndex);
  votes[optionKey] = (votes[optionKey] || 0) + 1;
  votedUsers[session.user.id] = optionIndex;

  // 6. 직렬화하여 게시글 본문 업데이트
  const updatedPollData = {
    ...poll,
    votes,
    votedUsers
  };
  const updatedContent = `${text}\n\n[POLL]${JSON.stringify(updatedPollData)}[/POLL]`;

  await db.update(posts).set({ content: updatedContent }).where(eq(posts.id, postId));

  if (env.KV) await env.KV.delete('main_feed_posts');
  revalidatePath('/');
}
