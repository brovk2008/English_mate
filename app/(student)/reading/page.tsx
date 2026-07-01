import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ReadingClient from './ReadingClient';

export const dynamic = 'force-dynamic';

export default async function ReadingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch student reading progress to show marks on the sidebar
  const { data: progress } = await supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', user.id);

  // Load passages
  const passages = require('@/data/reading/passages.json');

  return (
    <ReadingClient
      passages={passages}
      initialProgress={progress || []}
    />
  );
}
