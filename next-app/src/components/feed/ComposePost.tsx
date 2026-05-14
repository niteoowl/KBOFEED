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
    <section className="compose-trigger-section" style={{ padding: '16px 20px', borderBottom: '8px solid var(--divider-color)', backgroundColor: '#fff' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div 
          className="user-avatar"
          style={{ backgroundImage: session.user?.image ? `url(${session.user.image})` : undefined, backgroundSize: 'cover', width: '44px', height: '44px', minWidth: '44px', borderRadius: '50%' }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <textarea 
            placeholder="무슨 일이 일어나고 있나요?"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            style={{
              width: '100%', border: 'none', outline: 'none', background: 'transparent',
              fontSize: '18px', resize: 'none', overflowY: 'auto', maxHeight: '400px', minHeight: '60px',
              fontFamily: 'inherit', color: 'var(--text-primary)', paddingTop: '8px'
            }}
          />
          <div className="compose-actions" style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="action-icons" style={{ display: 'flex', gap: '16px', color: 'var(--primary-color)' }}>
              <i className="far fa-image" style={{ cursor: 'pointer', fontSize: '20px' }} />
              <i className="far fa-smile" style={{ cursor: 'pointer', fontSize: '20px' }} />
              <i className="far fa-calendar-alt" style={{ cursor: 'pointer', fontSize: '20px' }} />
            </div>
            <button 
              onClick={handleSubmit}
              disabled={!content.trim() || isPending}
              className="inline-post-btn"
              style={{ 
                padding: '8px 20px', fontSize: '15px', borderRadius: '9999px', border: 'none', 
                backgroundColor: content.trim() ? 'var(--primary-color)' : 'var(--primary-color-dim, #1d4ed8)', 
                color: '#fff', fontWeight: 'bold', cursor: content.trim() ? 'pointer' : 'default', 
                opacity: content.trim() ? 1 : 0.5, transition: '0.2s' 
              }}
            >
              {isPending ? '게시 중...' : '게시하기'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComposePost;
