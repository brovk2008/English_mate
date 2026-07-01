import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import QuizClient from './QuizClient';

export const dynamic = 'force-dynamic';

export default async function QuizPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // 1. Fetch profile to calculate current day
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/auth/callback');
  }

  const startDate = new Date(profile.start_date);
  const today = new Date();
  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentDayNum = Math.max(1, Math.min(90, diffDays + 1));

  // 2. Fetch today's day content to find maximum vocab index unlocked
  const { data: dayContent } = await supabase
    .from('days')
    .select('*')
    .eq('day_number', currentDayNum)
    .single();

  if (!dayContent) {
    redirect('/home');
  }

  const maxWordIndex = dayContent.vocab_range_end;

  // 3. Fetch all vocab words unlocked so far
  const { data: unlockedWords } = await supabase
    .from('vocab_words')
    .select('*')
    .lte('word_index', maxWordIndex)
    .order('word_index', { ascending: true });

  if (!unlockedWords || unlockedWords.length === 0) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-heading font-semibold text-ink">No vocabulary words unlocked yet. Complete your first lessons!</h2>
      </div>
    );
  }

  return (
    <QuizClient
      unlockedWords={unlockedWords}
      dayNumber={currentDayNum}
    />
  );
}
