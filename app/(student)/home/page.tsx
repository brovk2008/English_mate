import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';
import quotes from '@/data/quotes.json';

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

  // 2. Streak Auto-decay / Freeze check
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  try {
    const { data: streakData } = await supabase
      .from('streak_data')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (streakData) {
      const lastCompleted = streakData.last_completed_date;
      if (lastCompleted && lastCompleted !== todayStr && lastCompleted !== yesterdayStr) {
        const lastCompletedDate = new Date(lastCompleted);
        lastCompletedDate.setHours(0, 0, 0, 0);
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const diffTime = todayDate.getTime() - lastCompletedDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
          let freezesAvailable = streakData.freezes_available;
          let currentStreak = streakData.current_streak;
          const daysMissed = diffDays - 1;
          const freezesToConsume = Math.min(freezesAvailable, daysMissed);
          
          freezesAvailable -= freezesToConsume;
          const remainingMissed = daysMissed - freezesToConsume;
          
          if (remainingMissed > 0) {
            currentStreak = 0;
          }

          await supabase
            .from('streak_data')
            .update({
              current_streak: currentStreak,
              freezes_available: freezesAvailable,
              last_completed_date: yesterdayStr
            })
            .eq('user_id', user.id);
        }
      }
    }
  } catch (err) {
    console.error("Streak decay check failed:", err);
  }

  // 3. Compute current day
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
      <div className="flex flex-col items-center justify-center p-8 bg-bg border border-border rounded-xl text-center">
        <h2 className="text-xl font-display font-semibold mb-2">Curriculum database is empty</h2>
        <p className="text-sm text-ink-muted mb-4">Please seed the database before using the app.</p>
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

  const completedCount = completedDaysCount || 0;
  const percentComplete = Math.round((completedCount / 90) * 100);

  // Fetch streak & freezes safely with fallback check
  let streak = completedCount;
  let freezes = 1;
  try {
    const { data: streakData } = await supabase
      .from('streak_data')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (streakData) {
      streak = streakData.current_streak;
      freezes = streakData.freezes_available;
    } else {
      // Create lazy streak row
      const { data: newStreak } = await supabase
        .from('streak_data')
        .insert({
          user_id: user.id,
          current_streak: completedCount,
          longest_streak: completedCount,
          freezes_available: 1,
        })
        .select()
        .single();
      if (newStreak) {
        streak = newStreak.current_streak;
        freezes = newStreak.freezes_available;
      }
    }
  } catch (err) {
    // Migration fallback
    streak = completedCount;
    freezes = 1;
  }

  // Get daily quote
  const dailyQuote = quotes.find((q) => q.day === currentDayNum) || quotes[0];

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
      streak={streak}
      freezes={freezes}
      dailyQuote={dailyQuote}
    />
  );
}
