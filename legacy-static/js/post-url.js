/**
 * 게시물 canonical URL: /@핸들/글ID (서브폴더 배포 시 접두 경로 유지)
 */
(function (global) {
    function normalizeHandle(h) {
        if (h == null || h === '') return '';
        const s = decodeURIComponent(String(h)).trim();
        return s.startsWith('@') ? s.slice(1) : s;
    }

    function escapeAttr(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;');
    }

    /** 루트 기준 경로 (항상 / 로 시작) */
    function permalink(handle, postId) {
        const h = normalizeHandle(handle);
        const id = String(postId == null ? '' : postId).trim();
        if (!id) return 'post.html';
        if (!h) return 'post.html?id=' + encodeURIComponent(id);
        return `/@${encodeURIComponent(h)}/${encodeURIComponent(id)}`;
    }

    /** 현재 문서 위치 기준 (예: /kbofeed/index.html → /kbofeed/@u/1) */
    function currentSitePrefix() {
        const raw = window.location.pathname;
        const at = raw.indexOf('/@');
        if (at !== -1) {
            const pre = raw.slice(0, at).replace(/\/+$/, '');
            return pre;
        }
        const path = (raw.replace(/\/+$/, '') || '/');
        const lastSlash = path.lastIndexOf('/');
        const lastSeg = lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
        if (lastSeg.includes('.')) {
            const dir = path.slice(0, lastSlash);
            return dir.replace(/\/+$/, '') || '';
        }
        return path === '/' ? '' : path;
    }

    function permalinkHere(handle, postId) {
        const tail = permalink(handle, postId);
        const pre = currentSitePrefix();
        return pre + tail;
    }

    function parsePostRoute(pathname) {
        const parts = pathname.split('/').filter(Boolean);
        const idx = parts.findIndex((seg) => decodeURIComponent(seg).startsWith('@'));
        if (idx === -1 || idx + 1 >= parts.length) return null;
        const handle = normalizeHandle(parts[idx]);
        const postId = decodeURIComponent(parts[idx + 1]);
        if (!handle || !postId) return null;
        return { handle, postId };
    }

    function parseFromLocation() {
        const pathParsed = parsePostRoute(window.location.pathname);
        if (pathParsed) return pathParsed;
        const q = new URLSearchParams(window.location.search);
        const id = q.get('id') || q.get('postId');
        if (!id) return null;
        const handle = normalizeHandle(q.get('handle') || '');
        return { handle, postId: id };
    }

    function attachTweetClickHandlers(container) {
        if (!container) return;
        container.querySelectorAll('.tweet').forEach((tweet) => {
            tweet.onclick = () => {
                const id = tweet.getAttribute('data-id');
                const handle = tweet.getAttribute('data-handle');
                if (id && handle) {
                    window.location.href = permalinkHere(handle, id);
                } else if (id) {
                    window.location.href =
                        'post.html?id=' + encodeURIComponent(id);
                }
            };
        });
    }

    global.KBO_POST_URL = {
        normalizeHandle,
        escapeAttr,
        permalink,
        permalinkHere,
        currentSitePrefix,
        parsePostRoute,
        parseFromLocation,
        attachTweetClickHandlers,
    };
})(typeof window !== 'undefined' ? window : globalThis);
