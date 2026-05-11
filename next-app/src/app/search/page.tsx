import { searchPosts, searchUsers } from '@/app/actions/post';
import PostCard from '@/components/feed/PostCard';
import Link from 'next/link';

export const runtime = 'edge';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q || '';
  
  if (!query) {
    return (
      <div className="flex flex-col">
        <header className="feed-header px-4 py-3 border-b border-zinc-100">
          <h2 className="text-xl font-extrabold">탐색</h2>
        </header>
        <div className="p-10 text-center text-zinc-500">
          검색어를 입력하여 야구 소식을 찾아보세요.
        </div>
      </div>
    );
  }

  const [postResults, userResults] = await Promise.all([
    searchPosts(query),
    searchUsers(query),
  ]);

  return (
    <div className="flex flex-col">
      <header className="feed-header px-4 py-3 border-b border-zinc-100 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <Link href="/"><i className="fas fa-arrow-left" /></Link>
          <h2 className="text-xl font-extrabold">"{query}" 검색 결과</h2>
        </div>
      </header>

      {userResults.length > 0 && (
        <section className="p-4 border-b-8 border-zinc-50">
          <h3 className="font-extrabold text-lg mb-4">사용자</h3>
          <div className="flex flex-col gap-4">
            {userResults.map((user) => (
              <div key={user.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full bg-zinc-200 bg-cover"
                    style={{ backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : undefined }}
                  />
                  <div className="flex flex-col">
                    <span className="font-bold">{user.displayName}</span>
                    <span className="text-zinc-500 text-sm">@{user.username}</span>
                  </div>
                </div>
                <button className="px-4 py-1.5 bg-zinc-900 text-white rounded-full font-bold text-sm">
                  팔로우
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="feed-content">
        <h3 className="font-extrabold text-lg p-4 border-b border-zinc-100">게시물</h3>
        {postResults.length > 0 ? (
          postResults.map((post) => (
            <PostCard key={post.id} post={post as any} />
          ))
        ) : (
          <div className="py-20 text-center text-zinc-500">
            검색 결과가 없습니다.
          </div>
        )}
      </section>
    </div>
  );
}
