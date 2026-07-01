import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import SpeakingClient from './SpeakingClient';

export const dynamic = 'force-dynamic';

export default async function SpeakingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch student speaking logs completed
  const { data: logs } = await supabase
    .from('speaking_log')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });

  // Load prompts
  const prompts = require('@/data/speaking_prompts.json');

  return (
    <SpeakingClient
      prompts={prompts}
      initialLogs={logs || []}
    />
  );
}
