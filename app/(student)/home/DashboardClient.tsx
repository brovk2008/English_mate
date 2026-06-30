'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import WeekStrip from '@/components/WeekStrip';
import DailyNudge from '@/components/DailyNudge';
import { ChevronRight, Megaphone, AlertCircle, Award, Sparkles, BookOpen, Layers, Music, Video, FileText, Mic } from 'lucide-react';

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  start_date: string;
  role: string;
}

interface DayProgress {
  vocab_done: boolean;
  grammar_done: boolean;
  song_done: boolean;
  listening_done: boolean;
  writing_done: boolean;
  speaking_done: boolean;
  [key: string]: any;
}

interface Announcement {
  id: string;
  message: string;
  created_at: string;
}

interface Mistake {
  id: string;
  mistake: string;
  correction: string;
  day_number: number;
}

interface DashboardClientProps {
  profile: Profile;
  currentDayNum: number;
  dayContent: any;
  initialProgress: DayProgress;
  weekDaysNumbers: number[];
  weekProgressList: any[];
  announcements: Announcement[];
  latestMistake: Mistake | null;
  percentComplete: number;
  streak: number;
  freezes: number;
  dailyQuote: { day: number; quote: string; author: string };
}

const TASK_KEYS = [
  { key: 'vocab_done', label: 'Vocabulary (10 Words)', icon: BookOpen, hash: '#vocab' },
  { key: 'grammar_done', label: 'Grammar Topic & Explainer', icon: Layers, hash: '#grammar' },
  { key: 'song_done', label: 'Song of the Day', icon: Music, hash: '#song' },
  { key: 'listening_done', label: 'Listening Practice Video', icon: Video, hash: '#listening' },
  { key: 'writing_done', label: 'Writing Diary Submission', icon: FileText, hash: '#writing' },
  { key: 'speaking_done', label: 'Speaking Practice Voice Note', icon: Mic, hash: '#speaking' }
];

export default function DashboardClient({
  profile,
  currentDayNum,
  dayContent,
  initialProgress,
  weekDaysNumbers,
  weekProgressList,
  announcements,
  latestMistake,
  percentComplete,
  streak,
  freezes,
  dailyQuote,
}: DashboardClientProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<DayProgress>(initialProgress);
  const [localWeekProgress, setLocalWeekProgress] = useState<any[]>(weekProgressList);
  const [celebrate, setCelebrate] = useState(false);

  // Pick Japanese greeting based on local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'おはよう'; // ohayou (morning)
    if (hour < 18) return 'こんにちは'; // konnichiwa (afternoon)
    return 'こんばんは'; // konbanwa (evening)
  };

  // Check if all 6 tasks are done
  const isDayComplete = 
    progress.vocab_done &&
    progress.grammar_done &&
    progress.song_done &&
    progress.listening_done &&
    progress.writing_done &&
    progress.speaking_done;

  useEffect(() => {
    if (isDayComplete) {
      setCelebrate(true);
    } else {
      setCelebrate(false);
    }
  }, [isDayComplete]);

  // Handle task toggling
  const handleToggleTask = async (taskKey: string, checked: boolean) => {
    const updatedProgress = { ...progress, [taskKey]: checked };
    
    // Optimistic UI update
    setProgress(updatedProgress);

    const supabase = createClient();
    
    // Update Supabase
    const { error } = await supabase
      .from('user_day_progress')
      .upsert({
        user_id: profile.id,
        day_number: currentDayNum,
        [taskKey]: checked,
        updated_at: new Date().toISOString(),
        ...(checked && taskKey === 'writing_done' ? { completed_at: new Date().toISOString() } : {})
      }, { onConflict: 'user_id,day_number' });

    if (error) {
      console.error('Error saving progress:', error.message);
      // Revert UI on error
      setProgress(progress);
    } else {
      // Refresh local week progress states
      const updatedWeek = localWeekProgress.map((p) => {
        if (p.day_number === currentDayNum) {
          return { ...p, [taskKey]: checked };
        }
        return p;
      });
      
      const hasToday = updatedWeek.some(p => p.day_number === currentDayNum);
      if (!hasToday) {
        updatedWeek.push({
          day_number: currentDayNum,
          user_id: profile.id,
          [taskKey]: checked
        });
      }
      
      setLocalWeekProgress(updatedWeek);
    }
  };

  return (
    <div className="space-y-6">
      <DailyNudge isCompleted={isDayComplete} />

      {/* Welcome Greeting Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            {getGreeting()}, {profile.display_name}! 👋
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Phase: <span className="font-display italic font-semibold text-sakura-deep">{dayContent.phase_title} 🌱</span>
          </p>
        </div>
        <div className="text-xs sm:text-sm text-left sm:text-right text-ink-muted">
          Today is <span className="font-bold text-ink">{dayContent.weekday}</span>
        </div>
      </div>

      {/* Main Journey Progress Card */}
      <Card className="relative overflow-hidden border border-border bg-card/90 shadow-sm rounded-2xl">
        {celebrate && (
          <div className="absolute top-0 right-0 p-4">
            <Badge className="bg-matcha text-white hover:bg-matcha/90 flex items-center gap-1 border-none shadow-sm select-none">
              <Award className="w-3.5 h-3.5" />
              Mission Complete
            </Badge>
          </div>
        )}

        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-black text-ink">{currentDayNum}</span>
            <span className="text-xs font-semibold tracking-wider text-ink-muted uppercase">/ 90 Days</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between text-xs font-semibold text-ink-muted tracking-wide uppercase">
              <span>Overall Journey Progress</span>
              <span>{percentComplete}%</span>
            </div>
            
            {/* Animated progress bar fill */}
            <div className="h-2.5 w-full bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-sakura rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percentComplete}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Today's focus topic explainer */}
          <div className="bg-bg/40 border border-border/70 rounded-xl p-4">
            <h3 className="font-sans font-bold text-[10px] tracking-wider text-ink-muted uppercase mb-1">
              Today's Focus
            </h3>
            <p className="font-display text-lg font-bold text-ink leading-snug">
              {dayContent.grammar_topic}
            </p>
            <p className="text-sm text-ink-muted mt-1 leading-relaxed line-clamp-2">
              {dayContent.grammar_explainer}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Signature Weekly Petal Calendar Strip */}
      <WeekStrip currentDay={currentDayNum} weekProgress={localWeekProgress} />

      {/* Today's Checklist */}
      <Card className="border border-border bg-card rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/55">
          <CardTitle className="font-display text-lg font-bold text-ink flex items-center justify-between">
            <span>Today's Mission Checklist</span>
            {celebrate && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs text-matcha font-bold flex items-center gap-1 bg-matcha/10 px-2.5 py-1 rounded-full border border-matcha/20"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> All Done!
              </motion.span>
            )}
          </CardTitle>
          <CardDescription className="text-xs text-ink-muted">
            Tap the label to open today's active lesson page.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="divide-y divide-border p-0">
          {TASK_KEYS.map(({ key, label, icon: Icon, hash }) => {
            const isChecked = !!progress[key];

            return (
              <div 
                key={key} 
                className="flex items-center justify-between py-4 px-5 hover:bg-bg/40 transition-colors"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                  <div className={`p-2 rounded-xl transition-all ${isChecked ? 'bg-matcha/10 text-matcha' : 'bg-bg text-ink-muted/80'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  {/* Link label to full details page */}
                  <Link 
                    href={`/day/${currentDayNum}${hash}`}
                    className={`font-sans font-medium text-sm truncate hover:underline hover:text-sakura ${
                      isChecked ? 'text-ink-muted/50 line-through' : 'text-ink'
                    }`}
                  >
                    {label}
                  </Link>
                </div>

                <div className="flex items-center">
                  <Checkbox
                    id={key}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleToggleTask(key, !!checked)}
                    className="w-5 h-5 border-border data-[state=checked]:bg-matcha data-[state=checked]:border-matcha rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Announcements & Mistake teaser grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teacher announcements feed */}
        <Card className="border border-border bg-card rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg font-bold text-ink flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-sakura" />
              Teacher Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {announcements.length === 0 ? (
              <div className="text-center py-6 text-sm text-ink-muted/50 italic">
                No announcements at this time.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((item) => (
                  <div key={item.id} className="bg-bg/40 border border-border/40 rounded-xl p-3.5 space-y-1">
                    <p className="text-sm text-ink leading-relaxed">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-ink-muted/50 block">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Mistakes log entry */}
        <Card className="border border-border bg-card rounded-2xl flex flex-col justify-between">
          <div>
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-700/80 dark:text-amber-500/80" />
                Recent Corrections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!latestMistake ? (
                <div className="text-center py-6 text-sm text-ink-muted/50 italic">
                  Keep up the clean writing! No logged mistakes yet.
                </div>
              ) : (
                <div className="bg-amber-50/10 dark:bg-amber-500/5 border border-amber-200/40 rounded-xl p-4 space-y-2">
                  <div className="text-[10px] font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wider">
                    Latest correction · Day {latestMistake.day_number}
                  </div>
                  <div>
                    <div className="text-[10px] text-ink-muted">Mistake:</div>
                    <div className="text-sm text-ink/80 line-through font-mono bg-red-500/5 dark:bg-red-500/10 px-2 py-0.5 rounded">
                      {latestMistake.mistake}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-ink-muted">Correction:</div>
                    <div className="text-sm text-matcha font-bold font-mono bg-matcha/5 px-2 py-0.5 rounded">
                      {latestMistake.correction}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </div>
          <CardContent className="pt-0 pb-6">
            <Link href="/mistakes" className="w-full">
              <Button variant="outline" className="w-full text-xs text-ink-muted border-border hover:bg-bg flex items-center justify-center gap-1 cursor-pointer">
                View Mistake Ledger <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Subtle Quote Card at the Bottom */}
      <Card className="border border-border/60 bg-sakura/5 rounded-2xl overflow-hidden p-5 shadow-sm">
        <blockquote className="border-l-4 border-sakura pl-4 py-1 text-left">
          <p className="font-display italic text-lg text-ink font-semibold">
            “{dailyQuote.quote}”
          </p>
          <cite className="text-xs text-ink-muted mt-2 block not-italic font-sans">
            — {dailyQuote.author}
          </cite>
        </blockquote>
      </Card>
    </div>
  );
}
