'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { searchUsers } from '@/app/actions/post';
import { getProfile } from '@/app/actions/user';
import GlobalHeader from '@/components/layout/GlobalHeader';

export const runtime = 'edge';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  timestamp: string;
}

interface Profile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  favoriteTeam: string | null;
  isVerified: boolean | null;
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatUser, setActiveChatUser] = useState<Profile | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserKey = session?.user?.id || 'guest';

  // Listen for screen resize to implement Twitter-style responsive split layout
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch initial profiles list on load
  useEffect(() => {
    const loadInitialProfiles = async () => {
      try {
        setLoading(true);
        const users = await searchUsers(searchQuery);
        // Exclude current user from the list
        const currentUserUsername = (session?.user as any)?.username;
        const filtered = (users as Profile[]).filter(
          (u) => u.username !== currentUserUsername
        );
        setProfiles(filtered);
      } catch (err) {
        console.error('Failed to load initial users', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialProfiles();
  }, [searchQuery, session]);

  // Read URL params (e.g. ?username=xxx) to trigger active chat on load
  useEffect(() => {
    const targetUsername = searchParams.get('username');
    if (targetUsername) {
      const fetchTargetProfile = async () => {
        try {
          const userProfile = await getProfile(targetUsername);
          if (userProfile) {
            setActiveChatUser(userProfile as Profile);
          }
        } catch (err) {
          console.error('Error fetching target user profile from URL param', err);
        }
      };
      fetchTargetProfile();
    }
  }, [searchParams]);

  // Load chat messages when activeChatUser changes
  useEffect(() => {
    if (activeChatUser) {
      const chatStorageKey = `chat_${currentUserKey}_${activeChatUser.id}`;
      const stored = localStorage.getItem(chatStorageKey);
      if (stored) {
        setChatMessages(JSON.parse(stored));
      } else {
        // High fidelity mock message list for newly opened chats
        const initialMsgs = [
          {
            id: '1',
            senderId: activeChatUser.id,
            senderName: activeChatUser.displayName || activeChatUser.username,
            senderAvatar: activeChatUser.avatarUrl || null,
            content: `안녕하세요! 쪽지 대화방에 오신 것을 환영합니다! ⚾`,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '2',
            senderId: currentUserKey,
            senderName: session?.user?.name || '나',
            senderAvatar: session?.user?.image || null,
            content: `안녕하세요! 반갑습니다. 😊`,
            timestamp: new Date().toISOString(),
          }
        ];
        setChatMessages(initialMsgs);
        localStorage.setItem(chatStorageKey, JSON.stringify(initialMsgs));
      }

      // Auto-scroll to bottom of chat list
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [activeChatUser, currentUserKey, session]);

  // Handle sending a DM
  const handleSendMessage = () => {
    if (!chatInput.trim() || !activeChatUser) return;

    const chatStorageKey = `chat_${currentUserKey}_${activeChatUser.id}`;
    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: currentUserKey,
      senderName: session?.user?.name || '나',
      senderAvatar: session?.user?.image || null,
      content: chatInput,
      timestamp: new Date().toISOString(),
    };

    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    localStorage.setItem(chatStorageKey, JSON.stringify(updated));
    setChatInput('');

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

    // Simulated premium athlete response
    setTimeout(() => {
      const responses = [
        "네, 맞아요! 정말 흥미진진한 플레이였습니다. 앞으로도 응원 부탁드려요! 🔥",
        "소중한 쪽지 감사합니다! 남겨주신 글에 큰 힘을 얻었습니다. ⚾💪",
        "앞으로 KBO 피드에서 더 좋은 글과 분석글로 뵙겠습니다. 좋은 하루 보내세요! 🌟",
        "언제나 구장에서 힘차게 응원해주시는 팬 여러분 덕분에 뜁니다! 고맙습니다 😆"
      ];
      const randomReply = responses[Math.floor(Math.random() * responses.length)];
      
      const replyMsg: Message = {
        id: (Date.now() + 1).toString(),
        senderId: activeChatUser.id,
        senderName: activeChatUser.displayName || activeChatUser.username,
        senderAvatar: activeChatUser.avatarUrl,
        content: randomReply,
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => {
        const next = [...prev, replyMsg];
        localStorage.setItem(chatStorageKey, JSON.stringify(next));
        return next;
      });

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }, 1500);
  };

  return (
    <>
      <GlobalHeader title="쪽지" />

      <div
        className="messages-page-wrapper"
        style={{
          display: 'flex',
          height: 'calc(100vh - 53px - 53px)', // minus header & bottom nav bounds
          backgroundColor: '#fff',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {/* Left Side: Users list & search (Visible on desktop OR if no active chat on mobile) */}
        {(!isMobile || !activeChatUser) && (
          <div
            style={{
              width: isMobile ? '100%' : '240px',
              borderRight: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              backgroundColor: '#fff',
            }}
          >
            {/* Search Input Box */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative' }}>
                <i
                  className="fas fa-search"
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    fontSize: '14px',
                  }}
                />
                <input
                  type="text"
                  placeholder="쪽지 보낼 사람 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#f8fafc',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Users / Threads List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading && profiles.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  <i className="fas fa-circle-notch fa-spin" style={{ marginRight: 6 }} /> 로딩 중...
                </div>
              ) : profiles.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  사용자가 없습니다.
                </div>
              ) : (
                profiles.map((user) => {
                  const isActive = activeChatUser?.id === user.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => setActiveChatUser(user)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        backgroundColor: isActive ? '#f1f5f9' : 'transparent',
                        borderBottom: '1px solid #f8fafc',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        <img
                          src={user.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/5482/5482912.png'}
                          alt={user.displayName || user.username}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '1px',
                            right: '1px',
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            backgroundColor: '#10B981',
                            border: '2px solid #fff',
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.displayName || user.username}
                          </span>
                          {user.isVerified && (
                            <i className="fas fa-check-circle" style={{ color: '#3B82F6', fontSize: '12px' }} />
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right Side: Message Thread Pane (Visible on desktop OR if active chat is selected on mobile) */}
        {(!isMobile || activeChatUser) && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              backgroundColor: '#f8fafc',
            }}
          >
            {activeChatUser ? (
              <>
                {/* Active Chat Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isMobile && (
                      <button
                        onClick={() => setActiveChatUser(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '16px',
                          color: 'var(--primary-color)',
                          cursor: 'pointer',
                          marginRight: '8px',
                          padding: '4px',
                        }}
                      >
                        <i className="fas fa-arrow-left" />
                      </button>
                    )}
                    <img
                      src={activeChatUser.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/5482/5482912.png'}
                      alt={activeChatUser.displayName || activeChatUser.username}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {activeChatUser.displayName || activeChatUser.username}
                        {activeChatUser.isVerified && (
                          <i className="fas fa-check-circle" style={{ color: '#3B82F6', fontSize: '12px' }} />
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>활동 중</div>
                    </div>
                  </div>
                </div>

                {/* Direct Messages Container */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
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
                          maxWidth: '85%',
                          alignSelf: isMe ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                          {!isMe && (
                            <img
                              src={msg.senderAvatar || 'https://cdn-icons-png.flaticon.com/512/5482/5482912.png'}
                              alt={msg.senderName}
                              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          )}
                          <div
                            style={{
                              background: isMe ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#ffffff',
                              color: isMe ? '#ffffff' : '#1e293b',
                              padding: '8px 14px',
                              borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              fontSize: '13.5px',
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
                            fontSize: '9px',
                            color: '#94a3b8',
                            marginTop: '2px',
                            marginLeft: isMe ? '0' : '30px',
                            marginRight: isMe ? '4px' : '0',
                          }}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* DM Input Form */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border-color)',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    gap: '8px',
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
                      padding: '10px 16px',
                      borderRadius: '20px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: '#1e293b',
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    style={{
                      background: 'var(--primary-color)',
                      color: '#fff',
                      border: 'none',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                  >
                    <i className="fas fa-paper-plane" style={{ fontSize: '13px' }} />
                  </button>
                </div>
              </>
            ) : (
              /* Dedicated Direct Messages Empty State Screen */
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(2, 65, 211, 0.1)',
                    color: 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    marginBottom: '16px',
                  }}
                >
                  <i className="far fa-paper-plane" />
                </div>
                <h3 style={{ fontWeight: 800, fontSize: '18px', color: '#1e293b', marginBottom: '8px' }}>
                  메시지를 선택하세요
                </h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '300px', margin: '0 auto' }}>
                  기존 대화방을 선택하거나, 쪽지 보낼 대상을 검색하여 새로운 대화를 시작해보세요.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
