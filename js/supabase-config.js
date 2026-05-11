// Supabase Configuration
(function() {
    const supabaseUrl = 'https://zwjfaepctxoazrbcosix.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3amZhZXBjdHhvYXpyYmNvc2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMzkyNzQsImV4cCI6MjA5MzkxNTI3NH0.JmnJDnfyyas21lWkIV5ORYE8BdqCbw2eJCDLvu2Gj6w';
    
    // 전역 변수 충돌 방지를 위해 window 객체에 할당
    if (!window.kboSupabase) {
        // window.supabase는 CDN에서 로드된 라이브러리 자체임
        window.kboSupabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
            auth: {
                storage: window.localStorage,
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false
            }
        });
    }

    // 하위 호환성을 위해 supabase 변수가 선언되어 있지 않을 때만 할당 (에러 방지)
    // var를 사용하여 재선언 에러 회피
    if (typeof supabase === 'undefined') {
        window.supabase = window.kboSupabase;
    }
})();

// 인증 상태 체크 유틸리티 (중복 제거를 위해 여기서 통합 관리 가능하지만, auth.js에서 주로 처리)
async function getKboSession() {
    const { data: { session } } = await window.kboSupabase.auth.getSession();
    return session;
}
