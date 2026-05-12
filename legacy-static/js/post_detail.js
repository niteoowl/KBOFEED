/**
 * post_detail.js - Handles single post view and comments
 */

const PostDetailManager = {
    async init() {
        console.log('[KBO Feed] Initializing PostDetail');
        let parsed = window.KBO_POST_URL?.parseFromLocation?.();
        if (!parsed?.postId) {
            const q = new URLSearchParams(window.location.search);
            const qid = q.get('id');
            parsed = qid ? { handle: '', postId: qid } : null;
        }

        if (!parsed?.postId) {
            alert('게시물을 찾을 수 없습니다.');
            window.location.href = 'index.html';
            return;
        }

        const postId = parsed.postId;
        const openedViaPostHtmlQuery =
            window.location.pathname.includes('post.html') &&
            new URLSearchParams(window.location.search).has('id');

        try {
            // UI가 초기화될 때까지 잠시 대기
            if (!document.querySelector('.main-feed')) {
                await new Promise(resolve => setTimeout(resolve, 150));
            }

            console.log(`[KBO Feed] Fetching Post ID: ${postId}`);

            const { data: post, error } = await window.kboSupabase
                .from('posts')
                .select(`
                    *,
                    profiles!posts_user_id_fkey (
                        username,
                        display_name,
                        avatar_url,
                        bio,
                        is_verified
                    ),
                    retweet_post:retweet_id (
                        content,
                        image_url,
                        profiles!posts_user_id_fkey (
                            username,
                            display_name,
                            is_verified
                        )
                    )
                `)
                .eq('id', /^\d+$/.test(String(postId)) ? parseInt(String(postId), 10) : postId)
                .maybeSingle(); // single() 대신 maybeSingle()로 에러 방지

            if (error) {
                console.error('Supabase Fetch Error:', error);
                throw error;
            }

            if (!post) {
                console.warn('Post not found');
                document.getElementById('main-post-container').innerHTML = 
                    '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">게시물을 찾을 수 없습니다. 삭제되었거나 존재하지 않는 게시물입니다.</div>';
                return;
            }

            const authorHandle = post.profiles?.username;
            if (
                window.KBO_POST_URL &&
                authorHandle &&
                !openedViaPostHtmlQuery
            ) {
                const canon = window.KBO_POST_URL.permalinkHere(authorHandle, post.id);
                const norm = (p) => (p || '').replace(/\/+$/, '') || '/';
                if (norm(window.location.pathname) !== norm(canon)) {
                    history.replaceState(null, '', canon);
                }
            }

            this.renderMainPost(post);
            this.fetchComments(post.id);

        } catch (error) {
            console.error('Post Detail Error:', error);
            document.getElementById('main-post-container').innerHTML = 
                `<div style="padding: 40px; text-align: center; color: #ff3b30;">오류 발생: ${error.message || '데이터를 불러올 수 없습니다.'}</div>`;
        }
    },

    renderMainPost(post) {
        const container = document.getElementById('main-post-container');
        if (!container) return;

        let displayContent = post.content || '';
        let displayImage = post.image_url;
        let originalAuthor = null;

        if (post.retweet_id && post.retweet_post) {
            displayContent = post.retweet_post.content || '';
            displayImage = post.retweet_post.image_url;
            originalAuthor = post.retweet_post.profiles?.display_name || post.retweet_post.profiles?.username || '알 수 없는 유저';
        }

        container.innerHTML = `
            <article class="post-detail">
                <div class="post-detail-header">
                    <div class="user-avatar" style="background-image: url('${post.profiles?.avatar_url || '/images/logo.png'}'); width: 48px; height: 48px; background-size: cover; border-radius: 50%;"></div>
                    <div class="user-info">
                        <div class="display-name" style="font-weight: 800; font-size: 16px; color: var(--text-primary); display: flex; align-items: center; gap: 4px;">
                            ${post.profiles?.display_name}
                            ${post.profiles?.is_verified ? '<i class="fas fa-check-circle verified" style="color: var(--primary-color); font-size: 14px;"></i>' : ''}
                        </div>
                        <div class="username" style="color: var(--text-secondary); font-size: 15px;">@${post.profiles?.username}</div>
                    </div>
                </div>
                
                <div class="post-detail-content" style="padding: 16px 20px; font-size: 22px; line-height: 1.35; color: var(--text-primary); word-break: break-word;">
                    ${displayContent}
                    ${displayImage ? `<div class="post-detail-media" style="margin-top: 12px;"><img src="${displayImage}" style="width: 100%; border-radius: 16px; border: 1px solid var(--border-color);"></div>` : ''}
                    ${originalAuthor ? `<div class="retweet-credit" style="font-size: 14px; color: var(--text-secondary); margin-top: 12px; display: flex; align-items: center; gap: 6px;"><i class="fas fa-retweet"></i> @${originalAuthor}님의 글</div>` : ''}
                </div>

                <div class="post-detail-meta" style="padding: 16px 20px; color: var(--text-secondary); font-size: 15px; border-bottom: 1px solid var(--border-color);">
                    ${new Date(post.created_at).toLocaleString('ko-KR', { hour12: true, hour: 'numeric', minute: 'numeric', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>

                <div class="tweet-actions" style="display: flex; justify-content: space-around; padding: 12px 0; border-bottom: 1px solid var(--border-color); color: var(--text-secondary);">
                    <div class="action-item action-comment" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <i class="far fa-comment" style="font-size: 18px;"></i> <span>0</span>
                    </div>
                    <div class="action-item action-retweet" onclick="FeedManager.handleRetweet(this, '${post.id}')" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-retweet" style="font-size: 18px;"></i> <span>${post.retweets_count || 0}</span>
                    </div>
                    <div class="action-item action-like" onclick="FeedManager.handleLike(this, '${post.id}')" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <i class="far fa-heart" style="font-size: 18px;"></i> <span>${post.likes_count || 0}</span>
                    </div>
                    <div class="action-item action-share" style="cursor: pointer;">
                        <i class="far fa-share-square" style="font-size: 18px;"></i>
                    </div>
                </div>
            </article>

            <div class="reply-compose" style="display: flex; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--border-color);">
                <div class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; background-color: #eee;"></div>
                <div class="reply-input-wrapper" style="flex: 1;">
                    <textarea placeholder="답글 게시하기" style="width: 100%; border: none; outline: none; font-size: 18px; resize: none;"></textarea>
                    <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
                        <button style="background: var(--primary-color); color: white; border: none; padding: 8px 16px; border-radius: 99px; font-weight: 700; cursor: pointer;">답글</button>
                    </div>
                </div>
            </div>
        `;
    },

    async fetchComments(postId) {
        const container = document.getElementById('replies-container');
        if (!container) return;

        try {
            const { data: comments, error } = await window.kboSupabase
                .from('comments')
                .select(`
                    *,
                    profiles!comments_user_id_fkey (
                        username,
                        display_name,
                        avatar_url,
                        is_verified
                    )
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (!comments || comments.length === 0) {
                container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-secondary);">첫 댓글을 남겨보세요!</div>';
                return;
            }

            container.innerHTML = comments.map(comment => `
                <div class="comment-item" style="padding: 16px; border-bottom: 1px solid var(--border-color); display: flex; gap: 12px;">
                    <div class="user-avatar" style="background-image: url('${comment.profiles?.avatar_url || '/images/logo.png'}'); width: 36px; height: 36px; background-size: cover; border-radius: 50%;"></div>
                    <div class="comment-body">
                        <div class="comment-header" style="display: flex; gap: 8px; align-items: center;">
                            <span style="font-weight: 700;">${comment.profiles?.display_name}</span>
                            <span style="color: var(--text-secondary); font-size: 13px;">@${comment.profiles?.username}</span>
                        </div>
                        <div class="comment-text" style="margin-top: 4px;">${comment.content}</div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Comments Load Error:', error);
        }
    }
};

const bootstrapPostDetail = () => {
    PostDetailManager.init();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapPostDetail);
} else {
    bootstrapPostDetail();
}
