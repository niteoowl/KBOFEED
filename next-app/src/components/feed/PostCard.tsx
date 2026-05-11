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
    <article className="tweet border-b border-zinc-100 p-4 hover:bg-zinc-50/50 transition-colors cursor-pointer">
      <div 
        className="user-avatar w-12 h-12 rounded-2xl bg-zinc-200 mr-3 flex-shrink-0 bg-cover"
        style={{ backgroundImage: post.profiles.avatarUrl ? `url(${post.profiles.avatarUrl})` : undefined }}
      />
      <div className="tweet-content flex-1 min-w-0">
        <div className="tweet-header flex items-center gap-1 mb-1">
          <span className="display-name font-extrabold text-zinc-900 truncate">
            {post.profiles.displayName || '탐험가'}
          </span>
          {post.profiles.isVerified && (
            <i className="fas fa-check-circle text-primary text-sm" />
          )}
          <span className="username text-zinc-500 text-sm truncate ml-1">
            @{post.profiles.username}
          </span>
          <span className="dot text-zinc-400">·</span>
          <span className="time text-zinc-500 text-sm">{timeAgo}</span>
        </div>
        
        <div className="tweet-text text-zinc-900 leading-relaxed whitespace-pre-wrap mb-3">
          {post.content}
        </div>

        {post.imageUrl && (
          <div className="tweet-media rounded-2xl overflow-hidden border border-zinc-100 mb-3">
            <img src={post.imageUrl} alt="Post media" className="w-full h-auto" />
          </div>
        )}

        <div className="tweet-actions flex justify-between max-w-md text-zinc-500">
          <div className="flex items-center gap-2 hover:text-blue-500 transition-colors group">
            <div className="p-2 group-hover:bg-blue-50 rounded-full">
              <i className="far fa-comment" />
            </div>
            <span className="text-sm">{post.commentsCount || 0}</span>
          </div>
          <div 
            onClick={handleRetweet}
            className={`flex items-center gap-2 hover:text-green-500 transition-colors group ${isRetweeted ? 'text-green-500' : ''}`}
          >
            <div className="p-2 group-hover:bg-green-50 rounded-full">
              <i className="fas fa-retweet" />
            </div>
            <span className="text-sm">{retweetsCount}</span>
          </div>
          <div 
            onClick={handleLike}
            className={`flex items-center gap-2 hover:text-pink-500 transition-colors group ${isLiked ? 'text-pink-500' : ''}`}
          >
            <div className="p-2 group-hover:bg-pink-50 rounded-full">
              <i className={`${isLiked ? 'fas' : 'far'} fa-heart`} />
            </div>
            <span className="text-sm">{likesCount}</span>
          </div>
          <div className="flex items-center gap-2 hover:text-blue-500 transition-colors group">
            <div className="p-2 group-hover:bg-blue-50 rounded-full">
              <i className="far fa-chart-bar" />
            </div>
            <span className="text-sm">0</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
