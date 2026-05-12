import { getPosts } from '@/app/actions/post';
import PostCard from './PostCard';

export default async function PostList() {
  const posts = await getPosts();

  if (!posts || posts.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <i className="fas fa-baseball-ball" style={{ fontSize: '48px', opacity: 0.1, marginBottom: '16px', display: 'block' }}></i>
        <p>아직 게시글이 없습니다.<br />첫 소식을 전해보세요!</p>
      </div>
    );
  }

  return (
    <div className="feed-content">
      {posts.map((post: any) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
