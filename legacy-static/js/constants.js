/**
 * constants.js - 전역 상수 및 공통 유틸리티
 */
const KBO_CONSTANTS = {
    API_BASE_URL: 'https://kboserver.vercel.app/api/kbo',
    
    TEAM_LOGO_MAP: {
        'LG': 'LG트윈스.svg', 'KIA': 'KIA타이거즈.svg', '삼성': '삼성라이온즈.svg', 'SSG': 'SSG랜더스.svg',
        '두산': '두산베어스.svg', 'NC': 'NC다이노스.svg', '한화': '한화이글스.svg', '롯데': '롯데자이언츠.svg',
        'KT': 'KTWIZ.svg', '키움': '키움히어로즈.svg', 'SS': '삼성라이온즈.svg', 'OB': '두산베어스.svg',
        'HT': 'KIA타이거즈.svg', 'SK': 'SSG랜더스.svg', 'LT': '롯데자이언츠.svg', 'WO': '키움히어로즈.svg'
    },

    TEAM_COLOR_MAP: {
        'LG': '#8B001B', 'KIA': '#9D0124', '삼성': '#053673', 'SSG': '#A30B24',
        '두산': '#0E0D24', 'NC': '#05142B', '한화': '#E65C00', '롯데': '#001F40',
        'KT': '#000000', '키움': '#63001C'
    },

    TEAM_NAME_MAP: {
        'HH': '한화', 'HT': 'KIA', 'SS': '삼성', 'OB': '두산', 'LG': 'LG',
        'SK': 'SSG', 'LT': '롯데', 'WO': '키움', 'KT': 'KT', 'NC': 'NC'
    },

    VENUE_MAP: {
        'LG': '잠실', '두산': '잠실', '키움': '고척', 'SSG': '문학',
        'KT': '수원', '한화': '대전', '삼성': '대구', '롯데': '사직',
        'KIA': '광주', 'NC': '창원'
    }
};

// 공통 유틸리티 함수
const KBO_UTILS = {
    getLogoUrl(teamName, emblemUrl) {
        if (!teamName) return '/images/logo.png';
        const upperName = teamName.toUpperCase().trim();
        const cleanName = upperName.replace(/(트윈스|타이거즈|라이온즈|랜더스|베어스|다이노스|이글스|자이언츠|위즈)/g, '').trim();
        const filename = KBO_CONSTANTS.TEAM_LOGO_MAP[cleanName] || KBO_CONSTANTS.TEAM_LOGO_MAP[upperName] || KBO_CONSTANTS.TEAM_LOGO_MAP[teamName];
        if (filename) return `/images/${filename}`;
        return emblemUrl || '/images/logo.png';
    },

    getTeamColor(teamName) {
        if (!teamName) return '#2C5DBE';
        for (const [name, color] of Object.entries(KBO_CONSTANTS.TEAM_COLOR_MAP)) {
            if (teamName.includes(name)) return color;
        }
        return '#2C5DBE';
    },

    getVenue(teamName) {
        if (!teamName) return '경기장';
        const cleanName = teamName.replace(/(트윈스|타이거즈|라이온즈|랜더스|베어스|다이노스|이글스|자이언츠|위즈)/g, '').trim();
        return KBO_CONSTANTS.VENUE_MAP[cleanName] || '경기장';
    }
};
