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
  const [isPending, setIsPending] = useState(false);

  if (!session) return null;

  const handleSubmit = async () => {
    if (!content.trim() || isPending) return;
    
    const submittedContent = content; // Store for optimistic update
    setContent('');
    const target = document.getElementById('compose-textarea');
    if (target) target.style.height = 'auto';
    
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

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 400)}px`;
  };

  return (
    <section className="compose-trigger-section">
      <div className="compose-trigger expanded" style={{ cursor: 'default' }}>
        <div className="expanded-content" style={{ paddingLeft: 0, opacity: 1, display: 'block' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div 
              className="user-avatar small"
              style={{ width: '48px', height: '48px', flexShrink: 0, backgroundImage: session.user?.image ? `url(${session.user.image})` : undefined, backgroundSize: 'cover' }}
            />
            <div className="compose-input-area" style={{ flex: 1 }}>
              <textarea 
                id="compose-textarea"
                placeholder="무슨 일이 일어나고 있나요?"
                value={content}
                onChange={handleInput}
                maxLength={280}
                rows={1}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '17px',
                  resize: 'none',
                  minHeight: '40px',
                  fontFamily: 'inherit',
                  color: 'var(--text-primary)',
                  padding: '12px 0'
                }}
              />
            </div>
          </div>
          <div className="compose-actions" style={{ paddingLeft: '60px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="action-icons" style={{ display: 'flex', gap: '12px' }}>
              <i className="far fa-image" style={{ cursor: 'pointer', color: 'var(--primary-color)', fontSize: '20px' }} />
              <i className="far fa-smile" style={{ cursor: 'pointer', color: 'var(--primary-color)', fontSize: '20px' }} />
              <i className="far fa-calendar-alt" style={{ cursor: 'pointer', color: 'var(--primary-color)', fontSize: '20px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={handleSubmit}
                  disabled={!content.trim() || isPending}
                  className="inline-post-btn"
                  style={{ opacity: content.trim() ? 1 : 0.5, cursor: content.trim() ? 'pointer' : 'not-allowed' }}
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
