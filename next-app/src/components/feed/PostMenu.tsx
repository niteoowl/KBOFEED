'use client';

import { useSession } from 'next-auth/react';

interface PostMenuProps {
  open: boolean;
  onClose: () => void;
  isOwner: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onReport?: () => void;
}

export default function PostMenu({
  open,
  onClose,
  isOwner,
  onEdit,
  onDelete,
  onPin,
  onReport,
}: PostMenuProps) {
  const { data: session } = useSession();
  if (!open) return null;

  return (
    <>
      <div className="mobile-backdrop" onClick={(e) => { e.stopPropagation(); onClose(); }} />
      <div className="post-card-dropdown mobile-bottom-sheet post-menu-sheet" onClick={(e) => e.stopPropagation()}>
        {isOwner && onEdit && (
          <button type="button" className="post-menu-item" onClick={() => { onClose(); onEdit(); }}>
            게시물 수정
          </button>
        )}
        {isOwner && onPin && (
          <button type="button" className="post-menu-item" onClick={() => { onClose(); onPin(); }}>
            프로필에 고정
          </button>
        )}
        {isOwner && onDelete && (
          <button type="button" className="post-menu-item post-menu-item--danger" onClick={() => { onClose(); onDelete(); }}>
            게시물 삭제
          </button>
        )}
        {!isOwner && session && onReport && (
          <button type="button" className="post-menu-item" onClick={() => { onClose(); onReport(); }}>
            게시물 신고
          </button>
        )}
        <button type="button" className="post-menu-item post-menu-item--cancel mobile-cancel" onClick={() => onClose()}>
          취소
        </button>
      </div>
    </>
  );
}
