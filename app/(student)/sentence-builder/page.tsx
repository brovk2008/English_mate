import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SentenceBuilderClient from './SentenceBuilderClient';

export const dynamic = 'force-dynamic';

export default async function SentenceBuilderPage() {
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

  // 2. Fetch sentence challenge from curated JSON pool
  const challenges = require('@/data/sentence_challenges.json');
  const challenge = challenges.find((c: any) => c.day === currentDayNum) || challenges[0];

  return (
    <SentenceBuilderClient
      challenge={challenge}
      dayNumber={currentDayNum}
    />
  );
}
