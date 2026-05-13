import { getPosts, searchPosts } from '@/app/actions/post';
import PostCard from './PostCard';

interface PostListProps {
  query?: string;
}

export default async function PostList({ query }: PostListProps) {
  const posts = query ? await searchPosts(query) : await getPosts();

  if (!posts || posts.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <i className="fas fa-baseball-ball" style={{ fontSize: '48px', opacity: 0.1, marginBottom: '16px', display: 'block' }}></i>
        <p>{query ? `'${query}'에 대한 검색 결과가 없습니다.` : '아직 게시글이 없습니다. 첫 소식을 전해보세요!'}</p>
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

