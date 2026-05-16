'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getProfile } from '@/app/actions/user';

export interface ProfileData {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  favoriteTeam: string | null;
  coverUrl: string | null;
  isVerified: boolean | null;
}

interface ProfileContextValue {
  profile: ProfileData | null;
  refreshProfile: () => Promise<void>;
  displayName: string;
  avatarUrl: string | null;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const refreshProfile = useCallback(async () => {
    const username = (session?.user as { username?: string })?.username;
    if (!username) {
      setProfile(null);
      return;
    }
    try {
      const p = await getProfile(username);
      if (p) {
        setProfile({
          id: p.id,
          username: p.username,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
          bio: p.bio,
          favoriteTeam: p.favoriteTeam,
          coverUrl: p.coverUrl,
          isVerified: p.isVerified,
        });
      }
    } catch {
      /* ignore */
    }
  }, [session]);

  useEffect(() => {
    if (status === 'authenticated') refreshProfile();
    else setProfile(null);
  }, [status, refreshProfile]);

  const displayName =
    profile?.displayName || session?.user?.name || '사용자';
  const avatarUrl = profile?.avatarUrl ?? session?.user?.image ?? null;

  return (
    <ProfileContext.Provider value={{ profile, refreshProfile, displayName, avatarUrl }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    return {
      profile: null,
      refreshProfile: async () => {},
      displayName: '사용자',
      avatarUrl: null,
    };
  }
  return ctx;
}
