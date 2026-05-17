'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useProfile } from '@/context/ProfileContext';
import { createComment } from '@/app/actions/post';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import PostCard from '@/components/feed/PostCard';

interface CommentData {
  id: string;
  content: string;
  createdAt: string | null;
  userId: string;
  postId: string;
  profiles: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isVerified: boolean | null;
  };
}

interface CommentSectionProps {
  postId: string;
  initialComments: CommentData[];
  focusedCommentId?: string | null;
}

export default function CommentSection({ postId, initialComments, focusedCommentId }: CommentSectionProps) {
  const { data: session } = useSession();
  const { profile, displayName, avatarUrl } = useProfile();
  const router = useRouter();
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const focusedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusedCommentId && focusedRef.current) {
      setTimeout(() => {
        focusedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [focusedCommentId]);

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (dateStr.includes('T') || dateStr.endsWith('Z')) return new Date(dateStr);
    return new Date(dateStr.replace(' ', 'T') + 'Z');
  };

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }

    setSubmitting(true);
    try {
      // 낙관적 업데이트
      const optimisticId = Math.random().toString(36).substring(2, 10);
      const optimistic: CommentData = {
        id: optimisticId,
        content: text.trim(),
        createdAt: new Date().toISOString(),
        userId: session.user.id,
        postId,
        profiles: {
          id: session.user.id,
          username: (session.user as { username?: string }).username || 'user',
          displayName: profile?.displayName || displayName,
          avatarUrl: profile?.avatarUrl || avatarUrl,
          isVerified: false,
        },
      };
      setComments(prev => [optimistic, ...prev]);
      setText('');

      await createComment(postId, text.trim());
      
      // 서버 데이터 동기화
      router.refresh();
    } catch (err) {
      console.error('댓글 작성 실패:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-section" style={{ borderTop: '1px solid var(--border-color)' }}>
      {/* 댓글 작성 폼 */}
      {session?.user && (
        <div className="comment-compose" style={{
          display: 'flex',
          gap: '8px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          alignItems: 'flex-start',
        }}>
          <div
            className="user-avatar"
            style={{
              backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
              backgroundSize: 'cover',
              width: '40px',
              height: '40px',
              minWidth: '40px',
              borderRadius: '50%',
              marginRight: 0,
            }}
          />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="답글을 작성하세요..."
              style={{
                flex: 1,
                minHeight: '40px',
                padding: '8px 0',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '17px',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || submitting}
              style={{
                color: 'var(--primary-color)',
                background: 'transparent',
                border: 'none',
                fontWeight: 800,
                fontSize: '16px',
                opacity: text.trim() ? 1 : 0.5,
                cursor: text.trim() ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
                padding: '0 8px'
              }}
            >
              {submitting ? '전송...' : '답글'}
            </button>
          </div>
        </div>
      )}

      <div className="replies-list">
        {comments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            아직 답글이 없습니다. 첫 답글을 남겨보세요!
          </div>
        ) : (
          comments.map((comment) => {
            const commentAsPost = {
              id: String(comment.id),
              content: comment.content,
              createdAt: comment.createdAt,
              imageUrl: null,
              likesCount: 0,
              retweetsCount: 0,
              commentsCount: 0,
              profiles: comment.profiles
            };
            return (
              <div 
                key={comment.id}
                ref={String(comment.id) === focusedCommentId ? focusedRef : null}
                style={String(comment.id) === focusedCommentId ? { backgroundColor: 'var(--bg-secondary)', transition: 'background-color 0.5s' } : undefined}
              >
                <PostCard post={commentAsPost} suppressNavigation={false} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
