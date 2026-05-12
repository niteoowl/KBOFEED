import { getRequestContext } from '@cloudflare/next-on-pages';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import PostCard from '@/components/feed/PostCard';
import Link from 'next/link';
import { normalizeHandleSegment, postPermalink } from '@/lib/post-url';
import { normalizePostForCard } from '@/lib/normalize-post';

export const runtime = 'edge';

type Props = {
  params: Promise<{ username: string; postid: string }>;
};

// 1. 동적 메타태그 생성 (SEO용 SSR)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { env } = getRequestContext();
  const { username, postid } = await params;
  const decodedUsername = normalizeHandleSegment(username);

  try {
    // 에지 캐시(KV) 먼저 확인
    let post: any = await env.KV.get(`post:${postid}`, 'json');

    if (!post) {
      // 캐시 미스 시 D1 DB에서 조회
      const stmt = env.DB.prepare(`
        SELECT p.*, pr.username, pr.display_name as displayName, pr.avatar_url as avatarUrl, pr.is_verified as isVerified
        FROM posts p
        JOIN profiles pr ON p.user_id = pr.id
        WHERE p.id = ?
      `).bind(postid);
      post = await stmt.first();

      if (post) {
        // DB 결과를 PostCard가 기대하는 구조로 변환
        const formattedPost = {
          ...post,
          profiles: {
            username: post.username,
            displayName: post.displayName,
            avatarUrl: post.avatarUrl,
            isVerified: post.isVerified,
          }
        };
        await env.KV.put(`post:${postid}`, JSON.stringify(formattedPost), { expirationTtl: 60 });
        post = formattedPost;
      }
    }

    if (!post) return { title: 'Post Not Found - KBO Feed' };

    const meta = normalizePostForCard(post as Record<string, unknown>);
    if (!meta) return { title: 'Post Not Found - KBO Feed' };

    const img = meta.imageUrl || '/images/logo.png';

    return {
      title: `${String(meta.content ?? '').substring(0, 20)}... - ${decodedUsername}님의 게시글`,
      description: String(meta.content ?? '').substring(0, 150),
      openGraph: {
        title: `${decodedUsername}님의 야구 소식`,
        description: String(meta.content ?? '').substring(0, 150),
        images: [img],
      },
    };
  } catch (e) {
    return { title: 'KBO Feed' };
  }
}

export default async function PostPage({ params }: Props) {
  const { env } = getRequestContext();
  const { username, postid } = await params;
  const handleFromUrl = normalizeHandleSegment(username);
  const postIdNum = parseInt(String(postid), 10);
  if (Number.isNaN(postIdNum)) notFound();

  let post: any = await env.KV.get(`post:${postid}`, 'json');
  
  if (!post) {
    const stmt = env.DB.prepare(`
      SELECT p.*, pr.username, pr.display_name as displayName, pr.avatar_url as avatarUrl, pr.is_verified as isVerified
      FROM posts p
      JOIN profiles pr ON p.user_id = pr.id
      WHERE p.id = ?
    `).bind(postid);
    const result: any = await stmt.first();
    if (result) {
      post = {
        ...result,
        profiles: {
          username: result.username,
          displayName: result.displayName,
          avatarUrl: result.avatarUrl,
          isVerified: result.isVerified,
        }
      };
    }
  }

  if (!post) notFound();

  const cardPost = normalizePostForCard(post);
  if (!cardPost) notFound();

  const authorHandle =
    cardPost.profiles?.username ?? '';
  if (
    authorHandle &&
    authorHandle.toLowerCase() !== handleFromUrl.toLowerCase()
  ) {
    permanentRedirect(postPermalink(authorHandle, postIdNum));
  }

  return (
    <>
      <div className="feed-header-group">
        <div className="feed-header">
          <div className="header-left">
            <Link href="/" className="header-back-btn" aria-label="뒤로">
              <i className="fas fa-arrow-left" />
            </Link>
          </div>
          <div className="mobile-logo-container">
            <Link href="/">
              <img src="/images/logo.png" alt="" className="mobile-logo" />
            </Link>
          </div>
          <h2 className="desktop-title" style={{ flex: 2, textAlign: 'center' }}>
            게시물
          </h2>
          <div className="header-right" />
        </div>
      </div>

      <div className="post-detail-container">
        <PostCard post={cardPost} suppressNavigation />
      </div>

      <div className="replies-list" style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)' }}>
        <h3 style={{ fontWeight: 800, marginBottom: 16, fontSize: 18 }}>답글</h3>
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
          아직 답글이 없습니다.
        </div>
      </div>
    </>
  );
}
