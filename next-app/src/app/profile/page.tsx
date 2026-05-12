export const runtime = 'edge';

export default function ProfilePage() {
  return (
    <section className="profile-container" style={{ paddingTop: '0' }}>
        <div className="profile-header-new">
            <div className="profile-main-info">
                {/* Intro Row (Avatar + Name/Handle on Right) */}
                <div className="profile-intro-row">
                    <div className="profile-avatar-new" style={{ backgroundImage: "url('https://i.pravatar.cc/150?u=current')" }}></div>
                    <div className="profile-info-main">
                        <h1 className="profile-name-large">내 야구 계정</h1>
                        <p className="profile-handle-large">@my_kbo_life</p>
                        
                        {/* Team Badge */}
                        <div className="team-badge">
                            <img src="/images/LG트윈스.svg" alt="LG" />
                            <span>LG 트윈스 팬</span>
                        </div>
                    </div>
                </div>
                
                <div className="profile-meta-new">
                    <p className="profile-bio-new">
                        KBO 리그 10년차 팬 | LG 트윈스 응원 중 ⚾️ | 잠실 야구장 출석 체크! 야구 소식 공유합니다.
                    </p>

                    <div className="profile-stats-row">
                        <div className="stat-group"><b>128</b> 팔로잉</div>
                        <div className="stat-group"><b>256</b> 팔로워</div>
                    </div>
                </div>
            </div>
        </div>

        <div className="profile-nav-tabs">
            <div className="profile-nav-tab active">게시물</div>
            <div className="profile-nav-tab">답글</div>
            <div className="profile-nav-tab">미디어</div>
            <div className="profile-nav-tab">좋아요</div>
        </div>

        {/* Profile Feed Content (Dynamic) */}
        <div id="profile-feed-container">
            {/* Dynamic posts placeholder */}
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                게시물이 아직 없습니다.
            </div>
        </div>
    </section>
  );
}
