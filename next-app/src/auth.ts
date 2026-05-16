import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getDb } from "./db/db";
import Google from "next-auth/providers/google";

import { profiles, users, accounts, sessions, verificationTokens } from "./db/schema";

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
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    providers: [
      Google({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }),
      {
        id: "credentials",
        name: "Credentials",
        type: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null;
          
          const db = getDb(env.DB);
          const user = await db.query.users.findFirst({
            where: (users, { eq }) => eq(users.email, credentials.email as string)
          });

          if (!user || !user.password) return null;

          // Hash input for comparison
          const encoder = new TextEncoder();
          const data = encoder.encode((credentials.password as string) + 'KBOFEED_SALT');
          const hash = await crypto.subtle.digest('SHA-256', data);
          const hashedPassword = Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

          if (hashedPassword === user.password) {
            // Fetch profile to get username
            const profile = await db.query.profiles.findFirst({
              where: (profiles, { eq }) => eq(profiles.id, user.id)
            });

            return { 
              id: user.id, 
              name: user.name, 
              email: user.email,
              username: profile?.username // Include username
            };
          }
          return null;
        }
      }
    ],
    session: {
      strategy: "jwt"
    },
    pages: {
      signIn: '/login',
    },
    trustHost: true,
    secret: env.AUTH_SECRET,
    // Cloudflare Pages에서 도메인 인식이 안 될 경우를 대비해 명시적 설정
    basePath: "/api/auth",
    callbacks: {
      jwt: async ({ token, user, trigger, session }) => {
        // Handle trigger update with explicit session data to bypass D1 Next.js fetch caching
        if (trigger === 'update' && session) {
          if (session.username !== undefined) token.username = session.username;
          if (session.needsOnboarding !== undefined) token.needsOnboarding = session.needsOnboarding;
          return token;
        }

        // On initial sign-in or session update, fetch profile
        if (user || trigger === 'update') {
          const userId = user?.id || token.id as string;
          if (userId) {
            token.id = userId;
            try {
              const profile = await db.query.profiles.findFirst({
                where: (profiles, { eq }) => eq(profiles.id, userId)
              });
              if (profile) {
                token.username = profile.username;
                // 자동생성 핸들(user_xxxxxxxx) → 온보딩 필요
                token.needsOnboarding = /^user_[a-f0-9]{8}$/.test(profile.username);
              } else {
                token.needsOnboarding = true;
              }
            } catch (e) {
              console.error('Failed to fetch profile in jwt callback:', e);
              if (user) {
                token.username = (user as any).username;
                token.needsOnboarding = false;
              }
            }
          }
        }
        return token;
      },
      session: async ({ session, token }) => {
        if (session.user) {
          session.user.id = token.id as string;
          (session.user as any).username = token.username;
          (session.user as any).needsOnboarding = token.needsOnboarding || false;
        }
        return session;
      },
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
