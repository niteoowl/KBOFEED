'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { createPost } from '@/app/actions/post';

const ComposePost = () => {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, setIsPending] = useState(false);

  if (!session) return null;

  const handleSubmit = async () => {
    if (!content.trim() || isPending) return;
    
    setIsPending(true);
    try {
      await createPost(content);
      setContent('');
      setIsExpanded(false);
    } catch (e) {
      alert('게시글 작성 중 오류가 발생했습니다.');
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
            style={{ backgroundImage: session.user?.image ? `url(${session.user.image})` : undefined }}
          />
          {!isExpanded && <div className="trigger-placeholder">오늘의 야구 소식은?</div>}
          {!isExpanded && <div className="trigger-icon"><i className="far fa-image" /></div>}
        </div>

        {isExpanded && (
          <div className="expanded-content">
            <textarea 
              placeholder="무슨 일이 일어나고 있나요?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
            <div className="inline-actions">
              <div className="action-icons">
                <i className="far fa-image action-icon" />
                <i className="far fa-smile action-icon" />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer' }}
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
        )}
      </div>
    </section>

  );
};

export default ComposePost;
