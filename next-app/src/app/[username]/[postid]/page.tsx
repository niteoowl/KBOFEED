import { getPostDetail, getComments, getCommentDetail } from '@/app/actions/post';
import PostCard from '@/components/feed/PostCard';
import CommentSection from '@/components/feed/CommentSection';
import ThreadBlock from '@/components/feed/ThreadBlock';
import { notFound } from 'next/navigation';

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
  const focusedCommentRow = focusedCommentId
    ? commentsData.find((c) => String(c.id) === focusedCommentId)
    : null;

  return (
    <main className="main-feed post-detail-page" style={{ borderTop: 'none', paddingTop: 0 }}>
      <section className="post-detail-container" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {focusedCommentId && focusedCommentRow ? (
          <>
            <ThreadBlock
              parentPost={post}
              comment={{
                id: String(focusedCommentRow.id),
                content: focusedCommentRow.content,
                createdAt: focusedCommentRow.createdAt,
                profiles: focusedCommentRow.profiles,
              }}
            />
            <div className="thread-block-separator" />
            <CommentSection
              postId={post.id}
              initialComments={commentsData.filter((c) => String(c.id) !== focusedCommentId)}
              focusedCommentId={null}
            />
          </>
        ) : (
          <>
            <PostCard post={post} suppressNavigation={true} isDetailView={true} />
            <CommentSection postId={post.id} initialComments={commentsData} focusedCommentId={focusedCommentId} />
          </>
        )}
      </section>
    </main>
  );
}
