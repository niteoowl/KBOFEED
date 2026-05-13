'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { KBO_TEAMS, getTeamLogo } from '@/lib/constants';
import ComposePost from '@/components/feed/ComposePost';
import PostCard from '@/components/feed/PostCard';
import { getPosts, getTeamPosts } from '@/app/actions/post';

const STORAGE_KEY = 'selected_team';

type PostRow = Awaited<ReturnType<typeof getPosts>>[number];

export default function HomeFeed() {
  const { data: session } = useSession();
  const [mainTab, setMainTab] = useState<'all' | 'myteam'>('all');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [subtab, setSubtab] = useState<'collection' | 'feed'>('collection');
  const [allPosts, setAllPosts] = useState<PostRow[]>([]);
  const [teamPosts, setTeamPosts] = useState<PostRow[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingTeam, setLoadingTeam] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setTeamId(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingAll(true);
      try {
        const p = await getPosts();
        if (!cancelled) setAllPosts(p);
      } catch (e) {
        console.error(e);
        if (!cancelled) setAllPosts([]);
      } finally {
        if (!cancelled) setLoadingAll(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mainTab !== 'myteam') return;
    let cancelled = false;
    (async () => {
      setLoadingTeam(true);
      try {
        if (!teamId) {
          if (!cancelled) setTeamPosts([]);
          return;
        }
        const p = await getTeamPosts(
          teamId,
          subtab === 'collection' ? 'collection' : 'feed'
        );
        if (!cancelled) setTeamPosts(p);
      } catch (e) {
        console.error(e);
        if (!cancelled) setTeamPosts([]);
      } finally {
        if (!cancelled) setLoadingTeam(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mainTab, teamId, subtab]);

  const currentTeam = KBO_TEAMS.find((t) => t.id === teamId);

  const selectTeam = (id: string) => {
    setTeamId(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    setPickerOpen(false);
  };

  return (
    <>
      <div className="feed-header-group">
        <div className="feed-header">
          <div className="header-left" />
          <div className="mobile-logo-container">
            <Link href="/">
              <img src="/images/logo.png" alt="크보피드 로고" className="mobile-logo" />
            </Link>
          </div>
          <div className="header-right" />
        </div>
        <div className="feed-tabs">
          <button
            type="button"
            className={`feed-tab ${mainTab === 'all' ? 'active' : ''}`}
            onClick={() => setMainTab('all')}
          >
            전체글
          </button>
          <button
            type="button"
            className={`feed-tab ${mainTab === 'myteam' ? 'active' : ''}`}
            onClick={() => setMainTab('myteam')}
          >
            내팀
          </button>
        </div>
      </div>

      <ComposePost
        onPosted={async (content) => {
          if (content && session?.user) {
            // 1. 낙관적 업데이트: 서버 응답 전 UI에 즉시 반영
            const optimisticPost = {
              id: 'tmp_' + Date.now(), // 임시 ID (ShortID는 서버에서 생성)
              content,
              createdAt: new Date().toISOString(),
              likesCount: 0,
              retweetsCount: 0,
              commentsCount: 0,
              profiles: {
                username: session.user.name || 'user',
                displayName: session.user.name || '사용자',
                avatarUrl: session.user.image,
                isVerified: false
              },
              isLiked: false,
              isRetweeted: false
            };
            setAllPosts(prev => [optimisticPost, ...prev]);
          }

          // 2. 실제 데이터 동기화 (KV 무효화 지연 고려)
          setTimeout(async () => {
            try {
              const p = await getPosts();
              setAllPosts(p);
            } catch {
              /* ignore */
            }
          }, 1000);
        }}
      />

      <div id="tab-all" className={`tab-content ${mainTab === 'all' ? 'active' : ''}`}>
        {mainTab === 'all' && (
          <div id="feed-all-container">
            {loadingAll ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
                데이터를 불러오는 중입니다...
              </div>
            ) : allPosts.length === 0 ? (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                <i
                  className="fas fa-baseball-ball"
                  style={{
                    fontSize: 48,
                    opacity: 0.1,
                    marginBottom: 16,
                    display: 'block',
                  }}
                />
                <p>
                  아직 게시글이 없습니다.
                  <br />
                  첫 소식을 전해보세요!
                </p>
              </div>
            ) : (
              <div className="feed-content">
                {allPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div id="tab-myteam" className={`tab-content ${mainTab === 'myteam' ? 'active' : ''}`}>
        {mainTab === 'myteam' && (
          <>
            <div className="myteam-info-bar">
              <div className="myteam-current">
                <img
                  src={getTeamLogo(currentTeam?.id)}
                  alt="Team"
                />
                <span className="myteam-name">
                  {currentTeam ? currentTeam.fullName : '팀을 선택하세요'}
                </span>
              </div>
              <button
                type="button"
                className="change-team-btn"
                id="open-team-picker"
                onClick={() => setPickerOpen((v) => !v)}
              >
                {pickerOpen ? '접기' : '변경'}
              </button>
            </div>

            <div
              className={`inline-team-picker ${pickerOpen ? 'active' : ''}`}
              id="inline-team-picker"
            >
              <div className="picker-scroll-container">
                {KBO_TEAMS.map((team) => (
                  <div
                    key={team.id}
                    className="team-mini-card"
                    data-team={team.fullName}
                    data-id={team.id}
                    onClick={() => selectTeam(team.id)}
                  >
                    <img src={getTeamLogo(team.id)} alt={team.shortLabel} />
                    <span>{team.shortLabel}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="myteam-sub-nav">
              <div
                className={`sub-tab ${subtab === 'collection' ? 'active' : ''}`}
                onClick={() => setSubtab('collection')}
              >
                내팀 모아보기
              </div>
              <div
                className={`sub-tab ${subtab === 'feed' ? 'active' : ''}`}
                onClick={() => setSubtab('feed')}
              >
                내팀 피드
              </div>
            </div>

            <div id="feed-myteam-container">
              {loadingTeam ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>
                  데이터를 불러오는 중입니다...
                </div>
              ) : !teamId ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                  }}
                >
                  응원하는 팀의 소식을 확인해보세요!
                </div>
              ) : teamPosts.length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                  }}
                >
                  관련 게시물이 없습니다.
                </div>
              ) : (
                <div className="feed-content">
                  {teamPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
