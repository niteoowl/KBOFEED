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
        
        {/* Cover Image */}
        <div style={{ height: '192px', backgroundColor: '#f1f5f9', overflow: 'hidden', position: 'relative' }}>
          <img 
             src={`https://placehold.co/1200x400/e2e8f0/64748b?text=${profile.favoriteTeam || 'Cover'}`}
             onError={(e) => { e.currentTarget.src = 'https://placehold.co/1200x400/cccccc/ffffff?text=Banner'; }}
             style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
             alt="Cover"
          />
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
              <div 
                style={{ 
                  width: '96px', height: '96px', borderRadius: '24px', overflow: 'hidden', 
                  backgroundColor: '#f3f4f6', flexShrink: 0, marginTop: '-48px',
                  border: '4px solid white', backgroundImage: `url(${profile.avatarUrl || 'https://i.pravatar.cc/150?u=' + profile.username})`, backgroundSize: 'cover'
                }}
              />
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>{profile.displayName || profile.username}</h1>
                  {profile.isVerified && <i className="fas fa-check-circle" style={{ color: 'var(--primary-color)' }} />}
                  {profile.favoriteTeam && (
                     <span style={{ padding: '2px 8px', backgroundColor: 'var(--hover-bg)', color: 'var(--primary-color)', fontSize: '10px', fontWeight: 700, borderRadius: '6px' }}>{profile.favoriteTeam}</span>
                  )}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0 0', fontWeight: 500 }}>@{profile.username}</p>
              </div>
            </div>
            
            <div style={{ marginTop: '8px' }}>
              {(session as any)?.user?.username === profile.username ? (
                <button 
                  onClick={() => alert('프로필 편집창 기능 추가 예정입니다.')}
                  style={{
                    padding: '10px 20px', borderRadius: '12px', backgroundColor: '#111827', color: 'white', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer'
                  }}
                >
                  프로필 수정
                </button>
              ) : (
                <button 
                  style={{
                    padding: '10px 20px', borderRadius: '12px', backgroundColor: '#111827', color: 'white', fontWeight: 700, fontSize: '14px', border: 'none', cursor: 'pointer'
                  }}
                >
                  팔로우
                </button>
              )}
            </div>
          </div>
          
          <div style={{ marginTop: '24px' }}>
             {profile.bio && (
                 <p style={{ fontSize: '16px', color: '#374151', lineHeight: 1.6, margin: '0 0 24px 0', maxWidth: '600px' }}>{profile.bio}</p>
             )}
             
             <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)', fontSize: '14px', flexWrap: 'wrap', fontWeight: 500 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                   서울
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z"/></svg>
                   2024년 5월 가입
                </span>
             </div>
             
             <div style={{ display: 'flex', gap: '24px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ cursor: 'pointer' }}>
                   <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{profile.followingCount || 0}</span> <span style={{ color: 'var(--text-secondary)', fontSize: '14px', marginLeft: '4px' }}>팔로잉</span>
                </div>
                <div style={{ cursor: 'pointer' }}>
                   <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>{profile.followersCount || 0}</span> <span style={{ color: 'var(--text-secondary)', fontSize: '14px', marginLeft: '4px' }}>팔로워</span>
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
