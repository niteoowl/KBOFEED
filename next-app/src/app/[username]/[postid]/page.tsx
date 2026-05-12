import { getRequestContext } from '@cloudflare/next-on-pages';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import PostCard from '@/components/feed/PostCard';
import Link from 'next/link';
import { normalizeHandleSegment, postPermalink } from '@/lib/post-url';

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

    return {
      title: `${post.content?.substring(0, 20)}... - ${decodedUsername}님의 게시글`,
      description: post.content?.substring(0, 150),
      openGraph: {
        title: `${decodedUsername}님의 야구 소식`,
        description: post.content?.substring(0, 150),
        images: [post.imageUrl || '/images/logo.png'],
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

  const authorHandle =
    post.profiles?.username ?? post.username ?? '';
  if (
    authorHandle &&
    authorHandle.toLowerCase() !== handleFromUrl.toLowerCase()
  ) {
    permanentRedirect(postPermalink(authorHandle, postIdNum));
  }

  return (
    <div className="flex flex-col">
      <header className="feed-header px-4 py-3 border-b border-zinc-100 sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center gap-4">
        <Link href="/"><i className="fas fa-arrow-left" /></Link>
        <h2 className="text-xl font-extrabold">게시물</h2>
      </header>
      
      <div className="feed-content">
        <PostCard post={post} suppressNavigation />
      </div>

      <div className="p-4 border-t border-zinc-100 mt-4">
        <h3 className="font-bold mb-4">답글</h3>
        <div className="text-zinc-500 text-center py-10">
          아직 답글이 없습니다.
        </div>
      </div>
    </div>
  );
}
