import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DayClient from './DayClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

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
        <Card className="max-w-md w-full border border-[#E8E2D9] bg-white/80 p-8 text-center space-y-6 rounded-2xl shadow-sm">
          <div className="mx-auto w-16 h-16 bg-[#FAF6F1] border border-[#E8E2D9] rounded-full flex items-center justify-center text-[#73706B]">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <CardHeader className="p-0">
              <CardTitle className="font-heading text-2xl font-bold text-[#33312E]">
                Day {dayNum} is Locked
              </CardTitle>
            </CardHeader>
            <p className="text-sm text-[#73706B] leading-relaxed">
              This lesson will unlock on <span className="font-semibold text-[#33312E]">{unlockDateString}</span>. 
              Keep completing your daily missions to get there!
            </p>
          </div>
          <div className="pt-2">
            <Link href="/home">
              <Button className="w-full bg-[#E8A6B8] hover:bg-[#E293A7] text-white rounded-xl cursor-pointer">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Fetch static curriculum details
  const { data: dayContent } = await supabase
    .from('days')
    .select('*')
    .eq('day_number', dayNum)
    .single();

  if (!dayContent) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-heading font-semibold">Day not found in database.</h2>
      </div>
    );
  }

  // 4. Fetch 10 vocabulary words for this day range
  const { data: vocabWords } = await supabase
    .from('vocab_words')
    .select('*')
    .gte('word_index', dayContent.vocab_range_start)
    .lte('word_index', dayContent.vocab_range_end)
    .order('word_index', { ascending: true });

  // 5. Fetch or create user day progress row
  let { data: progress } = await supabase
    .from('user_day_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('day_number', dayNum)
    .maybeSingle();

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

  // 6. Fetch user vocab progress states for these words
  const wordIndexes = (vocabWords || []).map((w) => w.word_index);
  const { data: vocabProgressList } = await supabase
    .from('user_vocab_progress')
    .select('*')
    .eq('user_id', user.id)
    .in('word_index', wordIndexes);

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
      initialVocabProgress={vocabProgressList || []}
      dailyQuote={dailyQuote}
    />
  );
}
