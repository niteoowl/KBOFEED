import { getProfile, getUserPosts } from '@/app/actions/user';
import ProfilePageContent from '@/components/feed/ProfilePageContent';
import { notFound } from 'next/navigation';

export const runtime = 'edge';

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  if (username === '_not-found') notFound();

  const decodedUsername = decodeURIComponent(username).replace(/^@/, '');
  
  const profile = await getProfile(decodedUsername);
  if (!profile) {
    notFound();
  }

  const posts = await getUserPosts(profile.id);

  return <ProfilePageContent profile={profile} initialPosts={posts} />;
}
