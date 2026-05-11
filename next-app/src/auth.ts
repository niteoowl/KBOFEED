import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getDb } from "./db/db";
import Google from "next-auth/providers/google";

import { profiles } from "./db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth((req) => {
  const { env } = getRequestContext();
  const db = getDb(env.DB);

  return {
    adapter: DrizzleAdapter(db),
    providers: [
      Google({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }),
    ],
    events: {
      createUser: async ({ user }) => {
        if (!user.id) return;
        
        // 유저 생성 시 기본 프로필 자동 생성
        await db.insert(profiles).values({
          id: user.id,
          username: `user_${user.id.substring(0, 8)}`,
          displayName: user.name || '새로운 탐험가',
          avatarUrl: user.image,
        }).onConflictDoNothing();
      }
    },
    callbacks: {
      session: ({ session, user }) => ({
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      }),
    },
  };
});
