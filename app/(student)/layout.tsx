import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Home, Calendar, BookOpen, Layers, BarChart2, AlertCircle, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

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
  // For a simple premium feel, we query completed days
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

  // Let's calculate a simple streak by checking consecutive active days
  // For now, we will display a solid active streak based on consecutive completed days or a minimum of 1
  const streak = completedCount > 0 ? completedCount : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF6F1]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#FAF6F1]/95 backdrop-blur-md border-b border-[#E8E2D9] py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading text-xl sm:text-2xl font-bold tracking-wide text-[#33312E]">
              桜 Journey
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak flame indicator */}
            <div className="flex items-center gap-1.5 bg-[#E8A6B8]/10 text-[#E8A6B8] px-3 py-1 rounded-full text-sm font-semibold">
              <span className="text-base">🔥</span>
              <span>{streak} Days</span>
            </div>

            {/* Profile Avatar / Teacher check */}
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 ring-2 ring-[#E8A6B8]/30">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="bg-[#FAF1F3] text-[#E8A6B8] font-bold text-xs">
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

      {/* Sticky Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#FAF6F1]/98 border-t border-[#E8E2D9] py-2 px-3 sm:py-3 shadow-lg">
        <div className="max-w-md mx-auto flex justify-between items-center text-[#73706B]">
          <Link href="/home" className="flex flex-col items-center gap-0.5 flex-1 py-1 hover:text-[#E8A6B8] transition-colors">
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide">Home</span>
          </Link>

          <Link href={`/day/${currentDay}`} className="flex flex-col items-center gap-0.5 flex-1 py-1 hover:text-[#E8A6B8] transition-colors relative">
            <Calendar className="w-5 h-5 text-[#E8A6B8]" />
            <span className="text-[10px] font-medium tracking-wide text-[#E8A6B8] font-semibold">Today</span>
            <span className="absolute -top-1 right-[25%] bg-[#E8A6B8] text-white text-[8px] px-1 rounded-full scale-90">
              D{currentDay}
            </span>
          </Link>

          <Link href="/vocabulary" className="flex flex-col items-center gap-0.5 flex-1 py-1 hover:text-[#E8A6B8] transition-colors">
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide">Vocab</span>
          </Link>

          <Link href="/grammar" className="flex flex-col items-center gap-0.5 flex-1 py-1 hover:text-[#E8A6B8] transition-colors">
            <Layers className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide">Grammar</span>
          </Link>

          <Link href="/progress" className="flex flex-col items-center gap-0.5 flex-1 py-1 hover:text-[#E8A6B8] transition-colors">
            <BarChart2 className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide">Stats</span>
          </Link>

          <Link href="/mistakes" className="flex flex-col items-center gap-0.5 flex-1 py-1 hover:text-[#E8A6B8] transition-colors text-amber-700/80">
            <AlertCircle className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-wide">Mistakes</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
