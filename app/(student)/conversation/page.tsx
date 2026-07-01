import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ConversationClient from './ConversationClient';

export const dynamic = 'force-dynamic';

export default async function ConversationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch student conversation completion status
  const { data: progress } = await supabase
    .from('conversation_progress')
    .select('*')
    .eq('user_id', user.id);

  // Load scenarios
  const scenarios = require('@/data/conversation_scenarios.json');

  return (
    <ConversationClient
      scenarios={scenarios}
      initialProgress={progress || []}
    />
  );
}
