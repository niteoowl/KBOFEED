'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PostCard from '@/components/feed/PostCard';
import Link from 'next/link';
import { getTeamLogo } from '@/lib/constants';
import { getUserLikedPosts, getUserComments } from '@/app/actions/post';
import { getUserPosts, getProfile, updateProfile } from '@/app/actions/user';
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

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    favoriteTeam: profile.favoriteTeam || '',
    avatarUrl: profile.avatarUrl || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile(editForm);
      window.location.reload();
    } catch (e) {
      alert('프로필 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

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
                borderBottom: '8px solid var(--divider-color)',
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
                <div>
                  <PostCard post={comment.post} suppressNavigation={true} />
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
          minHeight: '100vh',
          marginTop: '-56px'
        }}
      >
        <div style={{ width: '100%', height: '192px', backgroundColor: '#F1F5F9', objectFit: 'cover' }}></div>

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
                      onClick={() => setIsEditing(true)}
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
                      style={{
                        padding: '10px 20px', borderRadius: '9999px',
                        backgroundColor: '#111827', color: '#FFFFFF',
                        fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer'
                      }}
                    >
                      팔로우
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

      {/* Profile Edit Modal */}
      {isEditing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#fff', width: '90%', maxWidth: '400px', borderRadius: '16px', padding: '24px', position: 'relative',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 800 }}>프로필 수정</h2>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 600 }}>프로필 이미지 URL</label>
              <input 
                value={editForm.avatarUrl} onChange={e => setEditForm({...editForm, avatarUrl: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '15px' }} 
              />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 600 }}>이름 (Display Name)</label>
              <input 
                value={editForm.displayName} onChange={e => setEditForm({...editForm, displayName: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '15px' }} 
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 600 }}>소개글 (Bio)</label>
              <textarea 
                value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '8px', minHeight: '80px', fontSize: '15px' }} 
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 600 }}>응원팀</label>
              <select 
                value={editForm.favoriteTeam} onChange={e => setEditForm({...editForm, favoriteTeam: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '8px', fontSize: '15px' }}
              >
                <option value="">선택 안함</option>
                <option value="KIA">KIA 타이거즈</option>
                <option value="삼성">삼성 라이온즈</option>
                <option value="LG">LG 트윈스</option>
                <option value="두산">두산 베어스</option>
                <option value="KT">KT 위즈</option>
                <option value="SSG">SSG 랜더스</option>
                <option value="롯데">롯데 자이언츠</option>
                <option value="한화">한화 이글스</option>
                <option value="NC">NC 다이노스</option>
                <option value="키움">키움 히어로즈</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => setIsEditing(false)} 
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}
              >
                취소
              </button>
              <button 
                onClick={handleSaveProfile} 
                disabled={isSaving}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#111827', color: '#fff', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
