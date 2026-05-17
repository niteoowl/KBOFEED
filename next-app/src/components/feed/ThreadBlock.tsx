'use client';

import PostCard from './PostCard';

interface ThreadBlockProps {
  parentPost: Parameters<typeof PostCard>[0]['post'];
  comment: {
    id: string;
    content: string;
    createdAt: string | null;
    profiles: {
      id?: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      isVerified?: boolean | null;
    };
  };
  onClick?: () => void;
}

export default function ThreadBlock({ parentPost, comment, onClick }: ThreadBlockProps) {
  return (
    <article className="thread-block" onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      <PostCard post={parentPost} suppressNavigation hideFollow showMenu={false} />
      <div className="thread-child">
        <div className="thread-connector" aria-hidden />
        <div className="thread-child-inner" style={{ gap: '8px' }}>
          <div
            className="user-avatar"
            style={{
              backgroundImage: comment.profiles?.avatarUrl
                ? `url(${comment.profiles.avatarUrl})`
                : `url(https://i.pravatar.cc/150?u=${comment.profiles?.username})`,
              backgroundSize: 'cover',
              width: 40,
              height: 40,
              minWidth: 40,
              borderRadius: '50%',
              marginRight: 0,
            }}
          />
          <div className="thread-child-content">
            <div className="thread-child-header">
              <span style={{ fontWeight: 700 }}>{comment.profiles?.displayName || '탐험가'}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}> @{comment.profiles?.username}</span>
            </div>
            <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.5 }}>
              {comment.content}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
