/**
 * 크보피드 게시물 고유 주소 (SNS 관습: /@핸들/글ID)
 */
export function normalizeHandleSegment(segment: string): string {
  const decoded = decodeURIComponent(segment).trim();
  return decoded.startsWith('@') ? decoded.slice(1) : decoded;
}

export function postPermalink(username: string | null | undefined, postId: string | number): string {
  const handle = String(username ?? '').replace(/^@+/u, '');
  const id = String(postId);
  if (!handle) return `/`;
  return `/@${handle}/${id}`;
}
