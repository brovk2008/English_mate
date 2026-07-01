import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DayClient from './DayClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

const getCurriculumDay = unstable_cache(
  async (dayNum: number) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from('days')
      .select('*')
      .eq('day_number', dayNum)
      .single();
    return data;
  },
  ['curriculum-day'],
  { revalidate: 3600 }
);

const getVocabWords = unstable_cache(
  async (start: number, end: number) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from('vocab_words')
      .select('*')
      .gte('word_index', start)
      .lte('word_index', end)
      .order('word_index', { ascending: true });
    return data;
  },
  ['vocab-words'],
  { revalidate: 3600 }
);

interface PageProps {
  params: Promise<{ n: string }>;
}

export default async function DayPage({ params }: PageProps) {
  const { n } = await params;
  const dayNum = parseInt(n, 10);

  if (isNaN(dayNum) || dayNum < 1 || dayNum > 90) {
    redirect('/home');
  }

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

  // 2. Validate locked status
  const isLocked = dayNum > currentDayNum;

  if (isLocked) {
    const daysUntilUnlock = dayNum - currentDayNum;
    const unlockDate = new Date();
    unlockDate.setDate(today.getDate() + daysUntilUnlock);
    const unlockDateString = unlockDate.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Card className="max-w-md w-full border border-border bg-card p-8 text-center space-y-6 rounded-2xl shadow-sm">
          <div className="mx-auto w-16 h-16 bg-bg border border-border rounded-full flex items-center justify-center text-ink-muted">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <CardHeader className="p-0">
              <CardTitle className="font-display text-2xl font-bold text-ink">
                Day {dayNum} is Locked
              </CardTitle>
            </CardHeader>
            <p className="text-sm text-ink-muted leading-relaxed">
              This lesson will unlock on <span className="font-semibold text-ink">{unlockDateString}</span>. 
              Keep completing your daily missions to get there!
            </p>
          </div>
          <div className="pt-2">
            <Link href="/home">
              <Button className="w-full bg-sakura hover:bg-sakura-deep text-white rounded-xl cursor-pointer">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Fetch static curriculum details and user day progress in parallel
  const [dayContent, initialProgressRes] = await Promise.all([
    getCurriculumDay(dayNum),
    supabase
      .from('user_day_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('day_number', dayNum)
      .maybeSingle()
  ]);

  if (!dayContent) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-heading font-semibold">Day not found in database.</h2>
      </div>
    );
  }

  // 4. Create progress row if not exists
  let progress = initialProgressRes?.data;
  if (!progress) {
    const { data: newProgress, error } = await supabase
      .from('user_day_progress')
      .insert({
        user_id: user.id,
        day_number: dayNum,
      })
      .select('*')
      .single();
    
    if (!error && newProgress) {
      progress = newProgress;
    }
  }

  // 5. Fetch vocabulary list and user's vocabulary progress inside it in parallel
  const [vocabWords, vocabProgressListRes] = await Promise.all([
    getVocabWords(dayContent.vocab_range_start, dayContent.vocab_range_end),
    supabase
      .from('user_vocab_progress')
      .select('*')
      .eq('user_id', user.id)
      .gte('word_index', dayContent.vocab_range_start)
      .lte('word_index', dayContent.vocab_range_end)
  ]);

  const vocabProgressList = vocabProgressListRes?.data || [];

  // Get daily quote
  const quotes = require('@/data/quotes.json');
  const dailyQuote = quotes.find((q: any) => q.day === dayNum) || quotes[0];

  return (
    <DayClient
      profile={profile}
      dayNum={dayNum}
      dayContent={dayContent}
      vocabWords={vocabWords || []}
      initialProgress={progress || {
        vocab_done: false,
        grammar_done: false,
        song_done: false,
        listening_done: false,
        writing_done: false,
        speaking_done: false,
        diary_text: '',
        songs_new_words: '',
        caseoh_expressions: '',
        vocab_sentences: '{}'
      }}
      initialVocabProgress={vocabProgressList}
      dailyQuote={dailyQuote}
    />
  );
}
