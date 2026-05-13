import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default async function ProfileRedirectPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/login');
  }

  // ★ username (핸들)을 사용해야 함 (name은 표시 이름)
  const username = (session.user as any).username || session.user.name;
  if (!username) {
    redirect('/login');
  }

  // SNS 관습: /profile 접속 시 자신의 /@유저네임 페이지로 이동
  redirect(`/@${username}`);
}
