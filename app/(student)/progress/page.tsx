import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProgressClient from './ProgressClient';

export const dynamic = 'force-dynamic';

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/auth/callback');
  }

  // 2. Fetch all user day progress rows
  const { data: progressList } = await supabase
    .from('user_day_progress')
    .select('*')
    .eq('user_id', user.id)
    .order('day_number', { ascending: true });

  // 3. Fetch count of learned vocabulary
  const { count: learnedVocabCount } = await supabase
    .from('user_vocab_progress')
    .select('word_index', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('learned', true);

  // Calculate statistics
  const totalDays = progressList?.length || 0;
  
  // A day is fully complete if all 6 items are done
  const completedDaysList = (progressList || []).filter(p => 
    p.vocab_done && p.grammar_done && p.song_done && p.listening_done && p.writing_done && p.speaking_done
  );
  const completedDaysCount = completedDaysList.length;

  const songsDoneCount = (progressList || []).filter(p => p.song_done).length;
  const videosDoneCount = (progressList || []).filter(p => p.listening_done).length;

  // Prepare chart data for diary word count over time (only days with writing completed)
  const chartData = (progressList || [])
    .filter(p => p.diary_word_count && p.diary_word_count > 0)
    .map(p => ({
      day: `Day ${p.day_number}`,
      words: p.diary_word_count,
    }));

  return (
    <ProgressClient
      profile={profile}
      completedCount={completedDaysCount}
      wordsLearnedCount={learnedVocabCount || 0}
      songsCount={songsDoneCount}
      videosCount={videosDoneCount}
      chartData={chartData}
    />
  );
}
