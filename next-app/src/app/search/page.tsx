'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PostCard from '@/components/feed/PostCard';
import SearchHeader from '@/components/search/SearchHeader';
import { searchPosts, searchUsers } from '@/app/actions/post';

export const runtime = 'edge';

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'latest' | 'users' | 'media'>('all');
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // 게시물 검색
  useEffect(() => {
    if (!query) {
      setPosts([]);
      return;
    }
    setLoadingPosts(true);
    searchPosts(query)
      .then(data => setPosts(data))
      .catch(err => console.error(err))
      .finally(() => setLoadingPosts(false));
  }, [query]);

  // 사용자 검색
  useEffect(() => {
    if (!query) {
      setUsers([]);
      return;
    }
    setLoadingUsers(true);
    searchUsers(query)
      .then(data => setUsers(data))
      .catch(err => console.error(err))
      .finally(() => setLoadingUsers(false));
  }, [query]);

  const renderContent = () => {
    if (!query) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          검색어를 입력해 주세요.
        </div>
      );
    }

    const renderUser = (user: any) => (
      <div
        key={user.id}
        onClick={() => router.push(`/@${user.username}`)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          borderBottom: '1px solid var(--border-color)',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--hover-bg, rgba(255,255,255,0.03))')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
          <div
            className="user-avatar"
            style={{
              backgroundImage: user.avatarUrl
                ? `url(${user.avatarUrl})`
                : `url(https://i.pravatar.cc/150?u=${user.username})`,
              backgroundSize: 'cover',
              width: '48px',
              height: '48px',
              minWidth: '48px',
              borderRadius: '50%',
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '15px' }}>
                {user.displayName || user.username}
              </span>
              {user.isVerified && (
                <i className="fas fa-check-circle" style={{ color: 'var(--primary-color)', fontSize: '14px' }} />
              )}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>@{user.username}</div>
            {user.bio && (
              <p style={{ color: 'var(--text-primary)', fontSize: '14px', margin: '4px 0 0', lineHeight: 1.4 }}>
                {user.bio.slice(0, 100)}{user.bio.length > 100 ? '...' : ''}
              </p>
            )}
          </div>
        </div>
        <button 
          className="follow-btn"
          onClick={(e) => { e.stopPropagation(); }}
          style={{ padding: '6px 16px', fontSize: '13px' }}
        >
          팔로우
        </button>
      </div>
    );

    if (activeTab === 'users') {
      if (loadingUsers) {
        return <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>검색 중...</div>;
      }
      if (users.length === 0) {
        return (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            '{query}'에 대한 사용자 결과가 없습니다.
          </div>
        );
      }
      return (
        <div>
          {users.map(renderUser)}
        </div>
      );
    }

    // 게시물 탭들 (전체, 인기, 최신, 미디어)
    if (loadingPosts) {
      return <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>검색 중...</div>;
    }

    let filteredPosts = posts;
    if (activeTab === 'media') {
      filteredPosts = posts.filter(p => p.imageUrl);
    }

    if (filteredPosts.length === 0 && (activeTab !== 'all' || users.length === 0)) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <i className="fas fa-baseball-ball" style={{ fontSize: '48px', opacity: 0.1, marginBottom: '16px', display: 'block' }}></i>
          <p>'{query}'에 대한 검색 결과가 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="feed-content">
        {activeTab === 'all' && (!loadingUsers && users.length > 0) && (
          <div style={{ borderBottom: '8px solid var(--divider-color)' }}>
            {users.slice(0, 3).map(renderUser)}
            {users.length > 3 && (
              <div 
                onClick={() => setActiveTab('users')}
                style={{ padding: '16px', color: 'var(--primary-color)', cursor: 'pointer', textAlign: 'center', fontSize: '14px', fontWeight: 600 }}
              >
                더보기
              </div>
            )}
          </div>
        )}
        {filteredPosts.map((post: any) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    );
  };

  return (
    <>
      <SearchHeader initialQuery={query} title="검색 결과" />

      {/* Search Result Tabs */}
      <div className="feed-tabs search-tabs">
        <div className={`feed-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')} style={{ cursor: 'pointer' }}>전체</div>
        <div className={`feed-tab ${activeTab === 'popular' ? 'active' : ''}`} onClick={() => setActiveTab('popular')} style={{ cursor: 'pointer' }}>인기</div>
        <div className={`feed-tab ${activeTab === 'latest' ? 'active' : ''}`} onClick={() => setActiveTab('latest')} style={{ cursor: 'pointer' }}>최신</div>
        <div className={`feed-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')} style={{ cursor: 'pointer' }}>사용자</div>
        <div className={`feed-tab ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')} style={{ cursor: 'pointer' }}>미디어</div>
      </div>
      
      <div id="search-results-container" className="active" style={{ minHeight: '400px' }}>
        {renderContent()}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, textAlign: 'center' }}>로딩 중...</div>}>
      <SearchResults />
    </Suspense>
  );
}
