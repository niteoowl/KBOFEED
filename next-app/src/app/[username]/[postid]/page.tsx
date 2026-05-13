import { getPostDetail, getComments } from '@/app/actions/post';
import PostCard from '@/components/feed/PostCard';
import CommentSection from '@/components/feed/CommentSection';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const runtime = 'edge';

interface PostDetailPageProps {
  params: Promise<{
    username: string;
    postid: string;
  }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { username, postid } = await params;
  
  // ★ ShortID는 문자열이므로 parseInt 불필요
  const post = await getPostDetail(postid);
  if (!post) {
    notFound();
  }

  const commentsData = await getComments(postid);

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
        
        {/* 댓글 작성 + 목록 */}
        <CommentSection postId={postid} initialComments={commentsData} />
      </section>
    </main>
  );
}
