'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toggleLike, toggleRetweet } from '@/app/actions/post';
import { postPermalink } from '@/lib/post-url';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
    isLiked?: boolean;
    isRetweeted?: boolean;
    profiles: {
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      isVerified: boolean | null;
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
      {isDetailView && <style>{`.no-hover:hover { background-color: var(--bg-primary, #fff) !important; }`}</style>}
      <article
        className={`tweet ${isDetailView ? 'no-hover' : ''}`}
      role={suppressNavigation ? undefined : 'link'}
      tabIndex={suppressNavigation ? undefined : 0}
      onClick={suppressNavigation ? undefined : openPostDetail}
      onKeyDown={suppressNavigation ? undefined : (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPostDetail();
        }
      }}
      style={suppressNavigation ? { cursor: 'default' } : { cursor: 'pointer' }}
    >
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
            style={{ fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/@${post.profiles.username}`);
            }}
          >
            {post.profiles.displayName || '탐험가'}
          </span>
          {post.profiles.isVerified && (
            <i className="fas fa-check-circle verified" style={{ color: 'var(--primary-color)', fontSize: '14px', marginRight: '2px' }} />
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
          
          {/* Detail View Options Menu */}
          {isDetailView && (
            <div style={{ marginLeft: 'auto', position: 'relative' }}>
              <i 
                className="fas fa-ellipsis-h" 
                style={{ color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  alert('게시물 옵션: 수정, 삭제, 신고 등 (기능 개발 중)'); 
                }}
              />
            </div>
          )}
        </div>
        
        <div className="tweet-text" style={{ whiteSpace: 'pre-wrap' }}>
          {formatContent(displayContent)}
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
            <span>0</span>
          </div>
        </div>
      </div>
    </article>
    </>
  );
};


export default PostCard;
