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
          <div className="sheet-header" style={{ padding: '16px', fontWeight: 'bold', textAlign: 'center', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', fontSize: '14px' }}>
            공유하기
          </div>
          <button onClick={(e) => handleAction(e, () => shareToSocial('x'))}>X (트위터) 공유</button>
          <button onClick={(e) => handleAction(e, () => shareToSocial('facebook'))}>페이스북 공유</button>
          <button onClick={(e) => handleAction(e, handleCopyLink)} style={{ fontWeight: '600' }}>링크 복사</button>
          <button className="unified-sheet-cancel" onClick={(e) => { e.stopPropagation(); onClose(); }}>취소</button>
        </div>
      </div>
    </>
  );
};

export default ShareMenu;
