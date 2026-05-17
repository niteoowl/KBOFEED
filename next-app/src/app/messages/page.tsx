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
  senderTeam?: string;
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

interface OpenChatRoom {
  id: string;
  title: string;
  description: string;
  tags: string[];
  membersCount: number;
  maxMembers: number;
  lastMessage: string;
  lastMessageTime: string;
  avatarSymbol: string;
  gradient: string;
  messages: Message[];
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  // Tab State: 'openchat' (KakaoTalk Style) or 'dm' (Private DMs)
  const [activeTab, setActiveTab] = useState<'openchat' | 'dm'>('openchat');

  // Private DMs States
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatUser, setActiveChatUser] = useState<Profile | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(false);

  // Open Chat States
  const [openChatRooms, setOpenChatRooms] = useState<OpenChatRoom[]>([
    {
      id: 'oc_1',
      title: '⚾ KBO 실시간 중계 대화방 ⚾',
      description: '10구단 야구팬 누구나 모여서 경기 보며 신나게 중계 달리는 방!',
      tags: ['전구단', '실시간응원', '중계'],
      membersCount: 1208,
      maxMembers: 1500,
      lastMessage: '아니 오늘 김도영 30-30 달성 실화인가요?! 소름 돋았음 ㄷㄷ',
      lastMessageTime: '오후 5:48',
      avatarSymbol: '⚾',
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      messages: [
        { id: 'm1', senderId: 'user_a', senderName: '타이거즈_응원러', senderAvatar: 'https://i.pravatar.cc/150?u=a', content: '기아 타이거즈 화이팅!! 올해도 우승이다!', timestamp: new Date(Date.now() - 600000).toISOString(), senderTeam: 'KIA' },
        { id: 'm2', senderId: 'user_b', senderName: '무적엘지팬', senderAvatar: 'https://i.pravatar.cc/150?u=b', content: '잠실 더비 응원 오신 분 있나요?? 외야 분위기 대박입니다', timestamp: new Date(Date.now() - 400000).toISOString(), senderTeam: 'LG' },
        { id: 'm3', senderId: 'user_c', senderName: '최강보살한화', senderAvatar: 'https://i.pravatar.cc/150?u=c', content: '류현진 삼진 쇼 보고 스트레스 다 풀고 가요 ㅋㅋㅋ', timestamp: new Date(Date.now() - 200000).toISOString(), senderTeam: '한화' },
        { id: 'm4', senderId: 'user_d', senderName: '삼팬_사자후', senderAvatar: 'https://i.pravatar.cc/150?u=d', content: '아니 오늘 김도영 30-30 달성 실화인가요?! 소름 돋았음 ㄷㄷ', timestamp: new Date(Date.now() - 50000).toISOString(), senderTeam: '삼성' },
      ]
    },
    {
      id: 'oc_2',
      title: '🦅 한화이글스 독수리 행복쉼터 🦅',
      description: '한화이글스 팬들의 청정 소통방! 행복야구 같이 해봐요.',
      tags: ['한화', '행복야구', '대전직관'],
      membersCount: 482,
      maxMembers: 500,
      lastMessage: '문동주 오늘 선발 160km 직구 꽂는 거 봤습니까?? 미쳤다',
      lastMessageTime: '오후 5:42',
      avatarSymbol: '🦅',
      gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
      messages: [
        { id: 'm1', senderId: 'user_e', senderName: '한화에살어리랏다', senderAvatar: 'https://i.pravatar.cc/150?u=e', content: '올해는 진짜 대전에서 가을야구 냄새 난다!!', timestamp: new Date(Date.now() - 1000000).toISOString(), senderTeam: '한화' },
        { id: 'm2', senderId: 'user_f', senderName: '오렌지독수리', senderAvatar: 'https://i.pravatar.cc/150?u=f', content: '오늘 퇴근하고 한화생명이글스파크 1루 내야 달려갑니다!', timestamp: new Date(Date.now() - 500000).toISOString(), senderTeam: '한화' },
        { id: 'm3', senderId: 'user_g', senderName: '빙그레아재', senderAvatar: 'https://i.pravatar.cc/150?u=g', content: '문동주 오늘 선발 160km 직구 꽂는 거 봤습니까?? 미쳤다', timestamp: new Date(Date.now() - 120000).toISOString(), senderTeam: '한화' },
      ]
    },
    {
      id: 'oc_3',
      title: '🦁 삼성 라이온즈 푸른 사자 대기실 🦁',
      description: '최강삼성! 대구 라팍 직관 정보 및 사자후 응원 대화방.',
      tags: ['삼성', '라팍직관', '대구'],
      membersCount: 312,
      maxMembers: 500,
      lastMessage: '구자욱 오늘 연타석 홈런 ㅋㅋㅋㅋ 대구의 왕 맞네',
      lastMessageTime: '오후 5:35',
      avatarSymbol: '🦁',
      gradient: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
      messages: [
        { id: 'm1', senderId: 'user_h', senderName: '라팍달리기', senderAvatar: 'https://i.pravatar.cc/150?u=h', content: '원태인 완봉승 기원하는 사람 개추 ㅋㅋㅋ', timestamp: new Date(Date.now() - 800000).toISOString(), senderTeam: '삼성' },
        { id: 'm2', senderId: 'user_i', senderName: '푸른심장33', senderAvatar: 'https://i.pravatar.cc/150?u=i', content: '구자욱 오늘 연타석 홈런 ㅋㅋㅋㅋ 대구의 왕 맞네', timestamp: new Date(Date.now() - 300000).toISOString(), senderTeam: '삼성' },
      ]
    },
    {
      id: 'oc_4',
      title: '🌟 무적 LG 트윈스 유광점퍼 모임 🌟',
      description: '엘팬들의 끈끈한 수다방! 직관 인증샷 매일 올라옵니다.',
      tags: ['LG', '잠실', '유광점퍼'],
      membersCount: 298,
      maxMembers: 500,
      lastMessage: '신바람 야구 가동!! 오늘 경기 무조건 스윕 가자',
      lastMessageTime: '오후 5:30',
      avatarSymbol: '🌟',
      gradient: 'linear-gradient(135deg, #be185d 0%, #db2777 100%)',
      messages: [
        { id: 'm1', senderId: 'user_j', senderName: '트윈스포에버', senderAvatar: 'https://i.pravatar.cc/150?u=j', content: '유광점퍼 세탁소 맡겼던 거 찾았습니다 ㅋㅋㅋ 가을 준비 해야죠', timestamp: new Date(Date.now() - 900000).toISOString(), senderTeam: 'LG' },
        { id: 'm2', senderId: 'user_k', senderName: '엘지오지환', senderAvatar: 'https://i.pravatar.cc/150?u=k', content: '신바람 야구 가동!! 오늘 경기 무조건 스윕 가자', timestamp: new Date(Date.now() - 400000).toISOString(), senderTeam: 'LG' },
      ]
    },
    {
      id: 'oc_5',
      title: '🔥 KBO 야구 굿즈 및 포토카드 양도/소통 🔥',
      description: '10구단 포토카드 교환, 구단 한정판 굿즈 직거래 소통방입니다.',
      tags: ['굿즈', '포토카드', '양도'],
      membersCount: 642,
      maxMembers: 1000,
      lastMessage: '기아 김도영 싸인 포카 가지고 계신 분 교환 가능할까요?? 쪽지 주세요',
      lastMessageTime: '오후 5:21',
      avatarSymbol: '💎',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
      messages: [
        { id: 'm1', senderId: 'user_l', senderName: '굿즈콜렉터', senderAvatar: 'https://i.pravatar.cc/150?u=l', content: '삼성 사자 랜드 마스코트 인형 구합니다!', timestamp: new Date(Date.now() - 1200000).toISOString() },
        { id: 'm2', senderId: 'user_m', senderName: '포카좋아', senderAvatar: 'https://i.pravatar.cc/150?u=m', content: '기아 김도영 싸인 포카 가지고 계신 분 교환 가능할까요?? 쪽지 주세요', timestamp: new Date(Date.now() - 600000).toISOString() },
      ]
    }
  ]);

  const [activeOpenChat, setActiveOpenChat] = useState<OpenChatRoom | null>(null);
  const [openChatSearch, setOpenChatSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('전체');
  const [openChatInput, setOpenChatInput] = useState('');

  // Create Open Chat Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomTag, setNewRoomTag] = useState('전구단');
  const [newRoomLimit, setNewRoomLimit] = useState(500);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const openChatEndRef = useRef<HTMLDivElement>(null);
  const currentUserKey = session?.user?.id || 'guest';

  // Responsive Hook
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch DM Users List
  useEffect(() => {
    if (activeTab === 'dm') {
      const loadInitialProfiles = async () => {
        try {
          setLoading(true);
          const users = await searchUsers(searchQuery);
          const currentUserUsername = (session?.user as any)?.username;
          const filtered = (users as Profile[]).filter(
            (u) => u.username !== currentUserUsername
          );
          setProfiles(filtered);
        } catch (err) {
          console.error('Failed to load users', err);
        } finally {
          setLoading(false);
        }
      };
      loadInitialProfiles();
    }
  }, [searchQuery, session, activeTab]);

  // Load URL Target User
  useEffect(() => {
    const targetUsername = searchParams.get('username');
    if (targetUsername) {
      setActiveTab('dm');
      const fetchTargetProfile = async () => {
        try {
          const userProfile = await getProfile(targetUsername);
          if (userProfile) {
            setActiveChatUser(userProfile as Profile);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchTargetProfile();
    }
  }, [searchParams]);

  // Private DM message logic
  useEffect(() => {
    if (activeChatUser) {
      const chatStorageKey = `chat_${currentUserKey}_${activeChatUser.id}`;
      const stored = localStorage.getItem(chatStorageKey);
      if (stored) {
        setChatMessages(JSON.parse(stored));
      } else {
        const initialMsgs = [
          {
            id: '1',
            senderId: activeChatUser.id,
            senderName: activeChatUser.displayName || activeChatUser.username,
            senderAvatar: activeChatUser.avatarUrl || null,
            content: `안녕하세요! 1대1 쪽지 대화방에 오신 것을 환영합니다! ⚾`,
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
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [activeChatUser, currentUserKey, session]);

  // Scroll to bottom in group chat room
  useEffect(() => {
    if (activeOpenChat) {
      setTimeout(() => {
        openChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [activeOpenChat, activeOpenChat?.messages]);

  const handleSendDM = () => {
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

    // Mock Reply
    setTimeout(() => {
      const responses = [
        "네, 저도 경기 실시간으로 보고 있어요! 대박이네요 🔥",
        "소중한 쪽지 감사합니다! 남겨주신 글에 큰 힘을 얻었습니다. ⚾💪",
        "KBO 피드 응원해 주셔서 감사합니다! 구장에서 뵙겠습니다 😆"
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

  // Open Chat Room sending
  const handleSendOpenChat = () => {
    if (!openChatInput.trim() || !activeOpenChat) return;
    
    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: currentUserKey,
      senderName: session?.user?.name || '익명팬',
      senderAvatar: session?.user?.image || 'https://i.pravatar.cc/150?u=my',
      content: openChatInput,
      timestamp: new Date().toISOString(),
      senderTeam: (session?.user as any)?.favoriteTeam || undefined,
    };

    // Update room messages local state
    const updatedMessages = [...activeOpenChat.messages, newMsg];
    const updatedRoom = {
      ...activeOpenChat,
      messages: updatedMessages,
      lastMessage: openChatInput,
      lastMessageTime: '방금 전'
    };

    setActiveOpenChat(updatedRoom);
    setOpenChatRooms((prevRooms) =>
      prevRooms.map((r) => (r.id === activeOpenChat.id ? updatedRoom : r))
    );
    setOpenChatInput('');

    // Active Live Fans Response Simulation (KakaoTalk Style)
    setTimeout(() => {
      const fanReplies = [
        "헐 대박 ㅋㅋㅋ 완전 동감합니다!!",
        "오 맞아요!! 다음 공격이 진짜 중요해졌네요.",
        "ㅋㅋㅋㅋㅋ 대화방 시끌시끌해서 재밌네요 👍",
        "이번 이닝은 진짜 점수 내야되는데!! 화이팅!!",
        "오오 반갑습니다! 자주 소통해요! ⚾🔥"
      ];
      const randomName = ['최강한화_보살', '기아_도영맘', '잠실유광트윈스', '삼팬사자왕', '롯데거인갈매기'][Math.floor(Math.random() * 5)];
      const randomTeam = ['한화', 'KIA', 'LG', '삼성', '롯데'][Math.floor(Math.random() * 5)];
      const randomAvatar = `https://i.pravatar.cc/150?u=${randomName}`;

      const replyMsg: Message = {
        id: (Date.now() + 1).toString(),
        senderId: 'mock_fan_' + Date.now(),
        senderName: randomName,
        senderAvatar: randomAvatar,
        content: fanReplies[Math.floor(Math.random() * fanReplies.length)],
        timestamp: new Date().toISOString(),
        senderTeam: randomTeam
      };

      setActiveOpenChat((currentActive) => {
        if (!currentActive || currentActive.id !== activeOpenChat.id) return currentActive;
        const nextMsgs = [...currentActive.messages, replyMsg];
        const nextRoom = {
          ...currentActive,
          messages: nextMsgs,
          lastMessage: replyMsg.content,
          lastMessageTime: '방금 전'
        };

        // Sync with openChatRooms list
        setOpenChatRooms((prevRooms) =>
          prevRooms.map((r) => (r.id === activeOpenChat.id ? nextRoom : r))
        );

        return nextRoom;
      });
    }, 1200);
  };

  // Create Open Chat Room Logic
  const handleCreateOpenChat = () => {
    if (!newRoomTitle.trim() || !newRoomDesc.trim()) return;

    const newRoom: OpenChatRoom = {
      id: 'oc_' + Date.now(),
      title: newRoomTitle,
      description: newRoomDesc,
      tags: [newRoomTag, '신설방', '응원'],
      membersCount: 1,
      maxMembers: newRoomLimit,
      lastMessage: '새로운 대화방이 개설되었습니다. 대화를 시작해 보세요!',
      lastMessageTime: '오후 6:00',
      avatarSymbol: ['⚾', '🔥', '🏆', '📣', '🤝'][Math.floor(Math.random() * 5)],
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      messages: [
        {
          id: 'm_init',
          senderId: 'system',
          senderName: '시스템',
          senderAvatar: null,
          content: `📢 '${newRoomTitle}' 오픈채팅방이 개설되었습니다! 매너있는 스포츠 문화를 만들어 갑시다.`,
          timestamp: new Date().toISOString()
        }
      ]
    };

    setOpenChatRooms([newRoom, ...openChatRooms]);
    setNewRoomTitle('');
    setNewRoomDesc('');
    setCreateModalOpen(false);
    
    // Automatically enter the newly created room
    setActiveOpenChat(newRoom);
  };

  // Filters open chat rooms based on search queries and category tags
  const filteredOpenChatRooms = openChatRooms.filter((room) => {
    const matchesSearch =
      room.title.toLowerCase().includes(openChatSearch.toLowerCase()) ||
      room.description.toLowerCase().includes(openChatSearch.toLowerCase()) ||
      room.tags.some((tag) => tag.toLowerCase().includes(openChatSearch.toLowerCase()));

    const matchesTag =
      selectedTag === '전체' ||
      room.tags.includes(selectedTag) ||
      (selectedTag === '인기' && room.membersCount >= 400) ||
      (selectedTag === '10구단 수다' && ['한화', '삼성', 'LG', 'KIA', '전구단'].some((t) => room.tags.includes(t)));

    return matchesSearch && matchesTag;
  });

  return (
    <>
      <GlobalHeader title="오픈채팅 & 쪽지" />

      {/* Tab Selector */}
      <div className="feed-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
        <button
          onClick={() => { setActiveTab('openchat'); setActiveOpenChat(null); }}
          className={`feed-tab ${activeTab === 'openchat' ? 'active' : ''}`}
          style={{ flex: 1, padding: '14px', fontWeight: 800, border: 'none', background: 'transparent', cursor: 'pointer', color: activeTab === 'openchat' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
        >
          💬 카카오톡 오픈채팅
        </button>
        <button
          onClick={() => { setActiveTab('dm'); setActiveChatUser(null); }}
          className={`feed-tab ${activeTab === 'dm' ? 'active' : ''}`}
          style={{ flex: 1, padding: '14px', fontWeight: 800, border: 'none', background: 'transparent', cursor: 'pointer', color: activeTab === 'dm' ? 'var(--primary-color)' : 'var(--text-secondary)' }}
        >
          ✉️ 1:1 쪽지
        </button>
      </div>

      <div
        className="messages-page-wrapper"
        style={{
          display: 'flex',
          height: 'calc(100vh - 53px - 53px - 45px)', // Adjusted height considering double headers
          backgroundColor: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-color)',
          overflow: 'hidden'
        }}
      >
        {/* ==========================================
           TAB 1: KAKAO OPEN CHAT LAYOUT
           ========================================== */}
        {activeTab === 'openchat' && (
          <div className="messages-layout-content" style={{ display: 'flex', width: '100%', height: '100%' }}>
            
            {/* 1. Open Chat Directory Grid (Sidebar on Desktop, Full Width on Mobile) */}
            {(!activeOpenChat || !isMobile) && (
              <div
                className="openchat-sidebar"
                style={{
                  width: isMobile ? '100%' : '380px',
                  borderRight: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                {/* Search & Category Filter */}
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>오픈채팅 탐색</h2>
                    <button
                      className="openchat-create-btn"
                      onClick={() => setCreateModalOpen(true)}
                    >
                      <i className="fas fa-plus" /> 방 만들기
                    </button>
                  </div>
                  
                  {/* Search Input */}
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '14px' }} />
                    <input
                      type="text"
                      placeholder="오픈채팅방 제목, 태그 검색..."
                      value={openChatSearch}
                      onChange={(e) => setOpenChatSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 36px',
                        borderRadius: '20px',
                        border: '1px solid var(--border-color)',
                        fontSize: '13px',
                        outline: 'none',
                        backgroundColor: 'var(--bg-secondary)',
                        fontFamily: 'inherit',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* HashTag Filters */}
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                    {['전체', '인기', '10구단 수다', '실시간응원', '포토카드', '양도'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '999px',
                          border: '1px solid var(--border-color)',
                          background: selectedTag === tag ? 'var(--primary-color)' : 'var(--bg-secondary)',
                          color: selectedTag === tag ? '#ffffff' : 'var(--text-secondary)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hot Banner (Horizontal Scroll) */}
                {openChatSearch === '' && selectedTag === '전체' && (
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div style={{ padding: '12px 16px 6px', fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>🔥 실시간 인기 오픈챗</div>
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '0 16px', scrollbarWidth: 'none' }}>
                      {openChatRooms.slice(0, 3).map((room) => (
                        <div
                          key={'banner_' + room.id}
                          onClick={() => setActiveOpenChat(room)}
                          style={{
                            minWidth: '220px',
                            width: '220px',
                            background: room.gradient,
                            color: '#ffffff',
                            padding: '14px',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            flexShrink: 0,
                            position: 'relative',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                          }}
                        >
                          <div style={{ fontSize: '20px', marginBottom: '8px' }}>{room.avatarSymbol}</div>
                          <div style={{ fontWeight: 800, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.title}</div>
                          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px', height: '32px', overflow: 'hidden' }}>{room.description}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '11px', fontWeight: 700 }}>
                            <span>#{room.tags[0]}</span>
                            <span>👥 {room.membersCount}명</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Directory List of Rooms */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <div style={{ padding: '12px 16px 4px', fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)' }}>지금 참여 가능한 오픈챗 ({filteredOpenChatRooms.length}개)</div>
                  {filteredOpenChatRooms.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      검색 조건에 맞는 오픈채팅방이 없습니다.
                    </div>
                  ) : (
                    filteredOpenChatRooms.map((room) => {
                      const isRoomActive = activeOpenChat?.id === room.id;
                      return (
                        <div
                          key={room.id}
                          onClick={() => setActiveOpenChat(room)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '14px 16px',
                            borderBottom: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            backgroundColor: isRoomActive ? 'var(--hover-bg)' : 'transparent',
                            transition: 'all 0.2s',
                          }}
                        >
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '16px',
                              background: room.gradient,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '24px',
                              color: '#ffffff',
                              flexShrink: 0
                            }}
                          >
                            {room.avatarSymbol}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <span style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {room.title}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{room.lastMessageTime}</span>
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                              {room.lastMessage}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-color)', backgroundColor: 'var(--hover-bg)', padding: '2px 6px', borderRadius: '4px' }}>
                                👥 {room.membersCount} / {room.maxMembers}
                              </span>
                              {room.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>#{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 2. Group Chat Room Panel (KakaoTalk Style) */}
            {(!isMobile || activeOpenChat) && (
              <div
                className="openchat-main-view"
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                {activeOpenChat ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }} className="kakao-chat-bg">
                    
                    {/* Kakao Chat Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        backgroundColor: 'var(--bg-primary)',
                        borderBottom: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isMobile && (
                          <button
                            onClick={() => setActiveOpenChat(null)}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '18px',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              marginRight: '8px',
                              padding: '4px',
                            }}
                          >
                            <i className="fas fa-arrow-left" />
                          </button>
                        )}
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '12px',
                            background: activeOpenChat.gradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            color: '#ffffff'
                          }}
                        >
                          {activeOpenChat.avatarSymbol}
                        </div>
                        <div>
                          <div style={{ fontWeight: 900, fontSize: '14.5px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {activeOpenChat.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>참여자 {activeOpenChat.membersCount}명 | #{activeOpenChat.tags.join(' #')}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
                        <i className="fas fa-search" style={{ cursor: 'pointer' }} />
                        <i className="fas fa-bars" style={{ cursor: 'pointer' }} />
                      </div>
                    </div>

                    {/* Kakao Safe Guideline Banner */}
                    <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', color: '#ffffff', padding: '6px 12px', fontSize: '11.5px', textAlign: 'center', fontWeight: 600 }}>
                      📢 욕설 및 비방 글 등록 시 즉각 차단되며, 10구단 야구팬의 클린한 응원 문화를 준수해 주세요.
                    </div>

                    {/* Kakao Chat Messages Area */}
                    <div
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                      }}
                    >
                      {activeOpenChat.messages.map((msg) => {
                        const isMe = msg.senderId === currentUserKey;
                        const isSystem = msg.senderId === 'system';

                        if (isSystem) {
                          return (
                            <div key={msg.id} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                              <div style={{ backgroundColor: 'rgba(0,0,0,0.15)', color: '#ffffff', borderRadius: '12px', padding: '4px 12px', fontSize: '12px', textAlign: 'center', maxWidth: '90%' }}>
                                {msg.content}
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg.id}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: isMe ? 'flex-end' : 'flex-start',
                              alignSelf: isMe ? 'flex-end' : 'flex-start',
                              maxWidth: '80%',
                            }}
                          >
                            {/* Sender Info for others */}
                            {!isMe && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <img
                                  src={msg.senderAvatar || 'https://i.pravatar.cc/150?u=anonymous'}
                                  alt={msg.senderName}
                                  style={{ width: '28px', height: '28px', borderRadius: '10px', objectFit: 'cover' }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {msg.senderName}
                                    {msg.senderTeam && (
                                      <span style={{ fontSize: '10px', fontWeight: 900, backgroundColor: 'rgba(29, 155, 240, 0.1)', color: 'var(--primary-color)', padding: '1px 4px', borderRadius: '3px' }}>
                                        {msg.senderTeam}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Bubble body and time */}
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                              <div className={isMe ? 'kakao-bubble-me' : 'kakao-bubble-other'}>
                                {msg.content}
                              </div>
                              <span style={{ fontSize: '9px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={openChatEndRef} />
                    </div>

                    {/* Kakao Chat Input Bar */}
                    <div
                      style={{
                        padding: '12px 16px',
                        borderTop: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-primary)',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                    >
                      <input
                        type="text"
                        value={openChatInput}
                        onChange={(e) => setOpenChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendOpenChat();
                        }}
                        placeholder="매너있는 대화를 나누어 보세요..."
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          borderRadius: '20px',
                          border: '1px solid var(--border-color)',
                          fontSize: '13px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          color: 'var(--text-primary)',
                          backgroundColor: 'var(--bg-secondary)',
                        }}
                      />
                      <button
                        onClick={handleSendOpenChat}
                        style={{
                          background: '#fee500',
                          color: '#000000',
                          border: 'none',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 800,
                        }}
                      >
                        <i className="fas fa-paper-plane" style={{ fontSize: '13px' }} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Kakao Open Chat Empty View (No room selected on Desktop) */
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
                        width: '80px',
                        height: '80px',
                        borderRadius: '28px',
                        backgroundColor: 'rgba(254, 229, 0, 0.2)',
                        color: '#eab308',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                        marginBottom: '16px',
                      }}
                    >
                      💬
                    </div>
                    <h3 style={{ fontWeight: 900, fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      카카오톡 오픈채팅방을 선택하세요
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '340px', margin: '0 auto', lineHeight: 1.5 }}>
                      지금 핫한 대화방을 선택해 함께 실시간 중계를 보며 응원하거나, 신규 오픈채팅방을 만들어 소통을 시작해 보세요!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Create Open Chat Room Modal */}
            {createModalOpen && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 200,
                  padding: '16px'
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '450px',
                    padding: '24px',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>새 오픈채팅방 개설</h3>
                    <i className="fas fa-times" style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '18px' }} onClick={() => setCreateModalOpen(false)} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>오픈채팅방 제목</label>
                    <input
                      type="text"
                      placeholder="예) 한화이글스 가을야구 행복회로 가동방"
                      value={newRoomTitle}
                      onChange={(e) => setNewRoomTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>대화방 설명</label>
                    <textarea
                      placeholder="참여자들에게 방을 설명해 주세요."
                      value={newRoomDesc}
                      onChange={(e) => setNewRoomDesc(e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontFamily: 'inherit',
                        resize: 'none',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>구단 태그</label>
                      <select
                        value={newRoomTag}
                        onChange={(e) => setNewRoomTag(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          fontFamily: 'inherit',
                          fontWeight: 700,
                        }}
                      >
                        <option value="전구단">전구단 (통합)</option>
                        <option value="한화">한화이글스</option>
                        <option value="삼성">삼성라이온즈</option>
                        <option value="LG">LG트윈스</option>
                        <option value="KIA">KIA타이거즈</option>
                        <option value="롯데">롯데자이언츠</option>
                        <option value="두산">두산베어스</option>
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '6px' }}>인원 제한</label>
                      <select
                        value={newRoomLimit}
                        onChange={(e) => setNewRoomLimit(Number(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          fontFamily: 'inherit',
                          fontWeight: 700,
                        }}
                      >
                        <option value={100}>100명</option>
                        <option value={300}>300명</option>
                        <option value={500}>500명</option>
                        <option value={1000}>1000명</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button
                      onClick={() => setCreateModalOpen(false)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      취소
                    </button>
                    <button
                      onClick={handleCreateOpenChat}
                      disabled={!newRoomTitle.trim() || !newRoomDesc.trim()}
                      style={{
                        flex: 2,
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, var(--primary-color) 0%, #1e40af 100%)',
                        color: '#ffffff',
                        fontWeight: 900,
                        cursor: 'pointer',
                        opacity: (!newRoomTitle.trim() || !newRoomDesc.trim()) ? 0.6 : 1
                      }}
                    >
                      방 개설하기
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ==========================================
           TAB 2: ORIGINAL 1:1 DIRECT MESSAGES LAYOUT
           ========================================== */}
        {activeTab === 'dm' && (
          <div className="messages-layout-content" style={{ display: 'flex', width: '100%', height: '100%' }}>
            
            {/* Left Side: Users list */}
            {(!isMobile || !activeChatUser) && (
              <div
                style={{
                  width: isMobile ? '100%' : '260px',
                  borderRight: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: 'var(--bg-primary)',
                  flexShrink: 0
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
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="1대1 대화상대 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 36px',
                        borderRadius: '20px',
                        border: '1px solid var(--border-color)',
                        fontSize: '13px',
                        outline: 'none',
                        backgroundColor: 'var(--bg-secondary)',
                        fontFamily: 'inherit',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                {/* Users List */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {loading && profiles.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <i className="fas fa-circle-notch fa-spin" style={{ marginRight: 6 }} /> 로딩 중...
                    </div>
                  ) : profiles.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      대화할 수 있는 사용자가 없습니다.
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
                            backgroundColor: isActive ? 'var(--hover-bg)' : 'transparent',
                            borderBottom: '1px solid var(--border-color)',
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
                                border: '2px solid var(--bg-primary)',
                              }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user.displayName || user.username}
                              </span>
                              {user.isVerified && (
                                <i className="fas fa-check-circle" style={{ color: '#3B82F6', fontSize: '12px' }} />
                              )}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

            {/* Right Side: Message Thread Pane */}
            {(!isMobile || activeChatUser) && (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: 'var(--bg-secondary)',
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
                        backgroundColor: 'var(--bg-primary)',
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
                          <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {activeChatUser.displayName || activeChatUser.username}
                            {activeChatUser.isVerified && (
                              <i className="fas fa-check-circle" style={{ color: '#3B82F6', fontSize: '12px' }} />
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>활동 중</div>
                        </div>
                      </div>
                    </div>

                    {/* Messages Container */}
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
                                  background: isMe ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--bg-primary)',
                                  color: isMe ? '#ffffff' : 'var(--text-primary)',
                                  padding: '8px 14px',
                                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                  fontSize: '13.5px',
                                  lineHeight: '1.4',
                                  whiteSpace: 'pre-wrap',
                                  border: isMe ? 'none' : '1px solid var(--border-color)',
                                }}
                              >
                                {msg.content}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: '9px',
                                color: 'var(--text-secondary)',
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
                        backgroundColor: 'var(--bg-primary)',
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
                          if (e.key === 'Enter') handleSendDM();
                        }}
                        placeholder="메시지 보내기..."
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          borderRadius: '20px',
                          border: '1px solid var(--border-color)',
                          fontSize: '13px',
                          outline: 'none',
                          fontFamily: 'inherit',
                          color: 'var(--text-primary)',
                          backgroundColor: 'var(--bg-secondary)',
                        }}
                      />
                      <button
                        onClick={handleSendDM}
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
                  /* DM Empty State Screen */
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
                    <h3 style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      대화할 상대를 선택하세요
                    </h3>
                    <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '300px', margin: '0 auto' }}>
                      쪽지 보낼 대상을 검색하여 새로운 대화를 시작해보세요.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
