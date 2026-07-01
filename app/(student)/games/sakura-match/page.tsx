// app/(student)/games/sakura-match/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SakuraMatchClient from './SakuraMatchClient';

export const dynamic = 'force-dynamic';

export default async function SakuraMatchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // 1. Fetch student's vocabulary progress indexes
  const { data: progress } = await supabase
    .from('user_vocab_progress')
    .select('word_index')
    .eq('user_id', user.id);

  const unlockedIndices = (progress || []).map(p => p.word_index);

  // 2. Load word details
  let gameWords = [];
  if (unlockedIndices.length >= 8) {
    const { data: vocab } = await supabase
      .from('vocab_words')
      .select('*')
      .in('word_index', unlockedIndices.slice(0, 40));
    gameWords = vocab || [];
  }

  // Fallback: load first 40 words if unlocked index counts are too low
  if (gameWords.length < 8) {
    const { data: backup } = await supabase
      .from('vocab_words')
      .select('*')
      .limit(40);
    gameWords = backup || [];
  }

  return (
    <SakuraMatchClient initialWords={gameWords} />
  );
}
