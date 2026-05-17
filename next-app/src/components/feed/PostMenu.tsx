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
          display: 'block', // 기본적으로 모바일에서 보임
        }}
        onClick={onClose}
      />

      {/* 메뉴 본체 */}
      <div className="post-menu-container">
        <div className="post-menu-content">
          {isOwner ? (
            <>
              <button onClick={() => { onEdit(); onClose(); }}>게시물 수정</button>
              <button onClick={() => { onPin(); onClose(); }}>프로필에 고정</button>
              <button onClick={() => { onDelete(); onClose(); }} style={{ color: '#ef4444', fontWeight: 'bold' }}>게시물 삭제</button>
            </>
          ) : (
            <button onClick={() => { onReport(); onClose(); }} style={{ color: '#ef4444', fontWeight: 'bold' }}>게시물 신고</button>
          )}
          <button className="cancel-btn" onClick={onClose}>취소</button>
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
          animation: slideUp 0.3s ease-out;
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
          padding: 14px; /* 높이 낮춤 */
          background: white;
          border: none;
          border-bottom: 1px solid #efefef;
          font-size: 15px;
          color: #262626;
          cursor: pointer;
          display: block;
          text-align: center; /* 정렬 일치 */
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
            background-color: transparent !important; /* PC는 배경 어둡게 안함 */
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
            text-align: left; /* PC에서는 왼쪽 정렬이 더 깔끔함 */
          }
        }
      `}</style>
    </>
  );
};

export default PostMenu;