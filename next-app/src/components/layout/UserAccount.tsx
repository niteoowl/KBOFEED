'use client';

import { useSession, signIn, signOut } from "next-auth/react";

const UserAccount = () => {
  const { data: session, status } = useSession();

  if (status === "loading") return <div className="h-12 animate-pulse bg-zinc-100 rounded-full w-full mt-auto" />;

  if (session) {
    return (
      <div className="mt-auto p-3 flex items-center gap-3 hover:bg-zinc-100 rounded-full cursor-pointer transition-colors" onClick={() => signOut()}>
        {session.user?.image ? (
          <img src={session.user.image} alt="Avatar" className="w-10 h-10 rounded-full border border-zinc-200" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-200" />
        )}
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className="font-bold text-sm truncate">{session.user?.name}</span>
          <span className="text-zinc-500 text-xs truncate">로그아웃</span>
        </div>
        <i className="fas fa-ellipsis-h text-zinc-400" />
      </div>
    );
  }

  return (
    <button 
      onClick={() => signIn('google')}
      className="mt-auto w-full py-3 bg-zinc-900 text-white rounded-full font-bold hover:bg-zinc-800 transition-colors"
    >
      로그인
    </button>
  );
};

export default UserAccount;
