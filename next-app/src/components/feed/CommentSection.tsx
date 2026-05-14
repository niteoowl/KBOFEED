'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { createComment } from '@/app/actions/post';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface CommentData {
  id: number;
  content: string;
  createdAt: string | null;
  userId: string;
  postId: string;
  profiles: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isVerified: boolean | null;
  };
}

interface CommentSectionProps {
  postId: string;
  initialComments: CommentData[];
}

export default function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      const optimistic: CommentData = {
        id: Date.now(),
        content: text.trim(),
        createdAt: new Date().toISOString(),
        userId: session.user.id,
        postId,
        profiles: {
          username: (session.user as any).username || session.user.name || 'user',
          displayName: session.user.name || '사용자',
          avatarUrl: session.user.image || null,
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
          gap: '12px',
          padding: '16px',
          borderBottom: '1px solid var(--border-color)',
          alignItems: 'flex-start',
        }}>
          <div
            className="user-avatar"
            style={{
              backgroundImage: session.user.image ? `url(${session.user.image})` : undefined,
              backgroundSize: 'cover',
              width: '36px',
              height: '36px',
              minWidth: '36px',
              borderRadius: '50%',
            }}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="답글을 작성하세요..."
              style={{
                width: '100%',
                minHeight: '40px',
                padding: '12px 0 0 0',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '17px',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '12px', marginTop: '4px' }}>
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
                className="inline-post-btn"
                style={{
                  opacity: text.trim() ? 1 : 0.5,
                  cursor: text.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                {submitting ? '전송 중...' : '답글'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 댓글 목록 */}
      <div className="replies-list">
        {comments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            아직 답글이 없습니다. 첫 답글을 남겨보세요!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="comment-item"
              style={{
                display: 'flex',
                gap: '12px',
                padding: '16px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div
                className="user-avatar"
                style={{
                  backgroundImage: comment.profiles.avatarUrl
                    ? `url(${comment.profiles.avatarUrl})`
                    : `url(https://i.pravatar.cc/150?u=${comment.profiles.username})`,
                  backgroundSize: 'cover',
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
                onClick={() => router.push(`/@${comment.profiles.username}`)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span
                    style={{ fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                    onClick={() => router.push(`/@${comment.profiles.username}`)}
                  >
                    {comment.profiles.displayName || '탐험가'}
                  </span>
                  {comment.profiles.isVerified && (
                    <i className="fas fa-check-circle" style={{ color: 'var(--primary-color)', fontSize: '13px' }} />
                  )}
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    @{comment.profiles.username}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>·</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {comment.createdAt
                      ? formatDistanceToNow(parseDate(comment.createdAt), { addSuffix: true, locale: ko })
                      : ''}
                  </span>
                </div>
                <p style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {comment.content}
                </p>
                <div className="tweet-actions" style={{ marginTop: '12px', display: 'flex', gap: '32px', color: 'var(--text-secondary)' }}>
                  <div className="action-item" style={{ cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <i className="far fa-comment"></i>
                    <span style={{ fontSize: '13px' }}>답글 남기기</span>
                  </div>
                  <div className="action-item" style={{ cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <i className="far fa-heart"></i>
                    <span style={{ fontSize: '13px' }}>좋아요</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
