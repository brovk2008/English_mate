import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import VocabularyClient from './VocabularyClient';

export const dynamic = 'force-dynamic';

export default async function VocabularyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // 1. Fetch all 300 vocabulary words
  const { data: vocabWords } = await supabase
    .from('vocab_words')
    .select('*')
    .order('word_index', { ascending: true });

  // 2. Fetch user vocab progress
  const { data: vocabProgress } = await supabase
    .from('user_vocab_progress')
    .select('*')
    .eq('user_id', user.id);

  // 3. Fetch user lookups logs
  const { data: lookups } = await supabase
    .from('word_lookups')
    .select('*')
    .eq('user_id', user.id)
    .order('looked_up_at', { ascending: false });

  return (
    <VocabularyClient
      userId={user.id}
      vocabWords={vocabWords || []}
      initialProgress={vocabProgress || []}
      lookups={lookups || []}
    />
  );
}
