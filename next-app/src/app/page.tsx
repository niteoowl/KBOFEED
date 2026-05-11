import { getPosts } from '@/app/actions/post';
import PostCard from '@/components/feed/PostCard';
import ComposePost from '@/components/feed/ComposePost';

export const runtime = 'edge';

export default async function Home() {
  const allPosts: any[] = await getPosts();

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="feed-header-group sticky top-0 z-50">
        <div className="feed-header px-4 py-3 flex justify-between items-center bg-white/80 backdrop-blur-md">
          <h2 className="text-xl font-extrabold text-zinc-900">홈</h2>
        </div>
        <div className="feed-tabs flex border-b border-zinc-100">
          <div className="feed-tab active flex-1 text-center py-4 font-bold relative cursor-pointer">
            전체글
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-primary rounded-full" />
          </div>
          <div className="feed-tab flex-1 text-center py-4 font-bold text-zinc-500 cursor-pointer hover:bg-zinc-50">
            내팀
          </div>
        </div>
      </header>

      {/* Compose */}
      <ComposePost />

      {/* Feed Content */}
      <div className="feed-content">
        {allPosts.length > 0 ? (
          allPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <div className="py-20 text-center text-zinc-500">
            <i className="fas fa-baseball-ball text-4xl mb-4 opacity-20" />
            <p>아직 게시글이 없습니다.<br />첫 소식을 전해보세요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
