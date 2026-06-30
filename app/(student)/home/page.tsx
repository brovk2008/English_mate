import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // 1. Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/auth/callback');
  }

  // 2. Compute current day
  const startDate = new Date(profile.start_date);
  const today = new Date();
  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentDayNum = Math.max(1, Math.min(90, diffDays + 1));

  // 3. Fetch today's day content
  const { data: dayContent } = await supabase
    .from('days')
    .select('*')
    .eq('day_number', currentDayNum)
    .single();

  if (!dayContent) {
    // If database isn't seeded yet
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-[#E8E2D9] rounded-xl text-center">
        <h2 className="text-xl font-heading font-semibold mb-2">Curriculum database is empty</h2>
        <p className="text-sm text-gray-500 mb-4">Please seed the database before using the app.</p>
      </div>
    );
  }

  // 4. Fetch or create today's progress
  let { data: progress } = await supabase
    .from('user_day_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('day_number', currentDayNum)
    .maybeSingle();

  if (!progress) {
    const { data: newProgress, error } = await supabase
      .from('user_day_progress')
      .insert({
        user_id: user.id,
        day_number: currentDayNum,
      })
      .select('*')
      .single();
    
    if (!error && newProgress) {
      progress = newProgress;
    }
  }

  // 5. Determine the 7 days of the current week
  const currentWeek = dayContent.week;
  const startDay = (currentWeek - 1) * 7 + 1;
  const endDay = Math.min(90, currentWeek * 7);
  
  const weekDaysNumbers = Array.from(
    { length: endDay - startDay + 1 },
    (_, i) => startDay + i
  );

  // Fetch progress for all days of the current week to show on the petal calendar strip
  const { data: weekProgressList } = await supabase
    .from('user_day_progress')
    .select('*')
    .eq('user_id', user.id)
    .gte('day_number', startDay)
    .lte('day_number', endDay);

  // Fetch announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  // Fetch latest mistake
  const { data: latestMistake } = await supabase
    .from('mistake_log')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Calculate overall total course progress %
  const { count: completedDaysCount } = await supabase
    .from('user_day_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('vocab_done', true)
    .eq('grammar_done', true)
    .eq('song_done', true)
    .eq('listening_done', true)
    .eq('writing_done', true)
    .eq('speaking_done', true);

  const percentComplete = Math.round(((completedDaysCount || 0) / 90) * 100);

  return (
    <DashboardClient
      profile={profile}
      currentDayNum={currentDayNum}
      dayContent={dayContent}
      initialProgress={progress || {
        vocab_done: false,
        grammar_done: false,
        song_done: false,
        listening_done: false,
        writing_done: false,
        speaking_done: false
      }}
      weekDaysNumbers={weekDaysNumbers}
      weekProgressList={weekProgressList || []}
      announcements={announcements || []}
      latestMistake={latestMistake}
      percentComplete={percentComplete}
    />
  );
}
