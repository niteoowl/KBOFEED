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
    <section className="compose-trigger-section border-b-8 border-zinc-50 p-3">
      <div className={`compose-trigger bg-zinc-50 p-3 rounded-3xl transition-all ${isExpanded ? 'expanded' : ''}`} onClick={() => !isExpanded && setIsExpanded(true)}>
        <div className="trigger-static-content flex items-center mb-0">
          <div 
            className="user-avatar small w-8 h-8 rounded-xl bg-zinc-200 mr-3 bg-cover"
            style={{ backgroundImage: session.user?.image ? `url(${session.user.image})` : undefined }}
          />
          {!isExpanded && <div className="trigger-placeholder text-zinc-500 text-sm font-medium">오늘의 야구 소식은?</div>}
          {!isExpanded && <div className="trigger-icon ml-auto text-primary opacity-70"><i className="far fa-image" /></div>}
        </div>

        {isExpanded && (
          <div className="expanded-content mt-3 pl-11">
            <textarea 
              className="w-full bg-transparent border-none outline-none text-lg resize-none min-h-[100px]"
              placeholder="무슨 일이 일어나고 있나요?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
            />
            <div className="compose-actions flex justify-between items-center mt-3 pt-3 border-t border-zinc-100">
              <div className="action-icons flex gap-4 text-primary text-xl">
                <i className="far fa-image cursor-pointer hover:opacity-70" />
                <i className="far fa-smile cursor-pointer hover:opacity-70" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                  className="px-4 py-2 text-zinc-500 font-bold text-sm"
                >
                  취소
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleSubmit(); }}
                  disabled={!content.trim() || isPending}
                  className="px-5 py-2 bg-primary text-white rounded-full font-bold text-sm disabled:opacity-50"
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
