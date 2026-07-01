import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import LibraryClient from './LibraryClient';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/auth/callback');
  }

  // Fetch all words from the library
  const { data: words } = await supabase
    .from('word_library')
    .select('*')
    .order('word', { ascending: true });

  // Fetch student's progress in library
  const { data: progress } = await supabase
    .from('library_progress')
    .select('*')
    .eq('user_id', user.id);

  return (
    <LibraryClient
      profile={profile}
      words={words || []}
      initialProgress={progress || []}
    />
  );
}
