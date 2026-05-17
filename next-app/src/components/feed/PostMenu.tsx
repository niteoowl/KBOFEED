'use client';

import React from 'react';

interface PostMenuProps {
  open: boolean;
  onClose: () => void;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onReport: () => void;
}

const PostMenu = ({ open, onClose, isOwner, onEdit, onDelete, onPin, onReport }: PostMenuProps) => {
  if (!open) return null;

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    onClose();
  };

  return (
    <>
      <div
        className="unified-sheet-overlay"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      <div
        className="unified-sheet-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="unified-sheet-content">
          {isOwner ? (
            <>
              <button onClick={(e) => handleAction(e, onEdit)}>게시물 수정</button>
              <button onClick={(e) => handleAction(e, onPin)}>프로필에 고정</button>
              <button onClick={(e) => handleAction(e, onDelete)} style={{ color: '#ef4444', fontWeight: 'bold' }}>게시물 삭제</button>
            </>
          ) : (
            <>
              <button onClick={(e) => handleAction(e, () => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert('링크가 클립보드에 복사되었습니다.');
                }
              })}>링크 복사</button>
              <button onClick={(e) => handleAction(e, onReport)} style={{ color: '#ef4444', fontWeight: 'bold' }}>게시물 신고</button>
            </>
          )}
          <button className="unified-sheet-cancel" onClick={(e) => { e.stopPropagation(); onClose(); }}>취소</button>
        </div>
      </div>
    </>
  );
};

export default PostMenu;