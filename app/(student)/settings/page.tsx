import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // 1. Fetch student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/auth/callback');
  }

  // 2. Fetch stats: count of completed days
  const { count: completedDays } = await supabase
    .from('user_day_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('vocab_done', true)
    .eq('grammar_done', true)
    .eq('song_done', true)
    .eq('listening_done', true)
    .eq('writing_done', true)
    .eq('speaking_done', true);

  // 3. Fetch stats: count of vocabulary words learned
  const { count: vocabLearned } = await supabase
    .from('user_vocab_progress')
    .select('word_index', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('learned', true);

  // 4. Fetch total diary word count written
  const { data: progressList } = await supabase
    .from('user_day_progress')
    .select('diary_word_count')
    .eq('user_id', user.id);

  const totalWordsWritten = progressList?.reduce((sum, item) => sum + (item.diary_word_count || 0), 0) || 0;

  // 5. Fetch achievements badges count
  const { data: achievements } = await supabase
    .from('achievements')
    .select('badge_id')
    .eq('user_id', user.id);

  const stats = {
    daysCompleted: completedDays || 0,
    wordsLearned: vocabLearned || 0,
    totalWordsWritten,
    badgesEarned: achievements?.map(a => a.badge_id) || [],
    startDate: profile.start_date
  };

  return (
    <SettingsClient profile={profile} stats={stats} />
  );
}
