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
        style={{ backgroundImage: post.profiles.avatarUrl ? `url(${post.profiles.avatarUrl})` : undefined }}
      />
      <div className="tweet-content">
        <div className="tweet-header">
          <span className="display-name">
            {post.profiles.displayName || '탐험가'}
          </span>
          {post.profiles.isVerified && (
            <i className="fas fa-check-circle verified" style={{ color: 'var(--primary-color)', fontSize: '14px', marginLeft: '4px' }} />
          )}
          <span className="username">
            @{post.profiles.username}
          </span>
          <span className="dot">·</span>
          <span className="time">{timeAgo}</span>
        </div>
        
        <div className="tweet-text">
          {post.content}
        </div>

        {post.imageUrl && (
          <div className="tweet-media">
            <img src={post.imageUrl} alt="Post media" />
          </div>
        )}

        <div className="tweet-footer">
          <div className="nav-item">
            <i className="far fa-comment" />
            <span className="label">{post.commentsCount || 0}</span>
          </div>
          <div 
            onClick={handleRetweet}
            className={`nav-item rt ${isRetweeted ? 'active' : ''}`}
          >
            <i className="fas fa-retweet" />
            <span className="label">{retweetsCount}</span>
          </div>
          <div 
            onClick={handleLike}
            className={`nav-item like ${isLiked ? 'active' : ''}`}
          >
            <i className={`${isLiked ? 'fas' : 'far'} fa-heart`} />
            <span className="label">{likesCount}</span>
          </div>
          <div className="nav-item">
            <i className="far fa-chart-bar" />
            <span className="label">0</span>
          </div>
        </div>
      </div>
    </article>

  );
};

export default PostCard;
