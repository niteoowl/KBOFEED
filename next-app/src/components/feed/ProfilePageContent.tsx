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
  
  // ─── DM Chat Room States & Handlers ───
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const currentUserKey = session?.user?.id || 'guest';
  const chatStorageKey = `chat_${currentUserKey}_${profile.id}`;

  useEffect(() => {
    if (chatOpen) {
      const stored = localStorage.getItem(chatStorageKey);
      if (stored) {
        setChatMessages(JSON.parse(stored));
      } else {
        const initialMsgs = [
          {
            id: '1',
            senderId: profile.id,
            senderName: profile.displayName || profile.username,
            senderAvatar: profile.avatarUrl,
            content: `안녕하세요! 제 프로필을 보시고 연락주셨네요! ⚾ 오늘 야구 경기 보셨나요?`,
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: '2',
            senderId: currentUserKey,
            senderName: session?.user?.name || '나',
            senderAvatar: session?.user?.image,
            content: `네! 경기 정말 흥미진진하게 봤어요. 활약하시는 모습 항상 멋집니다! 🔥`,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '3',
            senderId: profile.id,
            senderName: profile.displayName || profile.username,
            senderAvatar: profile.avatarUrl,
            content: `감사합니다! 팬분들의 응원 덕분에 매 경기 힘이 납니다. 앞으로도 소중한 의견 피드에 많이 남겨주세요! 😊`,
            timestamp: new Date(Date.now() - 1800000).toISOString(),
          }
        ];
        setChatMessages(initialMsgs);
        localStorage.setItem(chatStorageKey, JSON.stringify(initialMsgs));
      }

      // Auto scroll down
      setTimeout(() => {
        const el = document.getElementById('chat-messages-container');
        if (el) el.scrollTop = el.scrollHeight;
      }, 100);
    }
  }, [chatOpen, chatStorageKey, profile.id, profile.displayName, profile.username, profile.avatarUrl, currentUserKey, session]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      senderId: currentUserKey,
      senderName: session?.user?.name || '나',
      senderAvatar: session?.user?.image,
      content: chatInput,
      timestamp: new Date().toISOString(),
    };

    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    localStorage.setItem(chatStorageKey, JSON.stringify(updated));
    setChatInput('');

    setTimeout(() => {
      const el = document.getElementById('chat-messages-container');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);

    // Auto athlete reply mock
    setTimeout(() => {
      const responses = [
        "오! 정말 날카로운 분석이네요! 다음 경기에 적극 참고하겠습니다. 💪",
        "앗 정말요? 경기장에서 마주치면 꼭 사인해 드릴게요! ✍️⚾",
        "항상 응원해주셔서 너무 든든합니다. 건강 조심하시고 내일 경기도 기대해주세요! 🌟",
        "오늘도 따뜻한 말씀으로 큰 기운을 얻고 갑니다! 즐거운 하루 보내세요 😆"
      ];
      const randomReply = responses[Math.floor(Math.random() * responses.length)];
      
      const replyMsg = {
        id: (Date.now() + 1).toString(),
        senderId: profile.id,
        senderName: profile.displayName || profile.username,
        senderAvatar: profile.avatarUrl,
        content: randomReply,
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => {
        const next = [...prev, replyMsg];
        localStorage.setItem(chatStorageKey, JSON.stringify(next));
        return next;
      });

      setTimeout(() => {
        const el = document.getElementById('chat-messages-container');
        if (el) el.scrollTop = el.scrollHeight;
      }, 50);
    }, 1500);
  };
  
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
                    <div style={{ display: 'flex', gap: '8px' }}>
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
                      <button 
                        onClick={() => {
                          setChatOpen(true);
                        }}
                        style={{
                          padding: '10px 20px', borderRadius: '9999px',
                          backgroundColor: '#10B981', color: '#FFFFFF',
                          fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        <i className="far fa-paper-plane" />
                        채팅하기
                      </button>
                    </div>
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

      {/* Instagram-style Direct Message (DM) Modal */}
      {chatOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 99999,
            }}
            onClick={() => setChatOpen(false)}
          />
          <div
            style={{
              position: 'fixed',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              maxWidth: '500px',
              height: '80vh',
              background: '#ffffff',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
              zIndex: 100000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              fontFamily: 'inherit',
            }}
          >
            {/* DM Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #f1f5f9',
                background: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={profile.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/5482/5482912.png'}
                    alt={profile.displayName || profile.username}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--border-color)', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      border: '2px solid #fff',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {profile.displayName || profile.username}
                    {profile.isVerified && (
                      <i className="fas fa-check-circle" style={{ color: '#3B82F6', fontSize: '14px' }}></i>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>@{profile.username} · 활동 중</div>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <i className="fas fa-times" />
              </button>
            </div>

            {/* DM Messages Container */}
            <div
              id="chat-messages-container"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {chatMessages.map((msg) => {
                const isMe = msg.senderId === currentUserKey;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                      {!isMe && (
                        <img
                          src={msg.senderAvatar || 'https://cdn-icons-png.flaticon.com/512/5482/5482912.png'}
                          alt={msg.senderName}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      )}
                      <div
                        style={{
                          background: isMe ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#ffffff',
                          color: isMe ? '#ffffff' : '#1f2937',
                          padding: '10px 16px',
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          fontSize: '14px',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap',
                          border: isMe ? 'none' : '1px solid #e2e8f0',
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        color: '#94a3b8',
                        marginTop: '4px',
                        marginLeft: isMe ? '0' : '36px',
                        marginRight: isMe ? '4px' : '0',
                      }}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* DM Input Footer */}
            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid #f1f5f9',
                background: '#ffffff',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                placeholder="메시지 보내기..."
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '24px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  color: '#1f2937',
                }}
              />
              <button
                onClick={handleSendMessage}
                style={{
                  background: 'var(--primary-color)',
                  color: '#fff',
                  border: 'none',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <i className="fas fa-paper-plane" style={{ fontSize: '14px' }} />
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
