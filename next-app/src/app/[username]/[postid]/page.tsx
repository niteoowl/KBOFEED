import { getPostDetail, getComments, getCommentDetail } from '@/app/actions/post';
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
  
  let post = await getPostDetail(postid);
  let focusedCommentId: string | null = null;

  if (!post) {
    const comment = await getCommentDetail(postid);
    if (comment) {
      post = await getPostDetail(comment.postId);
      focusedCommentId = String(comment.id);
    }
  }

  if (!post) {
    notFound();
  }

  const commentsData = await getComments(post.id);

  return (
    <main className="main-feed" style={{ borderTop: 'none', paddingTop: 0 }}>

      <section className="post-detail-container" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '8px solid var(--divider-color)', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
        <PostCard post={post} suppressNavigation={true} isDetailView={true} />
        
        {/* 댓글 작성 + 목록 */}
        <CommentSection postId={post.id} initialComments={commentsData} focusedCommentId={focusedCommentId} />
      </section>
    </main>
  );
}
