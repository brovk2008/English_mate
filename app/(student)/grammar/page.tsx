import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import GrammarClient from './GrammarClient';

export const dynamic = 'force-dynamic';

export default async function GrammarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // 1. Fetch profile to calculate current day number
  const { data: profile } = await supabase
    .from('profiles')
    .select('start_date')
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

  // 2. Fetch all days covered so far (<= currentDayNum)
  const { data: daysList } = await supabase
    .from('days')
    .select('day_number, month, week, grammar_topic, grammar_explainer, grammar_youtube_id')
    .lte('day_number', currentDayNum)
    .order('day_number', { ascending: true });

  return (
    <GrammarClient daysList={daysList || []} />
  );
}
