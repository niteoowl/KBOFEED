'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { createPost } from '@/app/actions/post';

type ComposePostProps = {
  /** 게시 후 홈 피드 등에서 목록 갱신 */
  onPosted?: (newPostContent?: string) => void | Promise<void>;
};

const ComposePost = ({ onPosted }: ComposePostProps) => {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, setIsPending] = useState(false);

  if (!session) return null;

  const handleSubmit = async () => {
    if (!content.trim() || isPending) return;
    
    const submittedContent = content; // Store for optimistic update
    setContent('');
    setIsExpanded(false);
    
    // Optimistic update trigger (optional if parent supports it)
    onPosted?.(submittedContent);
    
    setIsPending(true);
    try {
      await createPost(submittedContent);
    } catch (e) {
      alert('게시글 작성 중 오류가 발생했습니다.');
      // rollback? but for simplicity we'll just alert
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section className="compose-trigger-section">
      <div className={`compose-trigger ${isExpanded ? 'expanded' : ''}`} onClick={() => !isExpanded && setIsExpanded(true)}>
        <div className="trigger-static-content">
          <div 
            className="user-avatar small"
            style={{ backgroundImage: session.user?.image ? `url(${session.user.image})` : undefined, backgroundSize: 'cover' }}
          />
          <div className="trigger-placeholder">오늘의 야구 소식은?</div>
          <div className="trigger-icon"><i className="far fa-image"></i></div>
        </div>

        <div className="expanded-content">
          <div className="compose-input-area">
            <textarea 
              placeholder="무슨 일이 일어나고 있나요?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
              maxLength={280}
              rows={4}
            />
          </div>
          <div className="compose-actions">
            <div className="action-icons">
              <i className="far fa-image" style={{ cursor: 'pointer', color: 'var(--primary-color)', fontSize: '20px' }} />
              <i className="far fa-smile" />
              <i className="far fa-calendar-alt" />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
                >
                  취소
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
                  disabled={!content.trim() || isPending}
                  className="inline-post-btn"
                >
                  {isPending ? '게시 중...' : '게시하기'}
                </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComposePost;
