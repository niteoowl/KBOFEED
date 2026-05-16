'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useProfile } from '@/context/ProfileContext';

const UserAccount = () => {
  const { data: session, status } = useSession();
  const { displayName, avatarUrl } = useProfile();

  if (status === 'loading') return <div className="h-12 animate-pulse bg-zinc-100 rounded-full w-full mt-auto" />;

  if (session) {
    return (
      <div
        className="mt-auto p-3 flex items-center gap-3 hover:bg-zinc-100 rounded-full cursor-pointer transition-colors"
        onClick={() => signOut()}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border border-zinc-200 object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-200" />
        )}
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className="font-bold text-sm truncate">{displayName}</span>
          <span className="text-zinc-500 text-xs truncate">로그아웃</span>
        </div>
        <i className="fas fa-ellipsis-h text-zinc-400" />
      </div>
    );
  }

  return (
    <Link href="/login" className="post-btn" style={{ width: '100%', marginTop: 'auto', display: 'block', textDecoration: 'none' }}>
      로그인
    </Link>
  );
};

export default UserAccount;
