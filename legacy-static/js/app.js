document.addEventListener('DOMContentLoaded', () => {
    console.log('KBO Feed App Initialized');

    // UI Manager Initialization
    if (window.UIManager) {
        window.UIManager.init();
    }

    // Event Delegation for all interactive elements
    document.addEventListener('click', (e) => {
        const target = e.target;

        // Tab Switching Logic (홈·프로필 등 — 검색 결과 상단 탭은 search.js 전용)
        if (target.closest('.feed-tab') || target.closest('.profile-nav-tab')) {
            const tab = target.closest('.feed-tab') || target.closest('.profile-nav-tab');
            if (tab.classList.contains('feed-tab') && tab.closest('.search-tabs')) {
                return;
            }

            const tabContainer = tab.parentElement;
            const targetId = tab.dataset.tab;

            // Update UI
            tabContainer.querySelectorAll('.feed-tab, .profile-nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Toggle Content — 홈의 전체글/내팀 등 #tab-* 만 해당
            if (targetId) {
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                const targetContent = document.getElementById(`tab-${targetId}`);
                if (targetContent) targetContent.classList.add('active');
            }
        }

        // Team Picker Toggle (Inline) — 구단 선택은 feed.js에서 처리
        if (target.closest('#open-team-picker')) {
            const picker = document.getElementById('inline-team-picker');
            if (picker) {
                picker.classList.toggle('active');
                const btn = target.closest('#open-team-picker');
                btn.textContent = picker.classList.contains('active') ? '접기' : '변경';
            }
        }

        // Post Modal Logic
        if (target.closest('.post-btn') || target.closest('#open-modal-trigger') || target.closest('.compose-trigger')) {
            const modal = document.getElementById('post-modal');
            if (modal) {
                modal.classList.add('active');
                const textarea = modal.querySelector('textarea');
                if (textarea) textarea.focus();
            }
        }

        // Close Modal Logic
        if (target.closest('#close-modal-btn') || (target.classList.contains('modal-overlay') && !target.closest('.bottom-modal'))) {
            const modal = document.getElementById('post-modal');
            if (modal) {
                modal.classList.remove('active');
            }
        }

        // Post Interaction (Heart/RT Toggling)
        if (target.closest('.nav-item')) {
            const navItem = target.closest('.nav-item');
            if (navItem.classList.contains('like') || navItem.classList.contains('rt')) {
                navItem.classList.toggle('active');
                const label = navItem.querySelector('.label');
                if (label) {
                    let count = parseInt(label.textContent);
                    if (navItem.classList.contains('active')) {
                        label.textContent = count + 1;
                    } else {
                        label.textContent = Math.max(0, count - 1);
                    }
                }
            }
        }

        // Navigation (Internal Links for Demo)
        if (target.closest('.nav-link') || target.closest('.tweet-content') || target.closest('.user-avatar')) {
            // This would normally be handled by the browser for <a> tags,
            // but we add it here if we use programmatic navigation.
        }
    });

    // Interaction State Handlers
    window.toggleActive = function(element) {
        element.classList.toggle('active');
    };

    // Note: Scroll logic is now handled in ui.js for hybrid header behavior.

    // Search Interaction Logic
    let searchJustOpened = false;
    document.addEventListener('focusin', (e) => {
        if (e.target.id && e.target.id.includes('search-input')) {
            // Ensure header is visible when focusing
            const header = document.querySelector('.feed-header-group');
            const searchBar = document.querySelector('.mobile-search-container');
            if (header) header.classList.remove('header-hidden');
            if (searchBar) searchBar.classList.remove('header-hidden');

            // Find suggestions in the common parent (search-container or mobile-search-container)
            const parent = e.target.closest('.search-container, .mobile-search-container');
            const suggestions = parent ? parent.querySelector('.search-suggestions') : null;
            if (suggestions) {
                suggestions.classList.add('active');
                document.body.classList.add('search-open');
                searchJustOpened = true;
                setTimeout(() => { searchJustOpened = false; }, 300);
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (searchJustOpened) return;

        // Hide suggestions when clicking outside (PC 우측 .search-container 포함)
        const inSearchUi = e.target.closest('.mobile-search-container')
            || e.target.closest('.search-container')
            || e.target.closest('.search-suggestions');
        if (!inSearchUi) {
            document.querySelectorAll('.search-suggestions').forEach(s => s.classList.remove('active'));
            document.body.classList.remove('search-open');
        }

        // Clear button logic
        if (e.target.id === 'search-clear-btn') {
            const input = document.getElementById('mobile-search-input');
            if (input) {
                input.value = '';
                input.focus();
                e.target.style.display = 'none';
            }
        }

        // Back button logic
        if (e.target.id === 'search-back-btn' || e.target.closest('#search-back-btn')) {
            document.querySelectorAll('.search-suggestions').forEach(s => s.classList.remove('active'));
            document.body.classList.remove('search-open');
            const input = document.getElementById('mobile-search-input');
            if (input) {
                input.value = '';
                input.blur();
            }
        }

        // Close search when clicking a suggestion → 검색 결과로 이동
        if (e.target.closest('.suggestion-item')) {
            document.querySelectorAll('.search-suggestions').forEach(s => s.classList.remove('active'));
            document.body.classList.remove('search-open');
            const nameEl = e.target.closest('.suggestion-item').querySelector('.suggestion-name');
            const raw = nameEl ? nameEl.textContent.trim() : '';
            const q = raw.replace(/^#/, '').trim();
            if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
        }
    });

    // Input event for clear button visibility
    document.addEventListener('input', (e) => {
        if (e.target.id === 'mobile-search-input') {
            const clearBtn = document.getElementById('search-clear-btn');
            if (clearBtn) {
                clearBtn.style.display = e.target.value.length > 0 ? 'block' : 'none';
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.id && e.target.id.includes('search-input')) {
            const query = e.target.value.trim();
            if (query) {
                const parent = e.target.closest('.search-container, .mobile-search-container');
                const suggestions = parent ? parent.querySelector('.search-suggestions') : null;
                if (suggestions) suggestions.classList.remove('active');
                
                // Redirect to search results
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        }
    });
});
