import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import BottomNav from '@/components/BottomNav';

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

  return (
    <div className="flex flex-col min-h-screen bg-bg text-ink">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-display text-xl sm:text-2xl font-bold tracking-wide text-ink select-none">
              桜 Journey
            </span>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-muted">
              <Link href="/home" className="hover:text-sakura transition-colors">
                Home
              </Link>
              <Link href={`/day/${currentDay}`} className="hover:text-sakura transition-colors">
                Today
              </Link>
              <Link href="/vocabulary" className="hover:text-sakura transition-colors">
                Vocab
              </Link>
              <Link href="/grammar" className="hover:text-sakura transition-colors">
                Grammar
              </Link>
              <Link href="/progress" className="hover:text-sakura transition-colors">
                Stats
              </Link>
              <Link href="/mistakes" className="hover:text-sakura transition-colors text-amber-700/80 dark:text-amber-500/80">
                Mistakes
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Streak flame indicator */}
            <div className="flex items-center gap-1.5 bg-sakura/10 text-sakura-deep px-3 py-1 rounded-full text-xs font-semibold select-none">
              <span className="text-sm">🔥</span>
              <span>{streak} Days</span>
            </div>

            {/* Streak freeze indicator */}
            <div className="flex items-center gap-1.5 bg-gold/10 text-gold px-3 py-1 rounded-full text-xs font-semibold select-none" title="Streak Freezes protect your streak if you miss a day">
              <span className="text-sm">🛡️</span>
              <span>{freezes} Freezes</span>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Profile Avatar / Teacher check */}
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 ring-2 ring-sakura/30">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="bg-sakura/10 text-sakura font-bold text-xs">
                  {profile.display_name?.substring(0, 2).toUpperCase() || 'ST'}
                </AvatarFallback>
              </Avatar>
              
              {profile.role === 'teacher' && (
                <Link href="/teacher">
                  <Button size="sm" variant="outline" className="hidden sm:inline-flex text-[#5B7F6B] border-[#5B7F6B]/30 hover:bg-[#5B7F6B]/10 hover:text-[#5B7F6B] cursor-pointer">
                    Teacher Mode
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-24 sm:px-6">
        {children}
      </main>

      {/* Mobile Sticky Bottom Navigation */}
      <BottomNav currentDay={currentDay} />
    </div>
  );
}
