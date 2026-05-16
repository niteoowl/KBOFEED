-- 1. 프로필 커버 이미지 컬럼 추가
ALTER TABLE profiles ADD COLUMN cover_url TEXT;

-- 2. 게시글 조회수 컬럼 추가
ALTER TABLE posts ADD COLUMN views_count INTEGER DEFAULT 0;

-- 3. 댓글 ID(Integer -> Text ShortID) 구조 변경을 위한 테이블 재생성 및 데이터 마이그레이션
CREATE TABLE comments_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 기존 데이터 복사 (ID를 문자열로 변환)
INSERT INTO comments_new (id, user_id, post_id, content, created_at)
SELECT CAST(id AS TEXT), user_id, post_id, content, created_at FROM comments;

-- 기존 테이블 삭제 및 이름 변경
DROP TABLE comments;
ALTER TABLE comments_new RENAME TO comments;

-- Bookmarks and pinned post (see drizzle/0003_bookmarks_pin.sql)
CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_post_unique ON bookmarks(user_id, post_id);
ALTER TABLE profiles ADD COLUMN pinned_post_id TEXT REFERENCES posts(id) ON DELETE SET NULL;
