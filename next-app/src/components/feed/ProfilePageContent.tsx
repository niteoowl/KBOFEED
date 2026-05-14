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
                padding: '16px',
                borderBottom: '1px solid var(--border-color)',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (comment.post?.profiles?.username && comment.postId) {
                  router.push(`/@${comment.post.profiles.username}/${comment.postId}`);
                }
              }}
            >
              {/* 원본 글 미니 프리뷰 */}
              {comment.post && (
                <div style={{
                  padding: '12px 14px',
                  marginBottom: '12px',
                  borderLeft: '4px solid var(--border-color)',
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {comment.post.profiles?.displayName || '탐험가'}
                  </span>
                  <span style={{ marginLeft: '6px' }}>@{comment.post.profiles?.username}</span>
                  <p style={{ margin: '6px 0 0', color: 'var(--text-primary)', fontSize: '14px' }}>
                    {(comment.post.content || '').slice(0, 80)}
                    {(comment.post.content || '').length > 80 ? '...' : ''}
                  </p>
                </div>
              )}
              {/* 댓글 본문 */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  className="user-avatar"
                  style={{
                    backgroundImage: comment.profiles?.avatarUrl
                      ? `url(${comment.profiles.avatarUrl})`
                      : `url(https://i.pravatar.cc/150?u=${comment.profiles?.username})`,
                    backgroundSize: 'cover',
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    borderRadius: '50%',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {comment.profiles?.displayName || '탐험가'}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      @{comment.profiles?.username}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>·</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {comment.createdAt
                        ? formatDistanceToNow(parseDate(comment.createdAt), { addSuffix: true, locale: ko })
                        : ''}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: 1.5, margin: 0 }}>
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

      <section className="profile-container" style={{ marginTop: 0, borderTop: 'none' }}>
        <div className="profile-header-new" style={{ position: 'relative' }}>
          <div className="profile-main-info">
            <div className="profile-actions" style={{ position: 'absolute', top: '20px', right: '20px' }}>
              {(session as any)?.user?.username === profile.username ? (
                <button 
                  onClick={() => alert('프로필 편집창 기능 추가 예정입니다.')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  프로필 수정
                </button>
              ) : (
                <button className="follow-btn">팔로우</button>
              )}
            </div>
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
                    <img src={getTeamLogo(profile.favoriteTeam)} alt={profile.favoriteTeam} />
                    <span>{profile.favoriteTeam} 팬</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="profile-meta-new">
              {profile.bio && (
                <p className="profile-bio-new">
                  {profile.bio}
                </p>
              )}

              <div className="profile-stats-row">
                <div className="stat-group"><b>{profile.followingCount || 0}</b> 팔로잉</div>
                <div className="stat-group"><b>{profile.followersCount || 0}</b> 팔로워</div>
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
