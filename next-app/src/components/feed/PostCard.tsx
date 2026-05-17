'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  toggleLike,
  toggleRetweet,
  deletePost,
  updatePost,
  toggleBookmark,
} from '@/app/actions/post';
import { postPermalink } from '@/lib/post-url';
import { parsePoll } from '@/lib/content';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getTeamLogo } from '@/lib/constants';
import FormattedContent from './FormattedContent';
import PollBlock from './PollBlock';
import PostMenu from './PostMenu';
import ShareMenu from './ShareMenu';

interface PostProps {
  suppressNavigation?: boolean;
  isDetailView?: boolean;
  hideFollow?: boolean;
  showMenu?: boolean;
  isProcessing?: boolean;
  post: {
    id: string;
    content: string | null;
    imageUrl: string | null;
    createdAt: string | null;
    likesCount: number | null;
    retweetsCount: number | null;
    commentsCount: number | null;
    viewsCount?: number | null;
    retweetId?: string | null;
    originalPost?: any;
    isLiked?: boolean;
    isRetweeted?: boolean;
    isBookmarked?: boolean;
    profiles: {
      id?: string;
      username: string;
      displayName: string | null;
      avatarUrl: string | null;
      isVerified: boolean | null;
      favoriteTeam?: string | null;
    };
  };
}

function parseDate(dateStr: string) {
  if (!dateStr) return new Date();
  if (dateStr.includes('T') || dateStr.endsWith('Z')) return new Date(dateStr);
  return new Date(dateStr.replace(' ', 'T') + 'Z');
}

const PostCard = ({
  post,
  suppressNavigation,
  isDetailView,
  hideFollow = false,
  showMenu = true,
  isProcessing: isProcessingProp,
}: PostProps) => {
  const router = useRouter();
  const { data: session } = useSession();
  const isProcessing = isProcessingProp ?? post.id.startsWith('tmp_');

  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isRetweeted, setIsRetweeted] = useState(post.isRetweeted);
  const [retweetsCount, setRetweetsCount] = useState(post.retweetsCount || 0);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked ?? false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');

  const isOwner = session?.user?.id === post.profiles.id;
  const showFollowBtn =
    isDetailView && !hideFollow && post.profiles.id && session?.user?.id !== post.profiles.id;

  useEffect(() => {
    if (showFollowBtn && post.profiles.id) {
      import('@/app/actions/user').then(({ getProfile }) => {
        getProfile(post.profiles.username).then((profile) => {
          if (profile) setIsFollowing(profile.isFollowing);
        });
      });
    }
  }, [showFollowBtn, post.profiles.username, post.profiles.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : Math.max(0, prev - 1)));
    await toggleLike(post.id);
  };

  const handleRetweet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;
    const newRetweeted = !isRetweeted;
    setIsRetweeted(newRetweeted);
    setRetweetsCount((prev) => (newRetweeted ? prev + 1 : Math.max(0, prev - 1)));
    await toggleRetweet(post.id);
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;
    setIsBookmarked(!isBookmarked);
    try {
      await toggleBookmark(post.id);
    } catch {
      setIsBookmarked(isBookmarked);
    }
  };

  const detailHref = postPermalink(post.profiles.username, post.id);

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isProcessing) router.push(detailHref);
  };

  const openPostDetail = () => {
    if (!suppressNavigation && !isProcessing) router.push(detailHref);
  };

  const rawContent = post.content || '';
  const { text: contentWithoutPoll, poll } = parsePoll(rawContent);
  const shouldTruncate =
    !suppressNavigation &&
    !isDetailView &&
    (contentWithoutPoll.length > 150 || (contentWithoutPoll.match(/\n/g) || []).length > 3);

  let displayContent = contentWithoutPoll;
  if (shouldTruncate && !isExpanded) {
    const lines = contentWithoutPoll.split('\n');
    displayContent =
      lines.length > 4 ? lines.slice(0, 4).join('\n') + '...' : contentWithoutPoll.slice(0, 150) + '...';
  }

  const timeAgo = post.createdAt
    ? formatDistanceToNow(parseDate(post.createdAt), { addSuffix: true, locale: ko })
    : '';

  const mediaSrc =
    typeof post.imageUrl === 'string' && post.imageUrl.startsWith('http') ? post.imageUrl : null;

  const renderActions = () => (
    <div className="tweet-actions">
      <div className="action-item action-comment" onClick={handleComment}>
        <i className="far fa-comment" />
        <span>{post.commentsCount || 0}</span>
      </div>
      <div
        onClick={handleRetweet}
        className="action-item action-retweet"
        style={{ color: isRetweeted ? '#00ba7c' : undefined }}
      >
        <i className="fas fa-retweet" />
        <span>{retweetsCount}</span>
      </div>
      <div
        onClick={handleLike}
        className="action-item action-like"
        style={{ color: isLiked ? '#f91880' : undefined }}
      >
        <i className={`${isLiked ? 'fas' : 'far'} fa-heart`} />
        <span>{likesCount}</span>
      </div>
      <div className="action-item action-views" onClick={(e) => e.stopPropagation()}>
        <i className="far fa-chart-bar" />
        <span>{post.viewsCount || 0}</span>
      </div>
      <div
        onClick={handleBookmark}
        className="action-item action-bookmark"
        style={{ color: isBookmarked ? 'var(--primary-color)' : undefined }}
      >
        <i className={`${isBookmarked ? 'fas' : 'far'} fa-bookmark`} />
      </div>
      <div
        className="action-item action-share"
        onClick={(e) => {
          e.stopPropagation();
          setShareOpen(true);
        }}
      >
        <i className="fas fa-share" />
      </div>
    </div>
  );

  const menuButton = showMenu && (
    <div style={{ position: 'relative', marginLeft: isDetailView ? 12 : 0 }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          padding: 4,
          marginLeft: 'auto',
        }}
        aria-label="Menu"
      >
        <i className="fas fa-ellipsis-h" />
      </button>
      <PostMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        isOwner={!!isOwner}
        onEdit={
          isDetailView
            ? () => {
              setEditContent(post.content || '');
              setIsEditing(true);
            }
            : () => router.push(detailHref)
        }
        onDelete={async () => {
          if (confirm('이 게시물을 삭제하시겠습니까?')) {
            await deletePost(post.id);
            router.push('/');
          }
        }}
        onPin={async () => {
          const { pinPostToProfile } = await import('@/app/actions/user');
          await pinPostToProfile(post.id);
          alert('프로필에 고정되었습니다.');
        }}
        onReport={() => alert('신고가 정상적으로 접수되었습니다.')}
      />
    </div>
  );

  return (
    <>
      <ShareMenu open={shareOpen} onClose={() => setShareOpen(false)} url={detailHref} />

      {post.retweetId && post.originalPost && (
        <div
          style={{
            padding: '12px 16px 0 36px',
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <i className="fas fa-retweet" />
          <span>{post.profiles.displayName}님이 재게시했습니다</span>
        </div>
      )}

      <article
        className={`tweet ${isDetailView ? 'no-hover' : ''} ${isProcessing ? 'tweet-processing' : ''}`}
        style={{
          display: isDetailView ? 'block' : 'flex',
          gap: isDetailView ? undefined : '8px',
          cursor: suppressNavigation || isProcessing ? 'default' : 'pointer',
          opacity: isProcessing ? 0.55 : 1,
          pointerEvents: isProcessing ? 'none' : undefined,
        }}
        role={suppressNavigation || isProcessing ? undefined : 'link'}
        tabIndex={suppressNavigation || isProcessing ? undefined : 0}
        onClick={suppressNavigation || isProcessing ? undefined : openPostDetail}
        onKeyDown={
          suppressNavigation || isProcessing
            ? undefined
            : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPostDetail();
              }
            }
        }
      >
        {isDetailView ? (
          <div className="post-detail-inner" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                className="user-avatar"
                style={{
                  backgroundImage: post.profiles.avatarUrl ? `url(${post.profiles.avatarUrl})` : undefined,
                  backgroundSize: 'cover',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  minWidth: 40,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/@${post.profiles.username}`);
                }}
              />
              <div style={{ marginLeft: 12, flex: 1 }}>
                <span
                  style={{ fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/@${post.profiles.username}`);
                  }}
                >
                  {post.profiles.displayName || '알 수 없음'}
                  {post.profiles.favoriteTeam && (
                    <img src={getTeamLogo(post.profiles.favoriteTeam)} alt="" style={{ width: 16, height: 16, marginLeft: 6 }} />
                  )}
                </span>
                <span
                  style={{ color: 'var(--text-secondary)', fontSize: 14, cursor: 'pointer', display: 'block' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/@${post.profiles.username}`);
                  }}
                >
                  @{post.profiles.username}
                </span>
              </div>
              {showFollowBtn && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const { toggleFollow } = await import('@/app/actions/user');
                      if (!post.profiles.id) throw new Error('Invalid profile');
                      await toggleFollow(post.profiles.id);
                      setIsFollowing(!isFollowing);
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : '';
                      if (msg === 'Not authenticated') alert('로그인이 필요합니다.');
                      else alert(msg || '요청을 처리할 수 없습니다.');
                    }
                  }}
                  style={{
                    background: isFollowing ? 'transparent' : '#111827',
                    color: isFollowing ? '#111827' : '#fff',
                    borderRadius: 999,
                    padding: '6px 14px',
                    border: isFollowing ? '1px solid #D1D5DB' : 'none',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {isFollowing ? '팔로잉' : '팔로우'}
                </button>
              )}
              {menuButton}
            </div>

            {isEditing ? (
              <div style={{ marginTop: 16 }} onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 120,
                    fontSize: 17,
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: 12,
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={async () => {
                      await updatePost(post.id, editContent);
                      setIsEditing(false);
                      router.refresh();
                    }}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--primary-color)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 999,
                      fontWeight: 700,
                    }}
                  >
                    Save
                  </button>
                  <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '8px 16px' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="tweet-text" style={{ whiteSpace: 'pre-wrap', marginTop: 16, fontSize: 17 }}>
                <FormattedContent
                  text={
                    post.retweetId && post.originalPost
                      ? parsePoll(post.originalPost.content || '').text
                      : displayContent
                  }
                />
              </div>
            )}

            {poll && !isEditing && <PollBlock poll={poll} />}
            {mediaSrc && (
              <div className="tweet-media" style={{ marginTop: 12 }}>
                <img src={mediaSrc} alt="media" style={{ borderRadius: 16, width: '100%' }} />
              </div>
            )}

            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              {post.createdAt &&
                `${parseDate(post.createdAt).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })} · ${parseDate(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`}
            </div>
            {renderActions()}
          </div>
        ) : (
          <>
            <div
              className="user-avatar"
              style={{
                backgroundImage: post.profiles.avatarUrl ? `url(${post.profiles.avatarUrl})` : undefined,
                backgroundSize: 'cover',
                borderRadius: '50%',
                width: 40,
                height: 40,
                minWidth: 40,
                marginRight: 0,
              }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/@${post.profiles.username}`);
              }}
            />
            <div className="tweet-content" style={{ flex: 1, paddingLeft: 0, marginLeft: 0 }}>
              {/* 여기부터 교체 시작 */}
              <div
                className="tweet-header"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start', // 텍스트와 버튼의 상단 라인을 맞춤
                  justifyContent: 'space-between', // 유저 정보는 왼쪽, 메뉴 버튼은 맨 오른쪽 끝으로 밀어냄
                  gap: 8,
                  position: 'relative'
                }}
              >
                {/* 왼쪽 유저 정보들을 묶어주는 컨테이너 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                  <span
                    className="display-name"
                    style={{ fontWeight: 800, display: 'flex', alignItems: 'center' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/@${post.profiles.username}`);
                    }}
                  >
                    {post.profiles.displayName || '알 수 없음'}
                    {post.profiles.favoriteTeam && (
                      <img src={getTeamLogo(post.profiles.favoriteTeam)} alt="" style={{ width: 16, height: 16, marginLeft: 4 }} />
                    )}
                  </span>
                  {post.profiles.isVerified && (
                    <i className="fas fa-check-circle verified" style={{ color: 'var(--primary-color)', fontSize: 14 }} />
                  )}
                  <span
                    className="username"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/@${post.profiles.username}`);
                    }}
                  >
                    @{post.profiles.username}
                  </span>
                  <span className="dot" style={{ color: 'var(--text-secondary)' }}>
                    ·
                  </span>
                  <span className="time" style={{ color: 'var(--text-secondary)' }}>
                    {timeAgo}
                  </span>
                </div>

                {/* 오른쪽 끝에 고정될 메뉴 버튼 */}
                <div style={{ flexShrink: 0, marginTop: -2 }}>
                  {menuButton}
                </div>
              </div>
              {/* 여기까지 교체 끝 */}

              <div className="tweet-text" style={{ whiteSpace: 'pre-wrap' }}>
                <FormattedContent
                  text={
                    post.retweetId && post.originalPost
                      ? parsePoll(post.originalPost.content || '').text
                      : displayContent
                  }
                />
                {!isExpanded && shouldTruncate && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(true);
                    }}
                    style={{ color: 'var(--primary-color)', cursor: 'pointer', marginLeft: 6, fontWeight: 'bold' }}
                  >
                    더보기
                  </span>
                )}
              </div>
              {poll && <PollBlock poll={poll} />}
              {mediaSrc && (
                <div className="tweet-media">
                  <img src={mediaSrc} alt="post" />
                </div>
              )}
              {renderActions()}
            </div>
          </>
        )}
      </article>
    </>
  );
};

export default PostCard;
