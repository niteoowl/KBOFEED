'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import GlobalHeader from '@/components/layout/GlobalHeader';
import { getNotifications, markNotificationsRead } from '@/app/actions/post';
import { postPermalink } from '@/lib/post-url';

export const runtime = 'edge';

type NotificationRow = Awaited<ReturnType<typeof getNotifications>>[number];

function notificationText(n: NotificationRow) {
  const name = n.sender?.displayName || n.sender?.username || '사용자';
  switch (n.type) {
    case 'follow':
      return `${name}님이 팔로우했습니다`;
    case 'comment':
      return `${name}님이 회원님의 게시물에 댓글을 남겼습니다`;
    case 'mention':
      return `${name}님이 회원님을 멘션했습니다`;
    case 'like':
      return `${name}님이 회원님의 게시물을 좋아합니다`;
    default:
      return `${name}님의 알림`;
  }
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then((data) => setItems(data))
      .finally(() => setLoading(false));
    markNotificationsRead();
  }, []);

  return (
    <>
      <GlobalHeader title="알림" showBackBtn />
      <main className="main-feed" style={{ paddingTop: 0 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>로딩 중...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            새 알림이 없습니다.
          </div>
        ) : (
          items.map((n) => {
            const href =
              n.post && n.post.profiles?.username
                ? postPermalink(n.post.profiles.username, n.post.id)
                : n.sender?.username
                  ? `/@${n.sender.username}`
                  : '#';
            return (
              <Link
                key={n.id}
                href={href}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-color)',
                  background: n.isRead ? 'transparent' : 'rgba(29, 155, 240, 0.06)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
                  className="user-avatar"
                  style={{
                    width: 44,
                    height: 44,
                    minWidth: 44,
                    borderRadius: '50%',
                    backgroundImage: n.sender?.avatarUrl ? `url(${n.sender.avatarUrl})` : undefined,
                    backgroundSize: 'cover',
                  }}
                />
                <div>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4 }}>{notificationText(n)}</p>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {n.createdAt
                      ? formatDistanceToNow(new Date(n.createdAt.replace(' ', 'T') + 'Z'), {
                          addSuffix: true,
                          locale: ko,
                        })
                      : ''}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </main>
    </>
  );
}
