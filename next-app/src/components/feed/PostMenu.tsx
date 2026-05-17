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

  // 메뉴를 닫거나 버튼을 누를 때 부모 카드 링크로 이동하지 않도록 차단하는 래퍼 함수
  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation(); // 중요: 카드 상세 페이지 이동 버블링을 완벽히 차단
    action();
    onClose();
  };

  return (
    <>
      {/* 배경 클릭 시 닫기 (Overlay) */}
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
          e.stopPropagation(); // 중요: 배경 눌러 닫을 때 상세페이지 이동 차단
          onClose();
        }}
      />

      {/* 메뉴 본체 */}
      <div
        className="post-menu-container"
        onClick={(e) => e.stopPropagation()} // 메뉴 흰 창 자체를 눌렀을 때도 전파 차단
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
                // 인스타그램 스타일 공유 기능 예시 (필요시 링크 복사 기능 등으로 커스텀 가능)
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
          animation: slideUp 0.25s ease-out;
        }

        .post-menu-content {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          max-width: 500px;
          margin: 0 auto;
        }

        button {
          width: 100%;
          padding: 14px;
          background: white;
          border: none;
          border-bottom: 1px solid #efefef;
          font-size: 15px;
          color: #262626;
          cursor: pointer;
          display: block;
          text-align: center;
        }

        button:last-child {
          border-bottom: none;
        }

        button:active {
          background-color: #fafafa;
        }

        .cancel-btn {
          font-weight: 500;
          color: #8e8e8e;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        /* 2. 데스크탑 (PC 화면에서는 버튼 옆 팝업으로) */
        @media (min-width: 640px) {
          .menu-overlay {
            background-color: transparent !important;
          }
          .post-menu-container {
            position: absolute;
            top: 100%;
            right: 0;
            bottom: auto;
            left: auto;
            padding: 0;
            width: 170px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: 1px solid #dbdbdb;
            border-radius: 8px;
            animation: none;
          }
          .post-menu-content {
            border-radius: 8px;
          }
          button {
            padding: 10px 16px;
            font-size: 14px;
            text-align: left;
          }
        }
      `}</style>
    </>
  );
};

export default PostMenu;