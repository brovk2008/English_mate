'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
}: DashboardClientProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<DayProgress>(initialProgress);
  const [localWeekProgress, setLocalWeekProgress] = useState<any[]>(weekProgressList);
  const [celebrate, setCelebrate] = useState(false);

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
      
      // If today's progress row was just added and not originally in the list
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

  // Helper to check if a day number is complete
  const isWeekDayComplete = (dayNum: number) => {
    if (dayNum === currentDayNum) return isDayComplete;
    const progressRow = localWeekProgress.find(p => p.day_number === dayNum);
    if (!progressRow) return false;
    return (
      progressRow.vocab_done &&
      progressRow.grammar_done &&
      progressRow.song_done &&
      progressRow.listening_done &&
      progressRow.writing_done &&
      progressRow.speaking_done
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Streak Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#33312E]">
            Konnichiwa, {profile.display_name}!
          </h1>
          <p className="text-sm text-[#73706B]">
            Phase: <span className="font-serif italic font-medium">{dayContent.phase_title}</span>
          </p>
        </div>
        <div className="text-sm text-right text-[#73706B]">
          Today is <span className="font-semibold text-[#33312E]">{dayContent.weekday}</span>
        </div>
      </div>

      {/* Main Day progress banner */}
      <Card className="relative overflow-hidden border border-[#E8E2D9] bg-white/80 shadow-[0_4px_20px_rgb(232,166,184,0.04)] rounded-2xl">
        {celebrate && (
          <div className="absolute top-0 right-0 p-4">
            <Badge className="bg-[#5B7F6B] hover:bg-[#5B7F6B] text-white flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              Mission Complete
            </Badge>
          </div>
        )}

        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-5xl font-extrabold text-[#33312E]">{currentDayNum}</span>
            <span className="text-sm font-semibold tracking-wider text-[#73706B]/60 uppercase">/ 90 Days</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-[#73706B] tracking-wide uppercase">
              <span>Overall Journey Progress</span>
              <span>{percentComplete}%</span>
            </div>
            
            {/* Animated progress bar fill */}
            <div className="h-2 w-full bg-[#E8E2D9]/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#E8A6B8] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${percentComplete}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Today's focus topic explainer */}
          <div className="bg-[#FAF6F1]/50 border border-[#E8E2D9]/60 rounded-xl p-4">
            <h3 className="font-sans font-semibold text-xs tracking-wider text-[#73706B] uppercase mb-1">
              Today's Focus
            </h3>
            <p className="font-heading text-lg font-bold text-[#33312E]">
              {dayContent.grammar_topic}
            </p>
            <p className="text-sm text-[#73706B] mt-1 line-clamp-2">
              {dayContent.grammar_explainer}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Signature Weekly Calendar Strip */}
      <Card className="border border-[#E8E2D9] bg-white rounded-2xl">
        <CardHeader className="pb-3 p-6">
          <CardTitle className="font-heading text-lg font-bold text-[#33312E] flex items-center gap-2">
            🌸 Week {dayContent.week} Bloom Track
          </CardTitle>
          <CardDescription className="text-xs text-[#73706B]">
            Complete all tasks to bloom each petal pink!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex justify-between items-center gap-2 max-w-lg mx-auto py-2">
            {weekDaysNumbers.map((dayNum) => {
              const completed = isWeekDayComplete(dayNum);
              const isToday = dayNum === currentDayNum;
              const isLocked = dayNum > currentDayNum;

              return (
                <div key={dayNum} className="flex flex-col items-center gap-1.5 flex-1">
                  <Link
                    href={isLocked ? '#' : `/day/${dayNum}`}
                    onClick={(e) => isLocked && e.preventDefault()}
                    className={`relative w-10 h-14 flex items-center justify-center transition-all ${
                      isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'
                    }`}
                  >
                    {/* Sakura Petal Shape */}
                    <svg
                      viewBox="0 0 24 32"
                      className={`w-8 h-10 transition-all duration-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.01)] ${
                        completed
                          ? 'fill-[#E8A6B8] stroke-[#E8A6B8]'
                          : isToday
                          ? 'fill-[#FAF1F3] stroke-[#E8A6B8] stroke-[2px]'
                          : 'fill-[#F4EFEA] stroke-[#E8E2D9] stroke-[1px]'
                      }`}
                    >
                      <path d="M12 2C12 2 20 11.5 20 17.5C20 22.747 16.418 27 12 27C7.582 27 4 22.747 4 17.5C4 11.5 12 2 12 2Z" />
                    </svg>

                    {/* Day index inside petal */}
                    <span
                      className={`absolute top-6 text-[10px] font-bold ${
                        completed
                          ? 'text-white'
                          : isToday
                          ? 'text-[#E8A6B8]'
                          : 'text-[#73706B]/50'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Today highlighted indicator ring */}
                    {isToday && (
                      <span className="absolute inset-0 rounded-full border border-[#C9A86A] scale-125 border-dashed animate-spin [animation-duration:15s]" />
                    )}
                  </Link>
                  <span className="text-[9px] font-semibold text-[#73706B]/60 tracking-wider">
                    {dayNum === currentDayNum ? 'Today' : `D${dayNum}`}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's Checklist */}
      <Card className="border border-[#E8E2D9] bg-white rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-[#FAF6F1]">
          <CardTitle className="font-heading text-lg font-bold text-[#33312E] flex items-center justify-between">
            <span>Today's Mission Checklist</span>
            {celebrate && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs text-[#5B7F6B] font-semibold flex items-center gap-1 bg-[#5B7F6B]/10 px-2 py-0.5 rounded-full"
              >
                <Sparkles className="w-3 h-3" /> All Done!
              </motion.span>
            )}
          </CardTitle>
          <CardDescription className="text-xs text-[#73706B]">
            Tap the label to view details, or toggle the checkbox directly.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="divide-y divide-[#FAF6F1]/80 p-0">
          {TASK_KEYS.map(({ key, label, icon: Icon, hash }) => {
            const isChecked = !!progress[key];

            return (
              <div 
                key={key} 
                className="flex items-center justify-between py-4 px-5 hover:bg-[#FAF6F1]/30 transition-colors"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                  <div className={`p-2 rounded-lg ${isChecked ? 'bg-[#5B7F6B]/10 text-[#5B7F6B]' : 'bg-[#FAF6F1] text-[#73706B]/80'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  {/* Link label to full details page */}
                  <Link 
                    href={`/day/${currentDayNum}${hash}`}
                    className={`font-sans font-medium text-sm truncate hover:underline hover:text-[#E8A6B8] ${
                      isChecked ? 'text-[#73706B]/50 line-through' : 'text-[#33312E]'
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
                    className="w-5 h-5 border-[#E8E2D9] data-[state=checked]:bg-[#5B7F6B] data-[state=checked]:border-[#5B7F6B] rounded cursor-pointer"
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
        <Card className="border border-[#E8E2D9] bg-white rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg font-bold text-[#33312E] flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#E8A6B8]" />
              Teacher Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {announcements.length === 0 ? (
              <div className="text-center py-6 text-sm text-[#73706B]/50 italic">
                No announcements at this time.
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((item) => (
                  <div key={item.id} className="bg-[#FAF6F1]/40 border border-[#E8E2D9]/40 rounded-xl p-3.5 space-y-1">
                    <p className="text-sm text-[#33312E] leading-relaxed">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-[#73706B]/50 block">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Mistakes log entry */}
        <Card className="border border-[#E8E2D9] bg-white rounded-2xl flex flex-col justify-between">
          <div>
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg font-bold text-[#33312E] flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-700/80" />
                Recent Slip-ups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!latestMistake ? (
                <div className="text-center py-6 text-sm text-[#73706B]/50 italic">
                  Keep up the clean writing! No logged mistakes yet.
                </div>
              ) : (
                <div className="bg-amber-50/20 border border-amber-200/50 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Latest correction · Day {latestMistake.day_number}
                  </div>
                  <div>
                    <div className="text-xs text-[#73706B]">Mistake:</div>
                    <div className="text-sm text-[#33312E] line-through font-mono bg-red-50/30 px-2 py-0.5 rounded">
                      {latestMistake.mistake}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#73706B]">Correction:</div>
                    <div className="text-sm text-[#5B7F6B] font-semibold font-mono bg-[#5B7F6B]/5 px-2 py-0.5 rounded">
                      {latestMistake.correction}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </div>
          <CardContent className="pt-0 pb-6">
            <Link href="/mistakes" className="w-full">
              <Button variant="outline" className="w-full text-xs text-[#73706B] border-[#E8E2D9] hover:bg-[#FAF6F1] flex items-center justify-center gap-1 cursor-pointer">
                View Mistake Ledger <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
