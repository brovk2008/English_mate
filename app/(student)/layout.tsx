import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import BottomNav from '@/components/BottomNav';
import LangToggle from '@/components/LangToggle';
import ProfileMenu from '@/components/ProfileMenu';
import OnboardingModal from '@/components/OnboardingModal';
import WordLookupProvider from '@/components/WordLookupProvider';
import FloatingNotesWidget from '@/components/FloatingNotesWidget';
import { Flame, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Get student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    // If auth is valid but profile isn't created yet, redirect to auth callback to create it
    redirect('/auth/callback');
  }

  if (!profile.placement_done) {
    redirect('/placement');
  }

  // Calculate current unlocked day number
  const startDate = new Date(profile.start_date);
  const today = new Date();
  
  // Set times to midnight to calculate exact calendar days diff
  startDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentDay = Math.max(1, Math.min(90, diffDays + 1));

  // Determine streak (read from count of user_day_progress where vocab/grammar/etc are completed)
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

  // Determine streak and freezes from streak_data safely
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
      // Create a default streak row for this user
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
    // Graceful fallback if migrations haven't run yet
    streak = completedCount;
    freezes = 1;
  }

  // Fetch pending homework
  let pendingHomework = 0;
  try {
    const { data: assignments } = await supabase
      .from('homework_assignments')
      .select('homework_id')
      .eq('user_id', user.id);
      
    if (assignments && assignments.length > 0) {
      const hwIds = assignments.map(a => a.homework_id);
      
      const { data: items } = await supabase
        .from('homework_items')
        .select('id, homework_id')
        .in('homework_id', hwIds);
        
      const { data: completions } = await supabase
        .from('homework_completion')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('completed', true);
        
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
  } catch (err) {
    console.error("Homework count fetch failed:", err);
  }

  return (
    <WordLookupProvider>
      <div className="flex flex-col min-h-screen bg-bg text-ink">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border py-3 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="font-display text-xl sm:text-2xl font-bold tracking-wide text-ink select-none">
                桜 Journey
              </span>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-ink-muted">
                <Link href="/home" prefetch={true} className="hover:text-sakura transition-colors">
                  Home
                </Link>
                <Link href={`/day/${currentDay}`} prefetch={true} className="hover:text-sakura transition-colors">
                  Today
                </Link>
                <Link href="/library" prefetch={true} className="hover:text-sakura transition-colors">
                  Library
                </Link>
                <Link href="/vocabulary" prefetch={true} className="hover:text-sakura transition-colors">
                  Vocab
                </Link>
                <Link href="/grammar" prefetch={true} className="hover:text-sakura transition-colors">
                  Grammar
                </Link>
                <Link href="/progress" prefetch={true} className="hover:text-sakura transition-colors">
                  Stats
                </Link>
                <Link href="/mistakes" prefetch={true} className="hover:text-sakura transition-colors text-amber-700/80 dark:text-amber-500/80">
                  Mistakes
                </Link>
                <Link href="/homework" prefetch={true} className="hover:text-sakura transition-colors flex items-center gap-1.5">
                  Homework
                  {pendingHomework > 0 && (
                    <span className="bg-sakura text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none flex items-center justify-center min-w-[16px] h-4">
                      {pendingHomework}
                    </span>
                  )}
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Streak flame indicator */}
              <div className="flex items-center gap-1.5 bg-sakura/10 text-sakura-deep px-3 py-1 rounded-full text-xs font-semibold select-none">
                <Flame className="w-3.5 h-3.5 text-sakura-deep animate-pulse" />
                <span>{streak} Days</span>
              </div>

              {/* Streak freeze indicator */}
              <div className="flex items-center gap-1.5 bg-gold/10 text-gold px-3 py-1 rounded-full text-xs font-semibold select-none" title="Streak Freezes protect your streak if you miss a day">
                <Shield className="w-3.5 h-3.5 text-gold" />
                <span>{freezes} Freezes</span>
              </div>

              {/* Language Toggle */}
              <LangToggle />

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Profile Dropdown Menu */}
              <ProfileMenu profile={profile} />
              
              {profile.role === 'teacher' && (
                <Link href="/teacher">
                  <Button size="sm" variant="outline" className="hidden sm:inline-flex text-[#5B7F6B] border-[#5B7F6B]/30 hover:bg-[#5B7F6B]/10 hover:text-[#5B7F6B] cursor-pointer">
                    Teacher Mode
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-24 sm:px-6">
          {children}
        </main>

        {/* Onboarding Dialog for new students */}
        <OnboardingModal initialOnboarded={profile.onboarded} displayName={profile.display_name || ''} />

        {/* Mobile Sticky Bottom Navigation */}
        <BottomNav currentDay={currentDay} />

        {/* Floating notes widget */}
        <FloatingNotesWidget />
      </div>
    </WordLookupProvider>
  );
}
