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
  post: {
    id: number;
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

const PostCard = ({ post, suppressNavigation }: PostProps) => {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isRetweeted, setIsRetweeted] = useState(post.isRetweeted);
  const [retweetsCount, setRetweetsCount] = useState(post.retweetsCount || 0);

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

  const timeAgo = post.createdAt 
    ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: ko })
    : '';

  const detailHref = postPermalink(post.profiles.username, post.id);

  const openPostDetail = () => {
    if (!suppressNavigation) router.push(detailHref);
  };

  return (
    <article
      className="tweet"
      role={suppressNavigation ? undefined : 'link'}
      tabIndex={suppressNavigation ? undefined : 0}
      onClick={suppressNavigation ? undefined : openPostDetail}
      onKeyDown={suppressNavigation ? undefined : (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPostDetail();
        }
      }}
      style={suppressNavigation ? { cursor: 'default' } : undefined}
    >
      <div 
        className="user-avatar"
        style={{ backgroundImage: post.profiles.avatarUrl ? `url(${post.profiles.avatarUrl})` : undefined, backgroundSize: 'cover' }}
      />
      <div className="tweet-content">
        <div className="tweet-header" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span className="display-name" style={{ fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            {post.profiles.displayName || '탐험가'}
          </span>
          {post.profiles.isVerified && (
            <i className="fas fa-check-circle verified" style={{ color: 'var(--primary-color)', fontSize: '14px', marginRight: '2px' }} />
          )}
          <span className="username" style={{ color: 'var(--text-secondary)', marginLeft: '2px' }}>
            @{post.profiles.username}
          </span>
          <span className="dot" style={{ color: 'var(--text-secondary)' }}>·</span>
          <span className="time" style={{ color: 'var(--text-secondary)' }}>{timeAgo}</span>
        </div>
        
        <div className="tweet-text">
          {post.content}
        </div>

        {post.imageUrl && (
          <div className="tweet-media">
            <img src={post.imageUrl} alt="게시물 이미지" />
          </div>
        )}

        <div className="tweet-actions">
          <div className="action-item action-comment" onClick={(e) => e.stopPropagation()}>
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
          <div className="action-item action-views">
            <i className="far fa-chart-bar" />
            <span>0</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
