'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PostCard from '@/components/feed/PostCard';
import Link from 'next/link';
import { getTeamLogo } from '@/lib/constants';
import { getUserLikedPosts, getUserComments, getUserSavedPosts } from '@/app/actions/post';
import ThreadBlock from '@/components/feed/ThreadBlock';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getUserPosts, getProfile, updateProfile, toggleFollow } from '@/app/actions/user';
import { formatDistanceToNow } from 'date-fns';

interface ProfileData {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  favoriteTeam: string | null;
  isVerified: boolean | null;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  createdAt?: string | null;
}

interface ProfilePageContentProps {
  profile: ProfileData;
  initialPosts: any[];
}

export default function ProfilePageContent({ profile, initialPosts }: ProfilePageContentProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'activity'>('posts');
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(profile.isFollowing);
  
  const handleEditProfile = () => {
    router.push('/settings');
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (dateStr.includes('T') || dateStr.endsWith('Z')) return new Date(dateStr);
    return new Date(dateStr.replace(' ', 'T') + 'Z');
  };

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'activity' && likedPosts.length === 0 && savedPosts.length === 0) {
      setLoading(true);
      Promise.all([getUserLikedPosts(profile.id), getUserSavedPosts(profile.id)])
        .then(([liked, saved]) => {
          setLikedPosts(liked);
          setSavedPosts(saved);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
    if (activeTab === 'replies' && userComments.length === 0) {
      setLoading(true);
      getUserComments(profile.id)
        .then(data => setUserComments(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [activeTab, profile.id]);

  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          로딩 중...
        </div>
      );
    }

    switch (activeTab) {
      case 'posts': {
        const pinnedPostId = (profile as any).pinnedPostId;
        const pinnedPost = pinnedPostId ? posts.find(p => p.id === pinnedPostId) : null;
        const regularPosts = pinnedPostId ? posts.filter(p => p.id !== pinnedPostId) : posts;

        return posts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            아직 작성한 게시물이 없습니다.
          </div>
        ) : (
          <>
            {pinnedPost && (
              <div style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ padding: '8px 20px 0 20px', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="fas fa-thumbtack" style={{ transform: 'rotate(45deg)' }} />
                  <span>고정된 게시물</span>
                </div>
                <PostCard post={pinnedPost} />
              </div>
            )}
            {regularPosts.map(post => <PostCard key={post.id} post={post} />)}
          </>
        );
      }

      case 'replies':
        return userComments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            아직 작성한 답글이 없습니다.
          </div>
        ) : (
          userComments.map((comment: any) =>
            comment.post ? (
              <ThreadBlock
                key={comment.id}
                parentPost={comment.post}
                comment={{
                  id: comment.id,
                  content: comment.content,
                  createdAt: comment.createdAt,
                  profiles: comment.profiles,
                }}
                onClick={() => {
                  if (comment.post?.profiles?.username) {
                    router.push(`/@${comment.post.profiles.username}/${comment.id}`);
                  }
                }}
              />
            ) : null
          )
        );

      case 'activity': {
        const activityPosts = [
          ...likedPosts,
          ...savedPosts.filter((s) => !likedPosts.some((l) => l.id === s.id)),
        ];
        return (
          <>
            <p style={{ padding: '12px 20px', margin: 0, fontSize: 14, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)' }}>
              내 활동은 나만 볼 수 있습니다.
            </p>
            {activityPosts.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                활동 내역이 없습니다.
              </div>
            ) : (
              activityPosts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </>
        );
      }

      case 'media': {
        const mediaPosts = posts.filter((p) => p.imageUrl);
        return mediaPosts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            미디어 게시물이 없습니다.
          </div>
        ) : (
          <div className="profile-media-grid">
            {mediaPosts.map((post) => (
              <a
                key={post.id}
                href={`/@${profile.username}/${post.id}`}
                className="profile-media-item"
                style={{ backgroundImage: `url(${post.imageUrl})` }}
              />
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <main className="main-feed" style={{ paddingTop: 0 }}>
      {/* profile-container without feed-header */}
      <section 
        className="profile-container" 
        style={{ 
          backgroundColor: '#FFFFFF',
          maxWidth: '700px',
          margin: '0 auto',
          borderLeft: '1px solid #F3F4F6',
          borderRight: '1px solid #F3F4F6',
          borderTop: 'none',
          paddingBottom: '24px',
          minHeight: '100vh',
          marginTop: '-56px'
        }}
      >
        {profile.coverUrl ? (
          <div style={{ width: '100%', height: '192px', backgroundImage: `url(${profile.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
        ) : (
          <div style={{ width: '100%', height: '192px', backgroundColor: '#F1F5F9' }}></div>
        )}

        {/* Profile Identity - No overlapping */}
        <div style={{ padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div 
              style={{
                width: '80px', height: '80px', borderRadius: '50%',
                backgroundImage: `url(${profile.avatarUrl || 'https://i.pravatar.cc/150?u=' + profile.username})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                flexShrink: 0
              }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '80px', justifyContent: 'space-evenly' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.025em', color: '#111827', margin: 0, lineHeight: 1 }}>
                      {profile.displayName || profile.username}
                    </h1>
                    {profile.isVerified && (
                      <i className="fas fa-check-circle" style={{ color: '#3B82F6', fontSize: '20px' }}></i>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: '#6B7280', lineHeight: 1 }}>
                    @{profile.username}
                  </p>
                  {profile.favoriteTeam && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 500, color: '#6B7280', lineHeight: 1 }}>
                      <img src={getTeamLogo(profile.favoriteTeam)} alt={profile.favoriteTeam} style={{ width: '16px', height: '16px' }} />
                      <span>{profile.favoriteTeam} 팬</span>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div>
                  {(session as any)?.user?.username === profile.username ? (
                    <button 
                      onClick={handleEditProfile}
                      style={{
                        padding: '10px 20px', borderRadius: '9999px',
                        backgroundColor: '#111827', color: '#FFFFFF',
                        fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer'
                      }}
                    >
                      프로필 수정
                    </button>
                  ) : (
                    <button 
                      onClick={async () => {
                        try {
                          await toggleFollow(profile.id);
                          setIsFollowing(!isFollowing);
                        } catch (e) {
                          alert('로그인이 필요합니다.');
                        }
                      }}
                      style={{
                        padding: '10px 20px', borderRadius: '9999px',
                        backgroundColor: isFollowing ? 'transparent' : '#111827', 
                        color: isFollowing ? '#111827' : '#FFFFFF',
                        border: isFollowing ? '1px solid #D1D5DB' : 'none',
                        fontWeight: 600, fontSize: '14px', cursor: 'pointer'
                      }}
                    >
                      {isFollowing ? '언팔로우' : '팔로우'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            {profile.bio && (
              <p style={{ margin: '0', fontSize: '16px', lineHeight: 1.625, color: '#111827' }}>
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{profile.followingCount || 0}</span>
                <span style={{ fontSize: '15px', fontWeight: 400, color: '#6B7280' }}>팔로잉</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{profile.followersCount || 0}</span>
                <span style={{ fontSize: '15px', fontWeight: 400, color: '#6B7280' }}>팔로워</span>
              </div>
            </div>
            {profile.createdAt && (
              <p style={{ margin: '12px 0 0', fontSize: 14, color: '#6B7280' }}>
                {format(parseDate(profile.createdAt), 'yyyy년 M월 d일', { locale: ko })} 가입
              </p>
            )}
          </div>
        </div>

        <div className="profile-nav-tabs">
          <div
            className={`profile-nav-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
            style={{ cursor: 'pointer' }}
          >
            게시물
          </div>
          <div
            className={`profile-nav-tab ${activeTab === 'replies' ? 'active' : ''}`}
            onClick={() => setActiveTab('replies')}
            style={{ cursor: 'pointer' }}
          >
            답글
          </div>
          <div
            className={`profile-nav-tab ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
            style={{ cursor: 'pointer' }}
          >
            미디어
          </div>
          <div
            className={`profile-nav-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
            style={{ cursor: 'pointer' }}
          >
            활동
          </div>
        </div>

        <div id="profile-feed-container">
          {renderTabContent()}
        </div>
      </section>

    </main>
  );
}
