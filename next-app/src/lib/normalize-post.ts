/** D1 원시 행·KV 캐시 → PostCard용 필드 (camelCase) */
export function normalizePostForCard(
  raw: Record<string, unknown> | null | undefined
) {
  if (!raw) return null;
  const r = raw as Record<string, unknown>;
  const profilesRaw = r.profiles as Record<string, unknown> | undefined;

  return {
    id: r.id as number,
    content: (r.content ?? null) as string | null,
    imageUrl: (r.imageUrl ?? r.image_url ?? null) as string | null,
    createdAt: (r.createdAt ?? r.created_at ?? null) as string | null,
    likesCount: Number(r.likesCount ?? r.likes_count ?? 0),
    retweetsCount: Number(r.retweetsCount ?? r.retweets_count ?? 0),
    commentsCount: Number(r.commentsCount ?? r.comments_count ?? 0),
    isLiked: Boolean(r.isLiked ?? r.is_liked),
    isRetweeted: Boolean(r.isRetweeted ?? r.is_retweeted),
    profiles: {
      username: String(
        profilesRaw?.username ?? r.username ?? 'user'
      ),
      displayName: (profilesRaw?.displayName ??
        r.displayName ??
        r.display_name ??
        null) as string | null,
      avatarUrl: (profilesRaw?.avatarUrl ??
        r.avatarUrl ??
        r.avatar_url ??
        null) as string | null,
      isVerified: Boolean(
        profilesRaw?.isVerified ?? r.isVerified ?? r.is_verified
      ),
    },
  };
}
