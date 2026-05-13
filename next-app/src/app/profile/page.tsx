import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default async function ProfileRedirectPage() {
  const session = await auth();
  
  if (!session?.user?.name) {
    redirect('/login');
  }

  // SNS 관습: /profile 접속 시 자신의 /@유저네임 페이지로 이동
  redirect(`/@${session.user.name}`);
}
