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
      <header className="feed-header" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}>
        <div className="header-left">
          <Link href="/" className="header-back-btn">
            <i className="fas fa-arrow-left"></i>
          </Link>
        </div>
        <h2 className="profile-header-title" style={{ flex: 1, textAlign: 'center', fontSize: '18px' }}>
          게시물
        </h2>
        <div className="header-right"></div>
      </header>

      <section className="post-detail-container" style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '8px solid var(--divider-color)', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
        {/* Detail Post UI */}
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <div 
              style={{
                width: '48px', height: '48px', borderRadius: '50%',
                backgroundImage: `url(${post.profiles.avatarUrl || 'https://i.pravatar.cc/150?u=' + post.profiles.username})`,
                backgroundSize: 'cover', cursor: 'pointer'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)' }}>{post.profiles.displayName || post.profiles.username}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>@{post.profiles.username}</div>
            </div>
            {/* Actions */}
            <div className="post-detail-actions" style={{ color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '14px' }}>수정</button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f4212e', fontSize: '14px' }}>삭제</button>
            </div>
          </div>

          <div style={{ fontSize: '20px', lineHeight: 1.5, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
            {post.content}
          </div>

          {post.imageUrl && (
            <div style={{ marginBottom: '16px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <img src={post.imageUrl} alt="attached img" style={{ width: '100%', display: 'block' }} />
            </div>
          )}

          <div style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '16px' }}>
             {/* Simple date format fallback */}
             {new Date(post.createdAt || '').toLocaleString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>

          {/* Detailed Stats */}
          <div style={{ borderTop: '1px solid var(--border-color)', padding: '16px 0', display: 'flex', gap: '20px', fontSize: '15px' }}>
            <div><b style={{ color: 'var(--text-primary)' }}>{post.retweetsCount || 0}</b> <span style={{ color: 'var(--text-secondary)' }}>리포스트</span></div>
            <div><b style={{ color: 'var(--text-primary)' }}>{post.likesCount || 0}</b> <span style={{ color: 'var(--text-secondary)' }}>마음에 들어요</span></div>
          </div>

          {/* Detailed Action Bar */}
          <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '12px 0', justifyContent: 'space-around', color: 'var(--text-secondary)', fontSize: '20px' }}>
             <i className="far fa-comment" style={{ cursor: 'pointer' }}></i>
             <i className="fas fa-retweet" style={{ cursor: 'pointer' }}></i>
             <i className="far fa-heart" style={{ cursor: 'pointer' }}></i>
             <i className="far fa-share-square" style={{ cursor: 'pointer' }}></i>
          </div>
        </div>
        
        {/* 댓글 작성 + 목록 */}
        <CommentSection postId={postid} initialComments={commentsData} />
      </section>
    </main>
  );
}
