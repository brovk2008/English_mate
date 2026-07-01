import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardClient from './DashboardClient';
import quotes from '@/data/quotes.json';
import { Suspense } from 'react';
import HomeLoading from './loading';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

const getCurriculumDay = unstable_cache(
  async (dayNum: number) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from('days')
      .select('*')
      .eq('day_number', dayNum)
      .single();
    return data;
  },
  ['curriculum-day'],
  { revalidate: 3600 }
);

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

  // 2. Calculate current unlocked day number
  const startDate = new Date(profile.start_date);
  const today = new Date();
  
  // Set times to midnight to calculate exact calendar days diff
  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentDayNum = Math.max(1, Math.min(90, diffDays + 1));

  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // 3. Parallel fetch all student dashboard metrics
  const currentWeek = Math.floor((currentDayNum - 1) / 7) + 1;
  const startDay = (currentWeek - 1) * 7 + 1;
  const endDay = Math.min(90, currentWeek * 7);
  
  const weekDaysNumbers = Array.from(
    { length: endDay - startDay + 1 },
    (_, i) => startDay + i
  );

  const [
    dayContent,
    initialProgressRes,
    weekProgressListRes,
    announcementsRes,
    latestMistakeRes,
    completedDaysCountRes,
    streakDataRes,
    homeMistakesRes,
    assignmentsRes
  ] = await Promise.all([
    getCurriculumDay(currentDayNum),
    supabase.from('user_day_progress').select('*').eq('user_id', user.id).eq('day_number', currentDayNum).maybeSingle(),
    supabase.from('user_day_progress').select('*').eq('user_id', user.id).gte('day_number', startDay).lte('day_number', endDay),
    supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3),
    supabase.from('mistake_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('user_day_progress').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('vocab_done', true).eq('grammar_done', true).eq('song_done', true).eq('listening_done', true).eq('writing_done', true).eq('speaking_done', true),
    supabase.from('streak_data').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('mistake_log').select('category').eq('user_id', user.id),
    supabase.from('homework_assignments').select('homework_id').eq('user_id', user.id)
  ]);

  if (!dayContent) {
    // If database isn't seeded yet
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-bg border border-border rounded-xl text-center">
        <h2 className="text-xl font-display font-semibold mb-2">Curriculum database is empty</h2>
        <p className="text-sm text-ink-muted mb-4">Please seed the database before using the app.</p>
      </div>
    );
  }

  // Calculate pending homework count
  let pendingHomework = 0;
  const assignments = assignmentsRes.data;
  if (assignments && assignments.length > 0) {
    const hwIds = assignments.map(a => a.homework_id);
    const [itemsRes, completionsRes] = await Promise.all([
      supabase.from('homework_items').select('id, homework_id').in('homework_id', hwIds),
      supabase.from('homework_completion').select('item_id').eq('user_id', user.id).eq('completed', true)
    ]);
    const items = itemsRes.data;
    const completions = completionsRes.data;
    const completedItemIds = new Set(completions?.map(c => c.item_id) || []);
    if (items) {
      const itemsByHw: Record<string, string[]> = {};
      items.forEach(it => {
        if (!itemsByHw[it.homework_id]) itemsByHw[it.homework_id] = [];
        itemsByHw[it.homework_id].push(it.id);
      });
      Object.keys(itemsByHw).forEach(hwId => {
        const hwItemIds = itemsByHw[hwId];
        const hasIncomplete = hwItemIds.some(itemId => !completedItemIds.has(itemId));
        if (hasIncomplete) {
          pendingHomework++;
        }
      });
    }
  }

  // 4. Create today's progress if missing
  let progress = initialProgressRes.data;
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

  const weekProgressList = weekProgressListRes.data;
  const announcements = announcementsRes.data;
  const latestMistake = latestMistakeRes.data;
  const completedDaysCount = completedDaysCountRes.count;
  const streakData = streakDataRes.data;
  const homeMistakes = homeMistakesRes.data;

  // Streak Auto-decay / Freeze check using fetched streakData
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

        try {
          await supabase
            .from('streak_data')
            .update({
              current_streak: currentStreak,
              freezes_available: freezesAvailable,
              last_completed_date: yesterdayStr
            })
            .eq('user_id', user.id);
        } catch (err) {
          console.error("Streak decay update failed:", err);
        }
      }
    }
  }

  const completedCount = completedDaysCount || 0;
  const percentComplete = Math.round((completedCount / 90) * 100);

  // Fetch streak & freezes safely with fallback check
  let streak = completedCount;
  let freezes = 1;
  if (streakData) {
    streak = streakData.current_streak;
    freezes = streakData.freezes_available;
  } else {
    // Create lazy streak row
    try {
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
    } catch (err) {
      console.error("Streak create failed:", err);
    }
  }

  // Get daily quote
  const dailyQuote = quotes.find((q) => q.day === currentDayNum) || quotes[0];

  // Get word of the day
  const wordOfDays = require('@/data/word_of_day.json');
  const wordOfDay = wordOfDays.find((w: any) => w.day === currentDayNum) || wordOfDays[0];

  const homeMistakeCounts: Record<string, number> = {};
  (homeMistakes || []).forEach((m: any) => {
    if (m.category) {
      homeMistakeCounts[m.category] = (homeMistakeCounts[m.category] || 0) + 1;
    }
  });

  const repeatedSlips = Object.entries(homeMistakeCounts)
    .filter(([_, count]) => count >= 3)
    .map(([cat]) => cat);

  const alertCategory = repeatedSlips.length > 0 ? repeatedSlips[0] : null;

  return (
    <Suspense fallback={<HomeLoading />}>
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
        wordOfDay={wordOfDay}
        alertCategory={alertCategory}
        pendingHomework={pendingHomework}
      />
    </Suspense>
  );
}
