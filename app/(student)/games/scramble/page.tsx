// app/(student)/games/scramble/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ScrambleSprintClient from './ScrambleSprintClient';

export const dynamic = 'force-dynamic';

export default async function ScramblePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Load database grammar sentences
  const { data: dayContent } = await supabase
    .from('days')
    .select('grammar_topic, grammar_explainer');

  return (
    <ScrambleSprintClient dbTopics={dayContent || []} />
  );
}
