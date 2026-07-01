import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PlacementClient from './PlacementClient';

export const dynamic = 'force-dynamic';

export default async function PlacementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('placement_done')
    .eq('id', user.id)
    .single();

  if (profile?.placement_done) {
    redirect('/home');
  }

  const questions = require('@/data/placement_questions.json');

  return <PlacementClient questions={questions} />;
}
