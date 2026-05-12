'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toggleLike, toggleRetweet } from '@/app/actions/post';
import { useState } from 'react';

interface PostProps {
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

const PostCard = ({ post }: PostProps) => {
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

  return (
    <article className="tweet">
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

        <div className="tweet-actions" style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '425px', marginTop: '12px', color: 'var(--text-secondary)' }}>
          <div className="action-item action-comment" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <i className="far fa-comment" style={{ fontSize: '16px' }} /> 
            <span style={{ fontSize: '13px' }}>{post.commentsCount || 0}</span>
          </div>
          <div 
            onClick={handleRetweet}
            className="action-item action-retweet" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: isRetweeted ? '#00ba7c' : '' }}
          >
            <i className="fas fa-retweet" style={{ fontSize: '16px' }} /> 
            <span style={{ fontSize: '13px' }}>{retweetsCount}</span>
          </div>
          <div 
            onClick={handleLike}
            className="action-item action-like"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: isLiked ? '#f91880' : '' }}
          >
            <i className={`${isLiked ? 'fas' : 'far'} fa-heart`} style={{ fontSize: '16px' }} /> 
            <span style={{ fontSize: '13px' }}>{likesCount}</span>
          </div>
          <div className="action-item action-views" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="far fa-chart-bar" style={{ fontSize: '16px' }} /> 
            <span style={{ fontSize: '13px' }}>0</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
