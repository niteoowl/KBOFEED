'use client';

import React from 'react';

interface ShareMenuProps {
  open: boolean;
  onClose: () => void;
  url: string;
  postText: string;
}

const ShareMenu = ({ open, onClose, url, postText }: ShareMenuProps) => {
  if (!open) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`[KBOFeed] ${postText.slice(0, 30)}...`);

  // 기능 동작용 핸들러 (이벤트 전파 완전 차단)
  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    onClose();
  };

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      alert('링크가 클립보드에 복사되었습니다! 📋');
    } else {
      alert('이 브라우저에서는 복사를 지원하지 않습니다.');
    }
  };

  return (
    <>
      {/* 배경 어둡게 */}
      <div
        className="share-overlay"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* 공유 바텀 모달 / PC 팝업 */}
      <div className="share-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <div className="handle-bar" />
          <h3>공유하기</h3>
        </div>

        {/* 1. 소셜 공유 가로 스크롤 섹션 */}
        <div className="social-share-row">
          <div className="social-item" onClick={(e) => handleAction(e, copyToClipboard)}>
            <div className="icon-circle bg-gray">
              <i className="fas fa-link" />
            </div>
            <span>링크 복사</span>
          </div>

          <div className="social-item" onClick={(e) => handleAction(e, () => window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`))}>
            <div className="icon-circle bg-black">
              <i className="fab fa-twitter" />
            </div>
            <span>X (트위터)</span>
          </div>

          <div className="social-item" onClick={(e) => handleAction(e, () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`))}>
            <div className="icon-circle bg-blue">
              <i className="fab fa-facebook-f" />
            </div>
            <span>페이스북</span>
          </div>

          <div className="social-item" onClick={(e) => handleAction(e, () => window.open(`https://story.kakao.com/s/share?url=${encodedUrl}`))}>
            <div className="icon-circle bg-yellow">
              <i className="fas fa-comment-comment" style={{ color: '#3A1D1D' }} />
            </div>
            <span>카카오스토리</span>
          </div>
        </div>

        {/* 2. 하단 추가 액션 목록 */}
        <div className="action-list">
          <button onClick={(e) => handleAction(e, () => window.open(`mailto:?subject=KBOFeed 게시물 공유&body=${encodedText}%0A${encodedUrl}`))}>
            <i className="far fa-envelope" /> 이메일로 전송
          </button>
          <button onClick={(e) => handleAction(e, () => alert('북마크에 저장되었습니다.'))}>
            <i className="far fa-bookmark" /> 북마크에 추가
          </button>
          <button className="cancel-btn" onClick={(e) => handleAction(e, onClose)}>
            취소
          </button>
        </div>
      </div>

      <style jsx>{`
        .share-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          backgroundColor: rgba(0, 0, 0, 0.4);
          z-index: 1000;
        }

        /* 모바일 바텀시트 기본 디자인 */
        .share-modal-container {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          background: white;
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
          z-index: 1001;
          padding: 16px 0;
          animation: slideUp 0.25s ease-out;
          color: #262626;
        }

        .share-modal-header {
          text-align: center;
          padding-bottom: 12px;
          border-bottom: 1px solid #f2f2f2;
        }

        .handle-bar {
          width: 36px; height: 4px;
          background: #dbdbdb;
          border-radius: 2px;
          margin: 0 auto 8px;
        }

        .share-modal-header h3 {
          margin: 0; font-size: 16px; font-weight: 600;
        }

        /* 가로 스크롤 소셜 영역 */
        .social-share-row {
          display: flex;
          overflow-x: auto;
          padding: 20px 16px;
          gap: 20px;
          border-bottom: 1px solid #f2f2f2;
        }
        .social-share-row::-webkit-scrollbar {
          display: none; /* 스크롤바 숨김 */
        }

        .social-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          min-width: 60px;
        }

        .icon-circle {
          width: 48px; height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justifyContent: center;
          font-size: 18px;
          color: white;
          margin-bottom: 8px;
        }

        .bg-gray { background: #f0f2f5; color: #1c1e21; }
        .bg-black { background: #0f1419; }
        .bg-blue { background: #1877f2; }
        .bg-yellow { background: #fee500; }

        .social-item span {
          font-size: 12px;
          color: #65676b;
          white-space: nowrap;
        }

        /* 리스트 메뉴 영역 */
        .action-list {
          padding-top: 8px;
        }

        .action-list button {
          width: 100%;
          padding: 14px 20px;
          background: white;
          border: none;
          font-size: 15px;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .action-list button:active {
          background: #fafafa;
        }

        .action-list button i {
          font-size: 18px;
          color: #262626;
          width: 24px;
        }

        .cancel-btn {
          border-top: 1px solid #f2f2f2 !important;
          color: #ef4444 !important;
          font-weight: 600;
          justify-content: center;
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        /* 데스크탑 웹 팝업으로 변환 */
        @media (min-width: 640px) {
          .share-overlay { background: transparent; }
          .share-modal-container {
            position: absolute;
            top: 40px; right: 12px; bottom: auto; left: auto;
            width: 280px;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.15);
            border: 1px solid #e3e8ed;
            padding: 12px 0;
            animation: none;
          }
          .handle-bar { display: none; }
          .share-modal-header { display: none; }
          .social-share-row { padding: 12px; gap: 12px; }
          .icon-circle { width: 38px; height: 38px; font-size: 14px; }
          .action-list button { padding: 10px 16px; font-size: 13px; }
          .action-list button i { font-size: 15px; }
        }
      `}</style>
    </>
  );
};

export default ShareMenu;