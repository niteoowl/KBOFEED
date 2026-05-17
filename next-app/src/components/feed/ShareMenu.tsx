'use client';

import React from 'react';

interface ShareMenuProps {
  open: boolean;
  onClose: () => void;
  url: string;
  postContent?: string;
}

const ShareMenu = ({ open, onClose, url, postContent = '' }: ShareMenuProps) => {
  if (!open) return null;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
  const shareText = postContent
    ? postContent.length > 100
      ? postContent.substring(0, 100) + '...'
      : postContent
    : 'KBO FEED 게시글';

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('링크가 클립보드에 복사되었습니다.');
    } catch {
      alert('링크 복사에 실패했습니다.');
    }
  };

  const shareToSocial = (platform: string) => {
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
          return;
        } else {
          handleCopyLink();
          return;
        }
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'noopener,noreferrer');
    }
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
          <div className="share-header">공유하기</div>
          <button onClick={(e) => handleAction(e, () => shareToSocial('x'))}>X (트위터) 공유</button>
          <button onClick={(e) => handleAction(e, () => shareToSocial('facebook'))}>페이스북 공유</button>
          <button onClick={(e) => handleAction(e, handleCopyLink)} style={{ fontWeight: '600' }}>링크 복사</button>
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

        .share-header {
          padding: 16px;
          font-weight: bold;
          text-align: center;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-color);
          font-size: 14px;
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
            width: 200px;
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

export default ShareMenu;
