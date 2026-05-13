-- ===================================================
-- Migration: posts.id INTEGER → TEXT (8자리 62진수 ShortID)
-- ===================================================
-- ⚠️ SQLite는 ALTER COLUMN을 지원하지 않으므로 테이블 재생성이 필요합니다.
-- 이 마이그레이션은 기존 데이터가 있는 경우 실행하세요.
-- 신규 배포라면 d1-schema.sql 만 사용하면 됩니다.

-- 1. 기존 테이블 백업 및 재생성
-- 주의: 이 스크립트를 실행하기 전에 D1 콘솔에서 백업을 권장합니다.

-- Step 1: 새 posts 테이블 생성
CREATE TABLE IF NOT EXISTS posts_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    team_tag TEXT,
    retweet_id TEXT,
    likes_count INTEGER DEFAULT 0,
    retweets_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (retweet_id) REFERENCES posts_new(id) ON DELETE SET NULL
);

-- Step 2: 기존 데이터 복사 (INTEGER id → TEXT로 변환)
INSERT INTO posts_new (id, user_id, content, image_url, team_tag, retweet_id, likes_count, retweets_count, comments_count, created_at)
SELECT CAST(id AS TEXT), user_id, content, image_url, team_tag, CAST(retweet_id AS TEXT), likes_count, retweets_count, comments_count, created_at
FROM posts;

-- Step 3: 관련 테이블들의 post_id도 TEXT로 변환
-- likes
CREATE TABLE IF NOT EXISTS likes_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts_new(id) ON DELETE CASCADE
);
INSERT INTO likes_new (id, user_id, post_id, created_at)
SELECT id, user_id, CAST(post_id AS TEXT), created_at FROM likes;

-- retweets
CREATE TABLE IF NOT EXISTS retweets_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts_new(id) ON DELETE CASCADE
);
INSERT INTO retweets_new (id, user_id, post_id, created_at)
SELECT id, user_id, CAST(post_id AS TEXT), created_at FROM retweets;

-- comments
CREATE TABLE IF NOT EXISTS comments_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    post_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts_new(id) ON DELETE CASCADE
);
INSERT INTO comments_new (id, user_id, post_id, content, created_at)
SELECT id, user_id, CAST(post_id AS TEXT), content, created_at FROM comments;

-- notifications
CREATE TABLE IF NOT EXISTS notifications_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receiver_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    type TEXT NOT NULL,
    post_id TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receiver_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts_new(id) ON DELETE CASCADE
);
INSERT INTO notifications_new (id, receiver_id, sender_id, type, post_id, is_read, created_at)
SELECT id, receiver_id, sender_id, type, CAST(post_id AS TEXT), is_read, created_at FROM notifications;

-- Step 4: 기존 트리거 삭제
DROP TRIGGER IF EXISTS increment_comment_count;
DROP TRIGGER IF EXISTS decrement_comment_count;

-- Step 5: 기존 테이블 삭제 & 새 테이블로 이름 변경
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS retweets;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS posts;

ALTER TABLE posts_new RENAME TO posts;
ALTER TABLE likes_new RENAME TO likes;
ALTER TABLE retweets_new RENAME TO retweets;
ALTER TABLE comments_new RENAME TO comments;
ALTER TABLE notifications_new RENAME TO notifications;

-- Step 6: 트리거 재생성
CREATE TRIGGER IF NOT EXISTS increment_comment_count
AFTER INSERT ON comments
BEGIN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
END;

CREATE TRIGGER IF NOT EXISTS decrement_comment_count
AFTER DELETE ON comments
BEGIN
    UPDATE posts SET comments_count = MAX(0, comments_count - 1) WHERE id = OLD.post_id;
END;

-- Step 7: 인덱스 재생성
CREATE UNIQUE INDEX IF NOT EXISTS likes_user_post_unique ON likes(user_id, post_id);
CREATE UNIQUE INDEX IF NOT EXISTS retweets_user_post_unique ON retweets(user_id, post_id);
