'use client';

import React, { useState } from 'react';

interface PostMenuProps {
  open: boolean;
  onClose: () => void;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onReport: () => void;
  // New sharing and bookmarking props
  url?: string;
  postContent?: string;
  isBookmarked?: boolean;
  onBookmark?: () => void;
}

const PostMenu = ({
  open,
  onClose,
  isOwner,
  onEdit,
  onDelete,
  onPin,
  onReport,
  url = '',
  postContent = '',
  isBookmarked = false,
  onBookmark,
}: PostMenuProps) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!open) return null;

  // Absolute post sharing link
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
  const shareText = postContent
    ? postContent.length > 100
      ? postContent.substring(0, 100) + '...'
      : postContent
    : 'KBO FEED 게시글';

  // Toast trigger helper
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2200);
  };

  // Safe action wrapper
  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    onClose();
  };

  // 1. Copy Link Action
  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrl);
      triggerToast('링크가 클립보드에 복사되었습니다! 🔗');
      setTimeout(() => onClose(), 1200);
    } catch {
      triggerToast('링크 복사에 실패했습니다. 😢');
    }
  };

  // 2. Bookmark Action
  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookmark) {
      onBookmark();
      triggerToast(isBookmarked ? '북마크가 해제되었습니다! 📂' : '북마크에 추가되었습니다! ⭐');
      setTimeout(() => onClose(), 1200);
    }
  };

  // SNS Social Share triggers
  const shareToSocial = (e: React.MouseEvent, platform: string) => {
    e.stopPropagation();
    let shareLink = '';

    switch (platform) {
      case 'kakao':
        shareLink = `https://story.kakao.com/s/share?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'x':
        shareLink = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'line':
        shareLink = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'band':
        shareLink = `https://band.us/plugin/share?body=${encodeURIComponent(shareText + '\n' + shareUrl)}`;
        break;
      case 'system':
        if (navigator.share) {
          navigator
            .share({
              title: 'KBO FEED',
              text: shareText,
              url: shareUrl,
            })
            .catch(() => {});
          onClose();
          return;
        } else {
          // Fallback to copy link
          handleCopyLink(e);
          return;
        }
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  return (
    <>
      {/* Toast Notification container */}
      {toastMessage && (
        <div className="toast-notification" onClick={(e) => e.stopPropagation()}>
          <div className="toast-content">
            <i className="fas fa-check-circle" style={{ color: 'var(--primary-color, #0241D3)', marginRight: '8px', fontSize: '15px' }} />
            {toastMessage}
          </div>
        </div>
      )}

      {/* Backdrop overlay */}
      <div
        className="menu-overlay"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Sheet / Dialog main body */}
      <div className="post-menu-container" onClick={(e) => e.stopPropagation()}>
        <div className="post-menu-content">
          {/* Mobile indicator line */}
          <div className="sheet-indicator" />
          
          <div className="sheet-title">게시물 공유 및 관리</div>

          {/* 1. SNS Share row */}
          <div className="share-section">
            <div className="share-section-title">SNS로 공유하기</div>
            <div className="share-social-list">
              {/* Kakao Talk */}
              <div className="share-social-item" onClick={(e) => shareToSocial(e, 'kakao')}>
                <div className="share-social-icon-wrapper" style={{ backgroundColor: '#FEE500' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#3A1D1D">
                    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.707 4.8 4.316 6.012l-.888 3.277c-.114.423.14.838.56.924.15.03.3.018.435-.04l3.86-2.545c.563.087 1.138.132 1.717.132 4.97 0 9-3.186 9-7.115C21 6.185 16.97 3 12 3z" />
                  </svg>
                </div>
                <span className="share-social-name">카카오스토리</span>
              </div>

              {/* X / Twitter */}
              <div className="share-social-item" onClick={(e) => shareToSocial(e, 'x')}>
                <div className="share-social-icon-wrapper" style={{ backgroundColor: '#000000' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="#FFFFFF">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <span className="share-social-name">X (트위터)</span>
              </div>

              {/* Facebook */}
              <div className="share-social-item" onClick={(e) => shareToSocial(e, 'facebook')}>
                <div className="share-social-icon-wrapper" style={{ backgroundColor: '#1877F2' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#FFFFFF">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <span className="share-social-name">페이스북</span>
              </div>

              {/* Line */}
              <div className="share-social-item" onClick={(e) => shareToSocial(e, 'line')}>
                <div className="share-social-icon-wrapper" style={{ backgroundColor: '#06C755' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#FFFFFF">
                    <path d="M12 2C6.48 2 2 5.58 2 9.99c0 3.93 3.56 7.23 8.38 7.91.33.07.78.22.89.51.1.26.07.67-.04.99l-.47 2.06c-.05.23-.25.89 1.09.49 1.34-.4 7.21-4.24 9.84-7.27C21.77 12.63 22 11.35 22 9.99 22 5.58 17.52 2 12 2zm-4.7 10.37H6.1c-.28 0-.5-.22-.5-.5v-3.7c0-.28.22-.5.5-.5h.3c.28 0 .5.22.5.5v3.2h.9c.28 0 .5.22.5.5v.2c0 .28-.22.5-.5.5zm2.7 0h-.3c-.28 0-.5-.22-.5-.5v-3.7c0-.28.22-.5.5-.5h.3c.28 0 .5.22.5.5v3.7c0 .28-.22.5-.5.5zm3.6 0h-.3c-.23 0-.41-.15-.47-.36l-1.39-2.31v2.17c0 .28-.22.5-.5.5h-.3c-.28 0-.5-.22-.5-.5v-3.7c0-.28.22-.5.5-.5h.3c.23 0 .42.15.47.37l1.39 2.3v-2.17c0-.28.22-.5.5-.5h.3c.28 0 .5.22.5.5v3.7c0 .28-.22.5-.5.5zm3.5-1.2h.9c.28 0 .5.22.5.5v.2c0 .28-.22.5-.5.5h-1.7c-.28 0-.5-.22-.5-.5v-3.7c0-.28.22-.5.5-.5h1.7c.28 0 .5.22.5.5v.2c0 .28-.22.5-.5.5h-.9v.7h.8c.28 0 .5.22.5.5v.2c0 .28-.22.5-.5.5h-.8v.7z" />
                  </svg>
                </div>
                <span className="share-social-name">라인</span>
              </div>

              {/* Naver Band */}
              <div className="share-social-item" onClick={(e) => shareToSocial(e, 'band')}>
                <div className="share-social-icon-wrapper" style={{ backgroundColor: '#00C73C' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#FFFFFF">
                    <path d="M12.001 2C6.478 2 2 6.477 2 12c0 5.522 4.478 10 10.001 10C17.523 22 22 17.522 22 12c0-5.523-4.477-10-9.999-10zm2.257 14.62c-.782.782-1.792 1.173-2.8 1.173-1.009 0-2.019-.39-2.8-1.173a3.96 3.96 0 0 1-1.172-2.8c0-1.009.39-2.019 1.172-2.8.781-.782 1.791-1.172 2.8-1.172 1.008 0 2.018.39 2.8 1.172a3.96 3.96 0 0 1 1.172 2.8c0 1.009-.39 2.019-1.172 2.8zm.563-6.602c-.39-.39-.884-.66-1.428-.781.168-.21.365-.407.568-.61l.03-.03a.526.526 0 0 0 0-.743l-.935-.935a.526.526 0 0 0-.743 0l-.133.133a7.3 7.3 0 0 0-.61.568c-.121-.544-.391-1.037-.781-1.427a2.531 2.531 0 0 0-3.58 0c-.987.987-.987 2.593 0 3.58.39.39.883.66 1.427.781-.168.21-.365.407-.568.61l-.03.03a.526.526 0 0 0 0 .743l.935.935c.102.102.237.153.371.153.134 0 .269-.051.372-.153l.133-.133c.203-.203.4-.4.61-.568.12.544.39 1.037.78 1.428a2.53 2.53 0 0 0 3.58 0c.987-.987.987-2.593 0-3.58z" />
                  </svg>
                </div>
                <span className="share-social-name">밴드</span>
              </div>

              {/* System Share */}
              <div className="share-social-item" onClick={(e) => shareToSocial(e, 'system')}>
                <div className="share-social-icon-wrapper" style={{ backgroundColor: '#F1F5F9' }}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="#475569">
                    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7L15.9 7.12c.53.5 1.25.8 2.1.8 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92z" />
                  </svg>
                </div>
                <span className="share-social-name">기본 공유</span>
              </div>
            </div>
          </div>

          {/* 2. Actions List */}
          <div className="sheet-actions-list">
            {/* Copy Link button */}
            <button className="sheet-action-btn" onClick={handleCopyLink}>
              <div className="action-btn-left">
                <i className="far fa-copy action-icon" />
                <span>링크 복사</span>
              </div>
            </button>

            {/* Bookmark button */}
            {onBookmark && (
              <button className="sheet-action-btn" onClick={handleBookmarkToggle}>
                <div className="action-btn-left">
                  <i
                    className={`${isBookmarked ? 'fas' : 'far'} fa-bookmark action-icon`}
                    style={{ color: isBookmarked ? 'var(--primary-color, #0241D3)' : undefined }}
                  />
                  <span>{isBookmarked ? '북마크 해제' : '북마크 저장'}</span>
                </div>
              </button>
            )}

            {isOwner ? (
              <>
                <button className="sheet-action-btn" onClick={(e) => handleAction(e, onEdit)}>
                  <div className="action-btn-left">
                    <i className="far fa-edit action-icon" />
                    <span>게시물 수정</span>
                  </div>
                </button>
                <button className="sheet-action-btn" onClick={(e) => handleAction(e, onPin)}>
                  <div className="action-btn-left">
                    <i className="fas fa-thumbtack action-icon" />
                    <span>프로필에 고정</span>
                  </div>
                </button>
                <button className="sheet-action-btn sheet-action-btn--danger" onClick={(e) => handleAction(e, onDelete)}>
                  <div className="action-btn-left">
                    <i className="far fa-trash-alt action-icon" style={{ color: '#ef4444' }} />
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>게시물 삭제</span>
                  </div>
                </button>
              </>
            ) : (
              <>
                <button className="sheet-action-btn sheet-action-btn--danger" onClick={(e) => handleAction(e, onReport)}>
                  <div className="action-btn-left">
                    <i className="far fa-flag action-icon" style={{ color: '#ef4444' }} />
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>게시물 신고</span>
                  </div>
                </button>
              </>
            )}
          </div>

          {/* Cancel button */}
          <button
            className="cancel-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            취소
          </button>
        </div>
      </div>

      <style jsx>{`
        /* --- Backdrop overlay style --- */
        .menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9999;
          animation: fadeIn 0.25s ease-out;
        }

        /* --- Mobile Bottom Sheet Container (Default) --- */
        .post-menu-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 10000;
          padding: 10px;
          animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .post-menu-content {
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border-radius: 28px;
          overflow: hidden;
          max-width: 500px;
          margin: 0 auto;
          box-shadow: 0 20px 48px rgba(15, 23, 42, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        /* --- Drag indicator for Bottom sheet --- */
        .sheet-indicator {
          width: 36px;
          height: 4px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 999px;
          margin: 10px auto 8px;
        }

        .sheet-title {
          text-align: center;
          font-size: 14px;
          font-weight: 800;
          color: #64748b;
          margin-bottom: 12px;
          letter-spacing: -0.01em;
        }

        /* --- SNS Sharing Section --- */
        .share-section {
          padding: 8px 18px 16px;
        }

        .share-section-title {
          font-size: 12px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }

        .share-social-list {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 4px 4px 8px;
          scrollbar-width: none; /* Firefox */
        }

        .share-social-list::-webkit-scrollbar {
          display: none; /* Safari/Chrome */
        }

        .share-social-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          flex-shrink: 0;
          width: 64px;
          transition: opacity 0.2s;
        }

        .share-social-item:active {
          opacity: 0.7;
        }

        .share-social-icon-wrapper {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
        }

        .share-social-item:hover .share-social-icon-wrapper {
          transform: scale(1.08);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
        }

        .share-social-name {
          font-size: 10px;
          font-weight: 700;
          color: #475569;
          text-align: center;
          white-space: nowrap;
        }

        /* --- Actions List --- */
        .sheet-actions-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 10px 14px 18px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .sheet-action-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 12px 14px;
          background: transparent;
          border: none;
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          cursor: pointer;
          border-radius: 12px;
          transition: background-color 0.2s, transform 0.1s;
          text-align: left;
        }

        .sheet-action-btn:hover {
          background-color: rgba(15, 23, 42, 0.04);
        }

        .sheet-action-btn:active {
          background-color: rgba(15, 23, 42, 0.08);
          transform: scale(0.995);
        }

        .action-btn-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .action-icon {
          font-size: 18px;
          width: 20px;
          text-align: center;
          color: #64748b;
        }

        .cancel-btn {
          width: 100%;
          padding: 16px;
          background: rgba(15, 23, 42, 0.03);
          border: none;
          font-size: 15px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          text-align: center;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          transition: background-color 0.2s;
        }

        .cancel-btn:hover {
          background-color: rgba(15, 23, 42, 0.07);
        }

        .cancel-btn:active {
          background-color: rgba(15, 23, 42, 0.1);
        }

        /* --- Toast Notification Style --- */
        .toast-notification {
          position: fixed;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 12px 36px rgba(15, 23, 42, 0.16);
          padding: 12px 24px;
          border-radius: 9999px;
          z-index: 10005;
          animation: toastFadeIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .toast-content {
          display: flex;
          align-items: center;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
        }

        /* --- Animations --- */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        @keyframes toastFadeIn {
          from { opacity: 0; transform: translate(-50%, 24px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        /* --- Desktop Responsive Popup Dialog Layout --- */
        @media (min-width: 640px) {
          .menu-overlay {
            background-color: rgba(15, 23, 42, 0.25);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
          }
          .post-menu-container {
            position: fixed;
            top: 50%;
            left: 50%;
            bottom: auto;
            right: auto;
            transform: translate(-50%, -50%);
            width: 420px;
            padding: 0;
            animation: zoomIn 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .post-menu-content {
            border-radius: 24px;
          }
          .sheet-indicator {
            display: none;
          }
          .sheet-title {
            margin-top: 20px;
            font-size: 15px;
          }
          @keyframes zoomIn {
            from { opacity: 0; transform: translate(-50%, -46%) scale(0.93); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        }
      `}</style>
    </>
  );
};

export default PostMenu;