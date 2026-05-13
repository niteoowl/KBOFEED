import { getPostDetail } from '@/app/actions/post';
import PostCard from '@/components/feed/PostCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const runtime = 'edge';

interface PostDetailPageProps {
  params: Promise<{
    username: string;
    postId: string;
  }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { postId } = await params;
  
  const post = await getPostDetail(parseInt(postId));
  if (!post) {
    notFound();
  }

  // Handle username mismatch if needed, but for now we follow the social media convention
  // where the ID is the primary source of truth.

  return (
    <main className="main-feed">
      <header className="feed-header">
        <div className="header-left">
          <Link href="/" className="header-back-btn">
            <i className="fas fa-arrow-left"></i>
          </Link>
        </div>
        <h2 className="profile-header-title" style={{ flex: 1, textAlign: 'center' }}>
          게시물
        </h2>
        <div className="header-right"></div>
      </header>

      <section className="post-detail-container">
        <PostCard post={post} suppressNavigation={true} />
        
        {/* Reply section placeholder */}
        <div className="replies-list" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            아직 답글이 없습니다.
          </div>
        </div>
      </section>
    </main>
  );
}
