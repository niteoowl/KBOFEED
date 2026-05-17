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
        className="menu-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 999,
          display: 'block',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      <div
        className="post-menu-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="post-menu-content">
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
          <button className="cancel-btn" onClick={(e) => { e.stopPropagation(); onClose(); }}>취소</button>
        </div>
      </div>

      <style jsx>{`
        /* 1. 기본값: 모바일 (바텀 시트) */
        .post-menu-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 8px;
        }

        .post-menu-content {
          background-color: #fff;
          border-radius: 16px;
          overflow: hidden;
          max-width: 500px;
          margin: 0 auto;
        }

        .post-menu-content button {
          display: block;
          width: 100%;
          padding: 16px;
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          border-bottom: 1px solid var(--border-color);
        }

        .post-menu-content button:last-child {
          border-bottom: none;
        }

        .cancel-btn {
          font-weight: bold;
          color: var(--text-secondary);
        }

        /* 2. 데스크톱 대응 (팝업 메뉴) */
        @media (min-width: 640px) {
          .menu-overlay {
            background-color: transparent !important;
          }

          .post-menu-container {
            position: absolute;
            top: 40px;
            right: 0;
            bottom: auto;
            left: auto;
            width: 180px;
            padding: 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            overflow: hidden;
          }

          .post-menu-content {
            border-radius: 0;
          }

          .post-menu-content button {
            padding: 12px 16px;
            font-size: 14px;
            text-align: left;
          }

          .cancel-btn {
            display: none !important; /* 데스크톱에서는 외부 클릭으로 닫으므로 취소 버튼 불필요 */
          }
        }
      `}</style>
    </>
  );
};

export default PostMenu;