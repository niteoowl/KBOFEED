// ── Use window.kboSupabase ──
(function () {
    'use strict';

    const sb = () => window.kboSupabase;

    /* ───────────────────────────
       HELPERS
    ─────────────────────────── */
    function showError(container, message) {
        if (!container) return;
        let el = container.querySelector('.auth-error-msg');
        if (!el) {
            el = document.createElement('div');
            el.className = 'auth-error-msg';
            el.style.cssText =
                'background:rgba(255,59,48,.12);color:#ff3b30;padding:12px 16px;' +
                'border-radius:12px;font-size:14px;margin-bottom:14px;text-align:center;' +
                'animation:fadeIn .2s ease';
            const form = container.querySelector('.auth-form') || container.querySelector('.social-auth');
            if (form) form.parentNode.insertBefore(el, form);
            else container.prepend(el);
        }
        el.textContent = message;
        el.style.display = 'block';
    }

    function hideError(container) {
        if (!container) return;
        const el = container.querySelector('.auth-error-msg');
        if (el) el.style.display = 'none';
    }

    function setLoading(btn, loading) {
        if (!btn) return;
        if (loading) {
            btn.dataset.originalText = btn.textContent;
            btn.textContent = '처리 중...';
            btn.disabled = true;
            btn.style.opacity = '0.7';
        } else {
            btn.textContent = btn.dataset.originalText || btn.textContent;
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    }

    function translateAuthError(error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('invalid login')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
        if (msg.includes('email not confirmed')) return '이메일 인증이 필요합니다. 메일함을 확인하세요.';
        if (msg.includes('user already registered')) return '이미 가입된 이메일입니다.';
        if (msg.includes('password') && msg.includes('6')) return '비밀번호는 6자 이상이어야 합니다.';
        if (msg.includes('rate limit')) return '요청이 너무 많습니다. 잠시 후 다시 시도하세요.';
        if (msg.includes('email')) return '유효한 이메일 주소를 입력하세요.';
        return error.message || '알 수 없는 오류가 발생했습니다.';
    }

    /* ───────────────────────────
       GOOGLE LOGIN
    ─────────────────────────── */
    async function loginWithGoogle() {
        const { error } = await sb().auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/index.html'
            }
        });
        if (error) {
            console.error('Google OAuth error:', error);
            const box = document.querySelector('.auth-box');
            if (box) showError(box, '구글 로그인 중 오류가 발생했습니다.');
        }
    }

    /* ───────────────────────────
       EMAIL LOGIN
    ─────────────────────────── */
    async function loginWithEmail(email, password, container) {
        const { data, error } = await sb().auth.signInWithPassword({
            email,
            password
        });
        if (error) {
            showError(container, translateAuthError(error));
            return null;
        }
        return data;
    }

    /* ───────────────────────────
       EMAIL SIGN-UP
    ─────────────────────────── */
    async function signUpWithEmail(email, password, displayName, username, favoriteTeam, container) {
        // SQL 트리거(handle_new_user)가 Auth 유저 생성 시 
        // profiles 테이블에 데이터를 자동으로 넣어줍니다.
        // 우리는 metadata에 값만 정확히 실어 보내면 됩니다.
        const { data, error } = await sb().auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName,
                    username: username,
                    favorite_team: favoriteTeam
                }
            }
        });

        if (error) {
            showError(container, translateAuthError(error));
            return null;
        }

        return data;
    }

    /* ───────────────────────────
       ENSURE PROFILE (SQL 트리거 미작동 대비 및 기존 유저 복구용)
    ─────────────────────────── */
    async function ensureProfile(user) {
        if (!user) return;
        
        try {
            const { data: existing, error } = await sb()
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle(); // single() 대신 maybeSingle() 사용으로 에러 방지

            if (!existing) {
                console.log('[KBO Feed] Profile missing for existing user, creating...');
                const meta = user.user_metadata || {};
                const { error: insertError } = await sb().from('profiles').insert({
                    id: user.id,
                    username: meta.username || meta.preferred_username || meta.email?.split('@')[0] || 'user_' + user.id.slice(0, 5),
                    display_name: meta.display_name || meta.full_name || '새로운 탐험가',
                    avatar_url: meta.avatar_url || null,
                    bio: '반갑습니다! 야구팬입니다.',
                    favorite_team: meta.favorite_team || null
                });
                
                if (insertError) console.error('[KBO Feed] Auto profile creation failed:', insertError);
                else console.log('[KBO Feed] Profile created successfully.');
            }
        } catch (err) {
            console.error('[KBO Feed] ensureProfile Error:', err);
        }
    }

    /* ───────────────────────────
       INITIALIZERS
    ─────────────────────────── */
    function initLoginPage() {
        const form = document.getElementById('login-form') || document.querySelector('.auth-form');
        const googleBtn = document.getElementById('google-login-btn') || document.querySelector('.social-btn.google');
        const container = document.querySelector('.auth-box');

        if (!form) return;
        form.removeAttribute('action');

        if (googleBtn) {
            googleBtn.onclick = (e) => { e.preventDefault(); loginWithGoogle(); };
        }

        form.onsubmit = async (e) => {
            e.preventDefault();
            hideError(container);

            const email = document.getElementById('login-email')?.value.trim();
            const password = document.getElementById('login-password')?.value;
            const submitBtn = document.getElementById('login-submit-btn') || form.querySelector('.auth-submit-btn');

            if (!email || !password) {
                showError(container, '이메일과 비밀번호를 입력하세요.');
                return;
            }

            setLoading(submitBtn, true);
            const result = await loginWithEmail(email, password, container);
            setLoading(submitBtn, false);

            if (result && result.session) {
                localStorage.setItem('isLoggedIn', 'true');
                window.location.href = '/index.html';
            }
        };
    }

    function initSignupPage() {
        const form = document.getElementById('signup-form') || document.querySelector('.auth-form');
        const container = document.querySelector('.auth-box');

        if (!form) return;
        form.removeAttribute('action');

        form.onsubmit = async (e) => {
            e.preventDefault();
            hideError(container);

            const displayName = document.getElementById('signup-displayname')?.value.trim();
            const username = document.getElementById('signup-username')?.value.trim();
            const email = document.getElementById('signup-email')?.value.trim();
            const password = document.getElementById('signup-password')?.value;
            const passwordConfirm = document.getElementById('signup-password-confirm')?.value;
            const submitBtn = document.getElementById('signup-submit-btn') || form.querySelector('.auth-submit-btn');
            const favoriteTeam = form.querySelector('input[name="team"]:checked')?.value;

            if (password !== passwordConfirm) {
                showError(container, '비밀번호가 일치하지 않습니다.');
                return;
            }

            if (!favoriteTeam) {
                showError(container, '응원하는 팀을 선택해주세요.');
                return;
            }

            setLoading(submitBtn, true);
            const result = await signUpWithEmail(email, password, displayName, username, favoriteTeam, container);
            setLoading(submitBtn, false);

            if (result) {
                if (result.session) {
                    localStorage.setItem('isLoggedIn', 'true');
                    window.location.href = '/index.html';
                } else {
                    container.innerHTML = `
                        <div style="text-align:center;padding:40px 20px;">
                            <div style="font-size:48px;margin-bottom:16px;">📧</div>
                            <h2 style="color:var(--text-primary);margin-bottom:12px;">이메일을 확인하세요</h2>
                            <p style="color:var(--text-secondary);font-size:15px;line-height:1.5;">
                                <strong>${email}</strong>으로 인증 메일을 보냈습니다.<br>
                                메일 내 링크를 클릭하면 가입이 완료됩니다.
                            </p>
                            <a href="login.html" style="display:inline-block;margin-top:24px;padding:12px 32px;
                                background:var(--primary-color);color:#fff;border-radius:99px;text-decoration:none;
                                font-weight:700;">로그인 페이지로</a>
                        </div>`;
                }
            }
        };
    }

    function initAuthListener() {
        const client = sb();
        if (!client) {
            console.error('Supabase client not found');
            return;
        }
        client.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                localStorage.setItem('isLoggedIn', 'true');
                await ensureProfile(session.user);
            }
            if (event === 'SIGNED_OUT') {
                localStorage.removeItem('isLoggedIn');
            }
        });
    }

    /* ───────────────────────────
       BOOTSTRAP
    ─────────────────────────── */
    const runInit = () => {
        initAuthListener();
        const page = document.body.getAttribute('data-page');
        
        if (page === 'login') initLoginPage();
        else if (page === 'signup') initSignupPage();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runInit);
    } else {
        runInit();
    }

    window.logoutUser = async function () {
        await sb().auth.signOut();
        localStorage.removeItem('isLoggedIn');
        window.location.href = '/login.html';
    };

})();
