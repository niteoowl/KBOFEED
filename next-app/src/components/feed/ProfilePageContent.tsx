'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PostCard from '@/components/feed/PostCard';
import Link from 'next/link';
import { getTeamLogo } from '@/lib/constants';
import { getUserLikedPosts, getUserComments } from '@/app/actions/post';
import { getUserPosts, getProfile } from '@/app/actions/user';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

interface ProfileData {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  favoriteTeam: string | null;
  isVerified: boolean | null;
  followersCount: number;
  followingCount: number;
}

interface ProfilePageContentProps {
  profile: ProfileData;
  initialPosts: any[];
}

export default function ProfilePageContent({ profile, initialPosts }: ProfilePageContentProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'media' | 'likes'>('posts');
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (dateStr.includes('T') || dateStr.endsWith('Z')) return new Date(dateStr);
    return new Date(dateStr.replace(' ', 'T') + 'Z');
  };

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'likes' && likedPosts.length === 0) {
      setLoading(true);
      getUserLikedPosts(profile.id)
        .then(data => setLikedPosts(data))
        .catch(err => console.error(err))
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
      case 'posts':
        return posts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            아직 작성한 게시물이 없습니다.
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        );

      case 'replies':
        return userComments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            아직 작성한 답글이 없습니다.
          </div>
        ) : (
          userComments.map((comment: any) => (
            <div
              key={comment.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (comment.post?.profiles?.username && comment.postId) {
                  router.push(`/@${comment.post.profiles.username}/${comment.postId}`);
                }
              }}
            >
              {/* 원본 글 (부모 포스트) */}
              {comment.post && (
                <div style={{ position: 'relative' }}>
                  <PostCard post={comment.post} suppressNavigation={true} />
                  <div style={{
                    position: 'absolute',
                    left: '37px',
                    top: '64px',
                    bottom: '-12px',
                    width: '2px',
                    backgroundColor: 'var(--divider-color)',
                    zIndex: 0
                  }}></div>
                </div>
              )}
              {/* 댓글 본문 (답글) */}
              <div style={{ display: 'flex', gap: '12px', padding: '12px 16px 16px 16px', position: 'relative', zIndex: 1 }}>
                <div
                  className="user-avatar"
                  style={{
                    backgroundImage: comment.profiles?.avatarUrl
                      ? `url(${comment.profiles.avatarUrl})`
                      : `url(https://i.pravatar.cc/150?u=${comment.profiles?.username})`,
                    backgroundSize: 'cover',
                    width: '44px',
                    height: '44px',
                    minWidth: '44px',
                    borderRadius: '50%',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {comment.profiles?.displayName || '탐험가'}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      @{comment.profiles?.username}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>·</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      {comment.createdAt
                        ? formatDistanceToNow(parseDate(comment.createdAt), { addSuffix: true, locale: ko })
                        : ''}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        );

      case 'likes':
        return likedPosts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            아직 좋아요한 게시물이 없습니다.
          </div>
        ) : (
          likedPosts.map(post => <PostCard key={post.id} post={post} />)
        );

      case 'media':
        const mediaPosts = posts.filter(p => p.imageUrl);
        return mediaPosts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            미디어 게시물이 없습니다.
          </div>
        ) : (
          mediaPosts.map(post => <PostCard key={post.id} post={post} />)
        );

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
          minHeight: '100vh'
        }}
      >
        <div style={{ position: 'relative' }}>
          {/* Back Button over banner */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
            <div 
              onClick={() => router.back()}
              style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%', color: 'white', cursor: 'pointer' }}
            >
              <i className="fas fa-arrow-left"></i>
            </div>
          </div>
          {/* Banner */}
          <div style={{ width: '100%', height: '192px', backgroundColor: '#F1F5F9', objectFit: 'cover' }}></div>
        </div>

        {/* Profile Identity */}
        <div style={{ padding: '32px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '-80px' }}>
            <div 
              style={{
                width: '96px', height: '96px', borderRadius: '16px',
                border: '1px solid #F3F4F6', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                backgroundColor: '#FFFFFF',
                backgroundImage: `url(${profile.avatarUrl || 'https://i.pravatar.cc/150?u=' + profile.username})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                position: 'relative'
              }}
            />
            <div style={{ marginTop: '48px' }}>
              {(session as any)?.user?.username === profile.username ? (
                <button 
                  onClick={() => alert('프로필 편집창 기능 추가 예정입니다.')}
                  style={{
                    padding: '10px 20px', borderRadius: '12px',
                    backgroundColor: '#111827', color: '#FFFFFF',
                    fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2937'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111827'}
                >
                  프로필 수정
                </button>
              ) : (
                <button 
                  style={{
                    padding: '10px 20px', borderRadius: '12px',
                    backgroundColor: '#111827', color: '#FFFFFF',
                    fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2937'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#111827'}
                >
                  팔로우
                </button>
              )}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.025em', color: '#111827', margin: 0 }}>
                {profile.displayName || profile.username}
              </h1>
              {profile.isVerified && (
                <i className="fas fa-check-circle" style={{ color: '#3B82F6', fontSize: '20px' }}></i>
              )}
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>
              @{profile.username}
            </p>
            
            {profile.bio && (
              <p style={{ margin: '16px 0 0 0', fontSize: '16px', lineHeight: 1.625, color: '#374151' }}>
                {profile.bio}
              </p>
            )}

            {/* Meta Info */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
              {profile.favoriteTeam && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>
                  <img src={getTeamLogo(profile.favoriteTeam)} alt={profile.favoriteTeam} style={{ width: '16px', height: '16px' }} />
                  <span>{profile.favoriteTeam} 팬</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '20px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #F9FAFB' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{profile.followingCount || 0}</span>
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#6B7280' }}>팔로잉</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{profile.followersCount || 0}</span>
                <span style={{ fontSize: '14px', fontWeight: 400, color: '#6B7280' }}>팔로워</span>
              </div>
            </div>
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
            className={`profile-nav-tab ${activeTab === 'likes' ? 'active' : ''}`}
            onClick={() => setActiveTab('likes')}
            style={{ cursor: 'pointer' }}
          >
            좋아요
          </div>
        </div>

        <div id="profile-feed-container">
          {renderTabContent()}
        </div>
      </section>
    </main>
  );
}
