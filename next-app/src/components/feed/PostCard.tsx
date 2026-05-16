'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toggleLike, toggleRetweet, deletePost, updatePost } from '@/app/actions/post';
import { postPermalink } from '@/lib/post-url';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getTeamLogo } from '@/lib/constants';

interface PostProps {
  /** 게시물 단일 페이지 등에서는 카드 클릭 네비게이션 끔 */
  suppressNavigation?: boolean;
  isDetailView?: boolean;
  post: {
    id: string;
    content: string | null;
    imageUrl: string | null;
    createdAt: string | null;
    likesCount: number | null;
    retweetsCount: number | null;
    commentsCount: number | null;
    viewsCount?: number | null;
    retweetId?: string | null;
    originalPost?: any;
    isLiked?: boolean;
    isRetweeted?: boolean;
    profiles: {
      id: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      isVerified: boolean | null;
      favoriteTeam?: string | null;
    };
  };
}

const PostCard = ({ post, suppressNavigation, isDetailView }: PostProps) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isRetweeted, setIsRetweeted] = useState(post.isRetweeted);
  const [retweetsCount, setRetweetsCount] = useState(post.retweetsCount || 0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (isDetailView) {
      import('@/app/actions/user').then(({ getProfile }) => {
        getProfile(post.profiles.username).then(profile => {
          if (profile) setIsFollowing(profile.isFollowing);
        });
      });
    }
  }, [isDetailView, post.profiles.username]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    await toggleLike(post.id);
  };

  const handleRetweet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newRetweeted = !isRetweeted;
    setIsRetweeted(newRetweeted);
    setRetweetsCount(prev => newRetweeted ? prev + 1 : Math.max(0, prev - 1));
    await toggleRetweet(post.id);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 댓글 클릭 시 게시물 상세 페이지로 이동 (댓글 작성 가능)
    router.push(detailHref);
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    // ISO format already has T and Z
    if (dateStr.includes('T') || dateStr.endsWith('Z')) return new Date(dateStr);
    // SQLite format: "2024-05-13 11:00:00" -> treat as UTC
    return new Date(dateStr.replace(' ', 'T') + 'Z');
  };

  const timeAgo = post.createdAt 
    ? formatDistanceToNow(parseDate(post.createdAt), { addSuffix: true, locale: ko })
    : '';

  const detailHref = postPermalink(post.profiles.username, post.id);

  const openPostDetail = () => {
    if (!suppressNavigation) router.push(detailHref);
  };

  const rawContent = post.content || '';
  const shouldTruncate = (suppressNavigation || isDetailView) ? false : rawContent.length > 150 || (rawContent.match(/\n/g) || []).length > 3;
  
  let displayContent = rawContent;
  if (shouldTruncate && !isExpanded) {
    const lines = rawContent.split('\n');
    if (lines.length > 4) {
      displayContent = lines.slice(0, 4).join('\n') + '...';
    } else {
      displayContent = rawContent.slice(0, 150) + '...';
    }
  }

  const formatContent = (text: string) => {
    return text.split(/(#[^\s#]+)/g).map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span 
            key={i} 
            style={{ color: 'var(--primary-color)', cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/search?q=${encodeURIComponent(part)}`);
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <>
      <style>{`
        .post-card-dropdown {
          position: absolute; top: 100%; right: 0; background: #fff; border: 1px solid #eee; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; zIndex: 10; width: 150px;
        }
        @media (max-width: 768px) {
          .mobile-bottom-sheet {
            position: fixed !important; top: auto !important; bottom: 0 !important; left: 0 !important; right: 0 !important;
            width: 100% !important; border-radius: 20px 20px 0 0 !important; box-shadow: 0 -4px 20px rgba(0,0,0,0.15) !important;
            z-index: 1000 !important; animation: slideUp 0.3s ease-out; padding-bottom: calc(safe-area-inset-bottom + 20px);
          }
          .mobile-backdrop {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999;
          }
        }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
      
      {/* Retweet Preview if it's a retweet */}
      {post.retweetId && post.originalPost && (
        <div style={{ padding: '12px 16px 0 36px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <i className="fas fa-retweet"></i>
          <span>{post.profiles.displayName}님이 리트윗했습니다</span>
        </div>
      )}

      {isDetailView && <style>{`.no-hover:hover { background-color: var(--bg-primary, #fff) !important; }`}</style>}
      <article
        className={`tweet ${isDetailView ? 'no-hover' : ''}`}
        style={{
          display: isDetailView ? 'block' : undefined,
          cursor: suppressNavigation ? 'default' : 'pointer'
        }}
      role={suppressNavigation ? undefined : 'link'}
      tabIndex={suppressNavigation ? undefined : 0}
      onClick={suppressNavigation ? undefined : openPostDetail}
      onKeyDown={suppressNavigation ? undefined : (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPostDetail();
        }
      }}
    >
      {isDetailView ? (
        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div 
              className="user-avatar"
              style={{ backgroundImage: post.profiles.avatarUrl ? `url(${post.profiles.avatarUrl})` : undefined, backgroundSize: 'cover', borderRadius: '50%', margin: 0, width: '40px', height: '40px', minWidth: '40px' }}
              onClick={(e) => { e.stopPropagation(); router.push(`/@${post.profiles.username}`); }}
            />
            <div style={{ marginLeft: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span 
                className="display-name" 
                style={{ fontWeight: 800, color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); router.push(`/@${post.profiles.username}`); }}
              >
                {post.profiles.displayName || '탐험가'}
                {post.profiles.favoriteTeam && (
                  <img src={getTeamLogo(post.profiles.favoriteTeam)} alt="team logo" style={{ width: '16px', height: '16px', marginLeft: '6px', objectFit: 'contain' }} />
                )}
                {post.profiles.isVerified && <i className="fas fa-check-circle verified" style={{ color: 'var(--primary-color)', fontSize: '15px', marginLeft: '4px' }} />}
              </span>
              <span 
                className="username" 
                style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}
                onClick={(e) => { e.stopPropagation(); router.push(`/@${post.profiles.username}`); }}
              >
                @{post.profiles.username}
              </span>
            </div>
            <button 
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const { toggleFollow } = await import('@/app/actions/user');
                  await toggleFollow(post.profiles.id);
                  setIsFollowing(!isFollowing);
                } catch (err) {
                  alert('로그인이 필요합니다.');
                }
              }}
              style={{ 
                background: isFollowing ? 'transparent' : '#111827', 
                color: isFollowing ? '#111827' : '#fff', 
                borderRadius: '999px', padding: '6px 14px', 
                border: isFollowing ? '1px solid #D1D5DB' : 'none', 
                fontWeight: 600, cursor: 'pointer', fontSize: '13px' 
              }}>
              {isFollowing ? '언팔로우' : '팔로우'}
            </button>
            <div style={{ position: 'relative', marginLeft: '12px' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
              >
                <i className="fas fa-ellipsis-h" />
              </button>
              {menuOpen && (
                <>
                  <div className="mobile-backdrop" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}></div>
                  <div className="post-card-dropdown mobile-bottom-sheet">
                    <div style={{ padding: '16px', cursor: 'pointer', color: '#ff4444', fontWeight: 600, fontSize: '15px' }} onClick={async (e) => { 
                      e.stopPropagation(); setMenuOpen(false); 
                      if (confirm('이 게시물을 삭제하시겠습니까?')) {
                        await deletePost(post.id);
                        router.push('/');
                      }
                    }}>
                      <i className="fas fa-trash" style={{ width: '24px' }}></i> 게시물 삭제
                    </div>
                    <div style={{ padding: '16px', cursor: 'pointer', fontWeight: 600, borderTop: '1px solid #f3f4f6', fontSize: '15px', color: 'var(--text-primary)' }} onClick={async (e) => { 
                      e.stopPropagation(); setMenuOpen(false); 
                      const newContent = prompt('수정할 내용을 입력하세요:', post.content || '');
                      if (newContent && newContent !== post.content) {
                        await updatePost(post.id, newContent);
                        window.location.reload();
                      }
                    }}>
                      <i className="fas fa-edit" style={{ width: '24px' }}></i> 게시물 수정
                    </div>
                    <div style={{ padding: '16px', cursor: 'pointer', fontWeight: 600, borderTop: '1px solid #f3f4f6', fontSize: '15px', color: 'var(--text-primary)' }} onClick={(e) => { e.stopPropagation(); alert('게시물 신고 완료'); setMenuOpen(false); }}>
                      <i className="fas fa-flag" style={{ width: '24px' }}></i> 게시물 신고
                    </div>
                    <div style={{ padding: '16px', cursor: 'pointer', fontWeight: 600, borderTop: '1px solid #f3f4f6', fontSize: '15px', textAlign: 'center', color: 'var(--text-secondary)' }} className="mobile-cancel" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}>
                      취소
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="tweet-text" style={{ whiteSpace: 'pre-wrap', marginTop: '16px', fontSize: '17px', color: 'var(--text-primary)' }}>
            {post.retweetId && post.originalPost ? formatContent(post.originalPost.content || '') : formatContent(displayContent)}
          </div>

          {post.imageUrl && (
            <div className="tweet-media" style={{ marginTop: '12px' }}>
              <img src={post.imageUrl} alt="미디어" style={{ borderRadius: '16px', width: '100%' }} />
            </div>
          )}

          {/* RT일 경우 아래에 원작자 표시 */}
          {post.retweetId && post.originalPost && (
            <div style={{ marginTop: '12px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
               <span style={{ fontWeight: 700 }}>{post.originalPost.profiles.displayName}</span>
               <span style={{ color: 'var(--text-secondary)' }}> @{post.originalPost.profiles.username}님의 글</span>
            </div>
          )}

          <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '15px' }}>
              {post.createdAt 
                ? `${parseDate(post.createdAt).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })} · ${parseDate(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}` 
                : '최근'}
            </span>
          </div>

          <div className="tweet-actions" style={{ padding: '12px 0 12px 0', display: 'flex', justifyContent: 'space-around', color: 'var(--text-secondary)' }}>
            <div className="action-item action-comment" onClick={handleComment} style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>
              <i className="far fa-comment" />
              <span>{post.commentsCount || 0}</span>
            </div>
            <div onClick={handleRetweet} className="action-item action-retweet" style={{ color: isRetweeted ? '#00ba7c' : undefined, flex: 1, textAlign: 'center', cursor: 'pointer' }}>
              <i className="fas fa-retweet" />
              <span>{retweetsCount}</span>
            </div>
            <div onClick={handleLike} className="action-item action-like" style={{ color: isLiked ? '#f91880' : undefined, flex: 1, textAlign: 'center', cursor: 'pointer' }}>
              <i className={`${isLiked ? 'fas' : 'far'} fa-heart`} />
              <span>{likesCount}</span>
            </div>
            <div className="action-item action-views" style={{ flex: 1, textAlign: 'center' }}>
              <i className="far fa-chart-bar" />
              <span>{post.viewsCount || 0}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div 
            className="user-avatar"
            style={{ backgroundImage: post.profiles.avatarUrl ? `url(${post.profiles.avatarUrl})` : undefined, backgroundSize: 'cover', borderRadius: '50%' }}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/@${post.profiles.username}`);
            }}
          />
          <div className="tweet-content">
            <div className="tweet-header" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <span 
                className="display-name" 
                style={{ fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/@${post.profiles.username}`);
                }}
              >
                {post.profiles.displayName || '탐험가'}
                {post.profiles.favoriteTeam && (
                  <img src={getTeamLogo(post.profiles.favoriteTeam)} alt="team logo" style={{ width: '16px', height: '16px', marginLeft: '4px', objectFit: 'contain' }} />
                )}
              </span>
              {post.profiles.isVerified && (
                <i className="fas fa-check-circle verified" style={{ color: 'var(--primary-color)', fontSize: '14px', marginLeft: '0px', marginRight: '2px' }} />
              )}
              <span 
                className="username" 
                style={{ color: 'var(--text-secondary)', marginLeft: '2px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/@${post.profiles.username}`);
                }}
              >
                @{post.profiles.username}
              </span>
              <span className="dot" style={{ color: 'var(--text-secondary)' }}>·</span>
              <span className="time" style={{ color: 'var(--text-secondary)' }}>{timeAgo}</span>
            </div>
            
            <div className="tweet-text" style={{ whiteSpace: 'pre-wrap' }}>
              {post.retweetId && post.originalPost ? formatContent(post.originalPost.content || '') : formatContent(displayContent)}
              {!isExpanded && shouldTruncate && (
                <span 
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                  style={{ color: 'var(--primary-color)', cursor: 'pointer', marginLeft: '6px', fontWeight: 'bold' }}
                >
                  더보기
                </span>
              )}
            </div>

            {post.imageUrl && (
              <div className="tweet-media">
                <img src={post.imageUrl} alt="게시물 이미지" />
              </div>
            )}

            <div className="tweet-actions">
              <div className="action-item action-comment" onClick={handleComment}>
                <i className="far fa-comment" />
                <span>{post.commentsCount || 0}</span>
              </div>
              <div
                onClick={handleRetweet}
                className="action-item action-retweet"
                style={{ color: isRetweeted ? '#00ba7c' : undefined }}
              >
                <i className="fas fa-retweet" />
                <span>{retweetsCount}</span>
              </div>
              <div
                onClick={handleLike}
                className="action-item action-like"
                style={{ color: isLiked ? '#f91880' : undefined }}
              >
                <i className={`${isLiked ? 'fas' : 'far'} fa-heart`} />
                <span>{likesCount}</span>
              </div>
              <div className="action-item action-views" onClick={(e) => e.stopPropagation()}>
                <i className="far fa-chart-bar" />
                <span>{post.viewsCount || 0}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </article>
    </>
  );
};


export default PostCard;
