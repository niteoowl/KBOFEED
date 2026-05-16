'use server';

import { getRequestContext } from '@cloudflare/next-on-pages';
import { getDb } from '@/db/db';
import { profiles, ads } from '@/db/schema';
import { eq, like, desc } from 'drizzle-orm';
import { auth } from '@/auth';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Not authenticated');
  const { env } = getRequestContext();
  const db = getDb(env.DB);
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, session.user.id)
  });
  if (!profile?.isAdmin) throw new Error('Not authorized');
  return db;
}

export async function searchUsers(query: string) {
  const db = await requireAdmin();
  if (!query.trim()) return [];
  const searchTerm = `%${query.replace(/^@/, '').trim()}%`;
  
  return await db.query.profiles.findMany({
    where: like(profiles.username, searchTerm),
    limit: 10,
  });
}

export async function toggleUserVerification(userId: string, isVerified: boolean) {
  const db = await requireAdmin();
  await db.update(profiles)
    .set({ isVerified })
    .where(eq(profiles.id, userId));
  return true;
}

export async function getActiveAds() {
  const db = await requireAdmin();
  return await db.query.ads.findMany({
    orderBy: [desc(ads.createdAt)],
  });
}

export async function createAd(data: { content: string; imageUrl?: string; linkUrl?: string }) {
  const db = await requireAdmin();
  await db.insert(ads).values({
    content: data.content,
    imageUrl: data.imageUrl || null,
    linkUrl: data.linkUrl || null,
    isActive: true,
  });
  return true;
}

export async function toggleAdStatus(adId: number, isActive: boolean) {
  const db = await requireAdmin();
  await db.update(ads)
    .set({ isActive })
    .where(eq(ads.id, adId));
  return true;
}

export async function deleteAd(adId: number) {
  const db = await requireAdmin();
  await db.delete(ads).where(eq(ads.id, adId));
  return true;
}
