import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SongsClient from './SongsClient';

export const dynamic = 'force-dynamic';

export default async function SongsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch student progress log containing favorited and completed states
  const { data: progressRows } = await supabase
    .from('user_day_progress')
    .select('day_number, song_done, song_favorited')
    .eq('user_id', user.id);

  // Load songs catalog
  const songsCatalog = require('@/data/songs.json');

  return (
    <SongsClient
      songsCatalog={songsCatalog}
      initialProgress={progressRows || []}
    />
  );
}
