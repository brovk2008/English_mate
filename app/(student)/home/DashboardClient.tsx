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
import { useI18n } from '@/lib/i18n/context';
import { ChevronRight, Megaphone, AlertCircle, Award, Sparkles, BookOpen, Layers, Music, Video, FileText, Mic } from 'lucide-react';

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  start_date: string;
  role: string;
  cefr_level?: string | null;
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
  wordOfDay?: any;
  alertCategory?: string | null;
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
  wordOfDay,
  alertCategory,
}: DashboardClientProps) {
  const router = useRouter();
  const { lang, t } = useI18n();
  const [progress, setProgress] = useState<DayProgress>(initialProgress);
  const [localWeekProgress, setLocalWeekProgress] = useState<any[]>(weekProgressList);
  const [celebrate, setCelebrate] = useState(false);

  // Pick Japanese greeting based on local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting_morning');
    if (hour < 18) return t('home.greeting_afternoon');
    return t('home.greeting_evening');
  };

  // Load study tips
  const studyTips = require('@/data/study_tips.json');
  const currentTip = studyTips[(currentDayNum - 1) % studyTips.length] || studyTips[0];

  // Milestone calculation
  let nextMilestone = 30;
  let milestoneLabel = "Day 30: Intermediate Phase";
  if (currentDayNum > 60) {
    nextMilestone = 90;
    milestoneLabel = "Day 90: Fluency Graduation";
  } else if (currentDayNum > 30) {
    nextMilestone = 60;
    milestoneLabel = "Day 60: Advanced Phase";
  }

  const prevMilestone = nextMilestone === 30 ? 0 : nextMilestone === 60 ? 30 : 60;
  const daysLeft = nextMilestone - currentDayNum;
  const totalPhaseDays = nextMilestone - prevMilestone;
  const daysIntoPhase = currentDayNum - prevMilestone;
  const milestoneProgress = (daysIntoPhase / totalPhaseDays) * 100;

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
          <div className="flex items-center flex-wrap gap-2 mt-1">
            <span className="text-sm text-ink-muted">
              Phase: <span className="font-display italic font-semibold text-sakura-deep">{dayContent.phase_title}</span>
            </span>
            {profile.cefr_level && (
              <Badge variant="outline" className="bg-sakura/10 text-sakura-deep border-sakura-deep/20 font-bold select-none text-[9px] px-1.5 py-0">
                {profile.cefr_level} 🌱
              </Badge>
            )}
          </div>
        </div>
        <div className="text-xs sm:text-sm text-left sm:text-right text-ink-muted">
          Today is <span className="font-bold text-ink">{dayContent.weekday}</span>
        </div>
      </div>

      {alertCategory && (
        <Card className="border border-red-200 bg-red-500/5 dark:bg-red-950/15 rounded-2xl p-4 shadow-xs flex items-start gap-3 border-l-4 border-l-red-500 select-none">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-extrabold text-red-700 dark:text-red-400">
              ⚠️ Attention Needed: Repeated "{alertCategory}" Slips!
            </h4>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              You have accumulated 3 or more logged mistakes under the <span className="font-bold text-ink">{alertCategory}</span> category. Visit your <Link href="/progress" className="underline font-bold text-sakura hover:text-sakura-deep transition-all">Stats Center</Link> to review these mistakes.
            </p>
          </div>
        </Card>
      )}

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

      {/* Word of the Day Widget */}
      {wordOfDay && (
        <Card className="border border-border bg-[#FAF1F3]/30 dark:bg-card/45 rounded-2xl shadow-sm overflow-hidden select-none">
          <CardHeader className="pb-2 border-b border-border/40 flex flex-row items-center gap-2">
            <Sparkles className="w-4 h-4 text-sakura" />
            <h4 className="font-display font-extrabold text-[10px] text-ink-muted uppercase tracking-wider">
              Word of the Day / 今日の一言
            </h4>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-display font-black text-2xl text-ink">
                  {wordOfDay.word}
                </span>
                <span className="text-xs text-ink-muted font-mono">
                  /{wordOfDay.pronunciation}/
                </span>
              </div>

              <div className="mt-2.5 space-y-1">
                <span className="text-[10px] text-ink-muted font-bold block uppercase tracking-wider">
                  {t('vocab.meaning')}
                </span>
                <p className="text-sm font-semibold text-ink leading-relaxed">
                  {lang === 'ja' ? wordOfDay.meaning_ja : wordOfDay.meaning}
                </p>
              </div>

              <div className="mt-3 space-y-1">
                <span className="text-[10px] text-ink-muted font-bold block uppercase tracking-wider">
                  {t('vocab.example')}
                </span>
                <p className="text-xs text-ink-muted italic leading-relaxed">
                  "{wordOfDay.example}"
                </p>
              </div>

              {wordOfDay.fun_fact && (
                <div className="mt-4 bg-bg/50 border border-border/60 rounded-xl p-3">
                  <span className="text-[9px] font-bold text-sakura-deep block uppercase tracking-wider mb-1">
                    Etymology / Fun Fact
                  </span>
                  <p className="text-[11px] text-ink leading-relaxed font-medium">
                    {wordOfDay.fun_fact}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Daily Quiz Banner Widget */}
      <Card className="border border-border bg-[#FAF6F1]/70 dark:bg-card rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sakura animate-pulse" />
            {t('quiz.title') || 'Vocabulary Challenge'}
          </h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Test your recollection of unlocked vocabulary words. Missed words will automatically reappear tomorrow.
          </p>
        </div>
        <Link href="/quiz" className="shrink-0">
          <Button className="bg-[#E8A6B8] hover:bg-[#E293A7] text-white rounded-xl font-bold px-5 py-2 cursor-pointer shadow-sm">
            Start Daily Quiz
          </Button>
        </Link>
      </Card>

      {/* Bonus Practice Rooms Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
        <Link href="/reading" className="group">
          <Card className="border border-border bg-card hover:border-sakura hover:bg-sakura/5 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-xs flex flex-col space-y-2 h-full">
            <span className="text-[9px] font-bold text-sakura-deep uppercase tracking-wider block">
              Graded Reading
            </span>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sakura/10 text-sakura group-hover:scale-105 transition-transform">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-ink font-heading">Reading Room</span>
            </div>
            <p className="text-[10px] text-ink-muted leading-relaxed">
              Read graded passages with instant word-tap translation lookups.
            </p>
          </Card>
        </Link>

        <Link href="/conversation" className="group">
          <Card className="border border-border bg-card hover:border-sakura hover:bg-sakura/5 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-xs flex flex-col space-y-2 h-full">
            <span className="text-[9px] font-bold text-sakura-deep uppercase tracking-wider block">
              Dialogue Practice
            </span>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-matcha/10 text-matcha group-hover:scale-105 transition-transform">
                <Mic className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-ink font-heading">Roleplay Room</span>
            </div>
            <p className="text-[10px] text-ink-muted leading-relaxed">
              Roleplay real-world dialogues with text-to-speech support.
            </p>
          </Card>
        </Link>

        <Link href="/sentence-builder" className="group">
          <Card className="border border-border bg-card hover:border-sakura hover:bg-sakura/5 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-xs flex flex-col space-y-2 h-full">
            <span className="text-[9px] font-bold text-sakura-deep uppercase tracking-wider block">
              Grammar Builder
            </span>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gold/10 text-gold group-hover:scale-105 transition-transform">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-ink font-heading">Sentence Builder</span>
            </div>
            <p className="text-[10px] text-ink-muted leading-relaxed">
              Build sentences using scrambled tiles or gap-fill connectors.
            </p>
          </Card>
        </Link>

        <Link href="/songs" className="group">
          <Card className="border border-border bg-card hover:border-sakura hover:bg-sakura/5 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-xs flex flex-col space-y-2 h-full">
            <span className="text-[9px] font-bold text-sakura-deep uppercase tracking-wider block">
              Music Lyrics
            </span>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-sakura/10 text-sakura group-hover:scale-105 transition-transform">
                <Music className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-ink font-heading">Song Playlist</span>
            </div>
            <p className="text-[10px] text-ink-muted leading-relaxed">
              Listen to Clairo/Spotify tracks and test fill-in-the-gap lyrics.
            </p>
          </Card>
        </Link>
      </div>

      {/* Daily Study Tips & Milestone Countdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
        {/* Daily Tip Card */}
        <Card className="border border-border bg-[#FAF6F1]/60 dark:bg-card/45 rounded-2xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-sakura/10 text-sakura flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-sakura-deep uppercase tracking-widest block">
              Study Tip of the Day
            </span>
            <p className="text-xs text-ink-muted leading-relaxed font-semibold">
              {currentTip.tip}
            </p>
          </div>
        </Card>

        {/* Milestone Tracker Card */}
        <Card className="border border-border bg-card rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-sakura-deep uppercase tracking-widest block">
                Next Journey Milestone
              </span>
              <h4 className="text-sm font-extrabold text-ink">
                {milestoneLabel}
              </h4>
            </div>
            <Badge className="bg-sakura/10 text-sakura-deep hover:bg-sakura/10 border-none font-bold text-[10px]">
              {daysLeft} Days Left
            </Badge>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between text-[10px] font-bold text-ink-muted">
              <span>Day {currentDayNum} of {nextMilestone}</span>
              <span>{Math.round(milestoneProgress)}% Phase Progress</span>
            </div>
            <div className="w-full bg-bg dark:bg-card border border-border h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${milestoneProgress}%` }}
                className="bg-sakura h-full rounded-full transition-all duration-300"
              />
            </div>
          </div>
        </Card>
      </div>

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
