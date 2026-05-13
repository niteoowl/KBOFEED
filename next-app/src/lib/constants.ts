export const KBO_TEAMS = [
  { id: 'LG', file: 'LG', shortLabel: 'LG', fullName: 'LG 트윈스' },
  { id: 'KIA', file: 'KIA', shortLabel: 'KIA', fullName: 'KIA 타이거즈' },
  { id: '삼성', file: '삼성', shortLabel: '삼성', fullName: '삼성 라이온즈' },
  { id: 'SSG', file: 'SSG', shortLabel: 'SSG', fullName: 'SSG 랜더스' },
  { id: '두산', file: '두산', shortLabel: '두산', fullName: '두산 베어스' },
  { id: 'NC', file: 'NC', shortLabel: 'NC', fullName: 'NC 다이노스' },
  { id: '한화', file: '한화', shortLabel: '한화', fullName: '한화 이글스' },
  { id: '롯데', file: '롯데', shortLabel: '롯데', fullName: '롯데 자이언츠' },
  { id: 'KT', file: 'KT', shortLabel: 'KT', fullName: 'KT 위즈' },
  { id: '키움', file: '키움', shortLabel: '키움', fullName: '키움 히어로즈' },
] as const;

export function getTeamLogo(teamId: string | null | undefined): string {
  if (!teamId) return '/images/logo.png';
  const team = KBO_TEAMS.find(t => t.id === teamId);
  if (!team) return '/images/logo.png';
  return `/images/${team.file}.svg`;
}
