import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getDb } from "./db/db";
import Google from "next-auth/providers/google";

import { profiles } from "./db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth((req) => {
  const { env } = getRequestContext();
  
  // 진단용 로그 (Cloudflare 대시보드 Functions 실시간 로그에서 확인 가능)
  console.log("--- NextAuth Config Diagnostics ---");
  console.log("AUTH_SECRET exists:", !!env.AUTH_SECRET);
  console.log("GOOGLE_CLIENT_ID exists:", !!env.GOOGLE_CLIENT_ID);
  console.log("GOOGLE_CLIENT_SECRET exists:", !!env.GOOGLE_CLIENT_SECRET);
  console.log("DB binding exists:", !!env.DB);
  console.log("----------------------------------");

  if (!env.AUTH_SECRET) {
    console.error("CRITICAL: AUTH_SECRET is missing from environment variables!");
  }

  const db = getDb(env.DB);

  return {
    adapter: DrizzleAdapter(db),
    providers: [
      Google({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }),
    ],
    pages: {
      signIn: '/login',
    },
    trustHost: true,
    secret: env.AUTH_SECRET,
    // Cloudflare Pages에서 도메인 인식이 안 될 경우를 대비해 명시적 설정
    basePath: "/api/auth",
    callbacks: {
      session: ({ session, user }) => ({
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      }),
    },
    events: {
      createUser: async ({ user }) => {
        if (!user.id) return;
        try {
          await db.insert(profiles).values({
            id: user.id,
            username: `user_${user.id.substring(0, 8)}`,
            displayName: user.name || '새로운 탐험가',
            avatarUrl: user.image,
          }).onConflictDoNothing();
        } catch (e) {
          console.error("Failed to create profile for user:", user.id, e);
        }
      }
    },
  };
});
