import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import HomeworkClient from './HomeworkClient';

export const dynamic = 'force-dynamic';

export default async function HomeworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/auth/callback');
  }

  // 1. Fetch assigned homework ids for the student
  const { data: assignments } = await supabase
    .from('homework_assignments')
    .select('homework_id')
    .eq('user_id', user.id);

  let homeworksList: any[] = [];
  
  if (assignments && assignments.length > 0) {
    const hwIds = assignments.map(a => a.homework_id);
    
    // 2. Fetch homework details, items, and completions for this user in parallel
    const { data: fetchedHws } = await supabase
      .from('homework')
      .select('*, homework_items(*), homework_completion(*)')
      .in('id', hwIds)
      .order('created_at', { ascending: false });
      
    // Filter completions to only show current student's completion data
    if (fetchedHws) {
      homeworksList = fetchedHws.map(h => ({
        ...h,
        homework_completion: h.homework_completion.filter((c: any) => c.user_id === user.id)
      }));
    }
  }

  return (
    <HomeworkClient
      profile={profile}
      initialHomeworks={homeworksList}
    />
  );
}
