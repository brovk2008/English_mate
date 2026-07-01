// app/(student)/games/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GamesHubClient from './GamesHubClient';

export const dynamic = 'force-dynamic';

export default async function GamesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch high scores for each game
  const { data: scores } = await supabase
    .from('game_scores')
    .select('game_id, score')
    .eq('user_id', user.id);

  const highScores = {
    word_blitz: 0,
    sakura_match: 0,
    scramble_sprint: 0
  };

  scores?.forEach(s => {
    const gid = s.game_id as keyof typeof highScores;
    if (gid in highScores) {
      highScores[gid] = Math.max(highScores[gid], s.score);
    }
  });

  return (
    <GamesHubClient highScores={highScores} />
  );
}
