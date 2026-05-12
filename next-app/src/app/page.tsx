import Link from 'next/link';
import ComposePost from '@/components/feed/ComposePost';
import PostList from '@/components/feed/PostList';

export const runtime = 'edge';

export default function Home() {
  return (
    <>
      <div className="feed-header-group">
        <div className="feed-header">
          <div className="header-left"></div>
          <div className="mobile-logo-container">
            <Link href="/"><img src="/images/logo.png" alt="크보피드 로고" className="mobile-logo" /></Link>
          </div>
          <h2 className="desktop-title" style={{ flex: 2, textAlign: 'center' }}>홈</h2>
          <div className="header-right"></div>
        </div>
        <div className="feed-tabs">
          <div className="feed-tab active">전체글</div>
          <div className="feed-tab">내팀</div>
        </div>
      </div>


      {/* My Team Info Bar (Visible when logged in/team selected, for now matching index.html) */}
      <div className="myteam-info-bar">
          <div className="myteam-current">
              <img src="/images/LG트윈스.svg" alt="LG" />
              <span className="myteam-name">LG 트윈스</span>
          </div>
          <button className="change-team-btn" id="toggle-team-picker">팀 변경</button>
      </div>

      {/* Inline Team Picker (Simplified for now) */}
      <div className="inline-team-picker" id="team-picker">
          <div className="picker-scroll-container">
              {[
                { name: 'LG', file: 'LG트윈스' },
                { name: 'KT', file: 'KTWIZ' },
                { name: 'SSG', file: 'SSG랜더스' },
                { name: 'NC', file: 'NC다이노스' },
                { name: '두산', file: '두산베어스' },
                { name: 'KIA', file: 'KIA타이거즈' },
                { name: '롯데', file: '롯데자이언츠' },
                { name: '삼성', file: '삼성라이온즈' },
                { name: '한화', file: '한화이글스' },
                { name: '키움', file: '키움히어로즈' }
              ].map(team => (
                <div key={team.name} className="team-mini-card">
                    <img src={`/images/${team.file}.svg`} alt={team.name} />
                    <span>{team.name}</span>
                </div>
              ))}
          </div>
      </div>

      
      <ComposePost />
      <PostList />
    </>
  );
}
