import { getProfile, getUserPosts } from '@/app/actions/user';
import PostCard from '@/components/feed/PostCard';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const runtime = 'edge';

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  
  // URL encoded @username 處理
  const decodedUsername = decodeURIComponent(username).replace(/^@/, '');
  
  const profile = await getProfile(decodedUsername);
  if (!profile) {
    notFound();
  }

  const posts = await getUserPosts(profile.id);

  return (
    <main className="main-feed">
      <header className="feed-header">
        <div className="header-left">
          <Link href="/" className="header-back-btn">
            <i className="fas fa-arrow-left"></i>
          </Link>
        </div>
        <h2 className="profile-header-title" style={{ flex: 1, textAlign: 'center' }}>
          {profile.displayName || profile.username}
        </h2>
        <div className="header-right"></div>
      </header>

      <section className="profile-container">
        <div className="profile-header-new">
          <div className="profile-main-info">
            <div className="profile-intro-row">
              <div 
                className="profile-avatar-new" 
                style={{ backgroundImage: `url(${profile.avatarUrl || 'https://i.pravatar.cc/150?u=' + profile.username})` }}
              ></div>
              <div className="profile-info-main">
                <h1 className="profile-name-large">{profile.displayName || profile.username}</h1>
                <p className="profile-handle-large">@{profile.username}</p>
                
                {profile.favoriteTeam && (
                  <div className="team-badge">
                    <img src={`/images/${profile.favoriteTeam}트윈스.svg`} alt={profile.favoriteTeam} />
                    <span>{profile.favoriteTeam} 팬</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="profile-meta-new">
              <p className="profile-bio-new">
                {profile.bio || '프로필 소개가 없습니다.'}
              </p>

              <div className="profile-stats-row">
                <div className="stat-group"><b>{profile.followingCount}</b> 팔로잉</div>
                <div className="stat-group"><b>{profile.followersCount}</b> 팔로워</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-nav-tabs">
          <div className="profile-nav-tab active">게시물</div>
          <div className="profile-nav-tab">답글</div>
          <div className="profile-nav-tab">미디어</div>
          <div className="profile-nav-tab">좋아요</div>
        </div>

        <div id="profile-feed-container">
          {posts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              게시물이 없습니다.
            </div>
          ) : (
            posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>
      </section>
    </main>
  );
}
