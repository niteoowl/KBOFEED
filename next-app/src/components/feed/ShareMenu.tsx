'use client';

interface ShareMenuProps {
  open: boolean;
  onClose: () => void;
  url: string;
}

export default function ShareMenu({ open, onClose, url }: ShareMenuProps) {
  if (!open) return null;

  const copyLink = async () => {
    try {
      const full = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
      await navigator.clipboard.writeText(full);
      alert('링크가 복사되었습니다.');
    } catch {
      alert('링크 복사에 실패했습니다.');
    }
    onClose();
  };

  return (
    <>
      <div className="mobile-backdrop" onClick={(e) => { e.stopPropagation(); onClose(); }} />
      <div className="post-card-dropdown mobile-bottom-sheet post-menu-sheet" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="post-menu-item" onClick={copyLink}>
          링크 복사
        </button>
        <button type="button" className="post-menu-item post-menu-item--cancel mobile-cancel" onClick={onClose}>
          취소
        </button>
      </div>
    </>
  );
}
