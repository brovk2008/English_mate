'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mic, CheckCircle, Flame, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ConfettiBurst from '@/components/ConfettiBurst';
import { haptic } from '@/lib/haptics';

interface Prompt {
  id: string;
  category: string;
  prompt: string;
  prompt_ja: string;
}

interface LogRecord {
  prompt_id: string;
  completed_at: string;
}

interface SpeakingClientProps {
  prompts: Prompt[];
  initialLogs: LogRecord[];
}

export default function SpeakingClient({ prompts, initialLogs }: SpeakingClientProps) {
  const router = useRouter();
  const [logs, setLogs] = useState<LogRecord[]>(initialLogs);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showTranslations, setShowTranslations] = useState<Record<string, boolean>>({});
  const [celebrate, setCelebrate] = useState(false);

  // Categories list
  const categories = ['All', 'Daily Life', 'Opinion', 'Story', 'Anime', 'Song', 'CaseOh', 'Debate', 'Pronunciation'];

  // Check if prompt is completed
  const isCompleted = (promptId: string) => {
    return logs.some(l => l.prompt_id === promptId);
  };

  const handleToggleComplete = async (promptId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const completed = isCompleted(promptId);

    if (!completed) {
      haptic.success();
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2000);

      // Optimistic update
      const newLog = { prompt_id: promptId, completed_at: new Date().toISOString() };
      setLogs(prev => [newLog, ...prev]);

      try {
        await supabase
          .from('speaking_log')
          .insert({
            user_id: user.id,
            prompt_id: promptId
          });
      } catch (err) {
        console.error('Failed to log speaking completion:', err);
      }
    } else {
      haptic.light();
      setLogs(prev => prev.filter(l => l.prompt_id !== promptId));

      try {
        await supabase
          .from('speaking_log')
          .delete()
          .eq('user_id', user.id)
          .eq('prompt_id', promptId);
      } catch (err) {
        console.error('Failed to delete speaking log:', err);
      }
    }
  };

  // Compute stats
  const completedCount = logs.length;
  
  // Calculate speaking streak based on daily completions
  const calculateSpeakingStreak = () => {
    if (logs.length === 0) return 0;
    const dates = logs
      .map(l => new Date(l.completed_at).toDateString())
      .filter((val, idx, self) => self.indexOf(val) === idx)
      .map(d => new Date(d));

    dates.sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    let expected = new Date();
    expected.setHours(0,0,0,0);

    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      d.setHours(0,0,0,0);

      const diff = Math.floor((expected.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 0) {
        streak++;
        expected.setDate(expected.getDate() - 1);
      } else if (diff === 1 && i === 0) {
        // Streak is still active for yesterday
        streak++;
        expected.setDate(expected.getDate() - 2);
      } else {
        break;
      }
    }
    return streak;
  };

  const speakingStreak = calculateSpeakingStreak();

  // Find strengths and weaknesses
  const getStrengthsAndWeaknesses = () => {
    const counts: Record<string, number> = {};
    prompts.forEach(p => {
      if (isCompleted(p.id)) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });

    let maxCat = 'None';
    let maxVal = 0;
    Object.entries(counts).forEach(([cat, val]) => {
      if (val > maxVal) {
        maxVal = val;
        maxCat = cat;
      }
    });

    // Weakest is a category with minimum completion (out of categories that have prompts)
    const totalPromptsCount: Record<string, number> = {};
    prompts.forEach(p => {
      totalPromptsCount[p.category] = (totalPromptsCount[p.category] || 0) + 1;
    });

    let minCat = 'None';
    let minRatio = 1.1; // ratios are 0 to 1
    Object.entries(totalPromptsCount).forEach(([cat, total]) => {
      const comp = counts[cat] || 0;
      const ratio = comp / total;
      if (ratio < minRatio) {
        minRatio = ratio;
        minCat = cat;
      }
    });

    return { strength: maxCat, weakness: minCat };
  };

  const analytics = getStrengthsAndWeaknesses();

  const displayedPrompts = activeCategory === 'All'
    ? prompts
    : prompts.filter(p => p.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 select-none animate-fade-in">
      {celebrate && <ConfettiBurst />}

      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/home')}
          className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-sakura transition-colors cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs font-bold text-ink-muted font-mono select-none">
          Speaking Prompts Library
        </span>
      </div>

      {/* Title & Streak Indicator */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#FAF6F1]/70 dark:bg-card/45 rounded-2xl p-5 border border-border/80 shadow-sm">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-black text-ink flex items-center gap-2">
            <Mic className="w-6 h-6 text-sakura animate-pulse" />
            Speaking Challenge Library
          </h1>
          <p className="text-xs text-ink-muted">
            Speak out loud to practice real-life topics, anime character descriptions, and tongue twisters!
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-sakura/10 text-sakura-deep px-4 py-2 rounded-2xl border border-sakura/10">
            <Flame className="w-5 h-5 animate-pulse" />
            <div className="text-left leading-none">
              <span className="text-sm font-black block">{speakingStreak} Days</span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-ink-muted">Speaking Streak</span>
            </div>
          </div>

          <div className="text-left text-xs text-ink-muted font-medium bg-card p-3 border border-border/60 rounded-xl space-y-1">
            <div>🔥 Preferred focus: <span className="font-bold text-ink">{analytics.strength}</span></div>
            <div>💡 Area to practice: <span className="font-bold text-sakura-deep">{analytics.weakness}</span></div>
          </div>
        </div>
      </div>

      {/* Tab Filter switcher */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none select-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap
              ${activeCategory === cat ? 'bg-sakura text-white border-none' : 'border-border text-ink-muted hover:border-sakura bg-card'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Prompts list grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {displayedPrompts.map((p) => {
          const completed = isCompleted(p.id);
          const showJa = !!showTranslations[p.id];

          return (
            <Card
              key={p.id}
              className={`border border-border bg-card rounded-2xl transition-all shadow-sm flex flex-col justify-between
                ${completed ? 'bg-matcha/5 border-matcha/20 border-l-4 border-l-matcha' : 'border-l-4 border-l-border/50'}`}
            >
              <CardContent className="p-5 space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[9px] font-bold text-ink-muted uppercase">
                    <span>{p.category}</span>
                    <span>No. {p.id}</span>
                  </div>

                  <h3 className="font-display font-bold text-sm text-ink leading-relaxed">
                    "{p.prompt}"
                  </h3>

                  {showJa && (
                    <p className="text-[11px] text-ink-muted leading-relaxed border-t border-border/40 pt-1.5">
                      {p.prompt_ja}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-3">
                  <button
                    onClick={() => setShowTranslations(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                    className="text-[10px] font-bold text-ink-muted hover:text-sakura transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {showJa ? <EyeOff size={12} /> : <Eye size={12} />} {showJa ? 'Hide translation' : 'Show translation'}
                  </button>

                  <Button
                    size="sm"
                    variant={completed ? 'default' : 'outline'}
                    onClick={() => handleToggleComplete(p.id)}
                    className={`text-[10px] h-7 font-black rounded-lg cursor-pointer flex items-center gap-1
                      ${completed ? 'bg-matcha hover:bg-matcha text-white' : 'border-border text-ink hover:bg-bg'}`}
                  >
                    {completed ? (
                      <>
                        <CheckCircle size={12} /> Completed
                      </>
                    ) : (
                      <>
                        <Mic size={12} /> Speak Completed
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
