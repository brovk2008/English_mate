'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Calendar, Sparkles, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';

interface LogEntry {
  day_number: number;
  caseoh_expressions: string;
  updated_at: string;
  listening_youtube_id: string | null;
  listening_label: string;
  listening_mode: string;
}

export default function ListeningHistoryPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch progress logs with caseoh submissions
        const { data: progress } = await supabase
          .from('user_day_progress')
          .select('day_number, caseoh_expressions, updated_at')
          .eq('user_id', user.id)
          .not('caseoh_expressions', 'is', null)
          .not('caseoh_expressions', 'eq', '');

        if (progress && progress.length > 0) {
          const dayNumbers = progress.map(p => p.day_number);

          // 2. Fetch day contents for those days to link video labels/ids
          const { data: days } = await supabase
            .from('days')
            .select('day_number, listening_youtube_id, listening_label, listening_mode')
            .in('day_number', dayNumbers);

          const combined: LogEntry[] = progress.map((p) => {
            const dayObj = days?.find(d => d.day_number === p.day_number);
            return {
              day_number: p.day_number,
              caseoh_expressions: p.caseoh_expressions,
              updated_at: p.updated_at,
              listening_youtube_id: dayObj?.listening_youtube_id || null,
              listening_label: dayObj?.listening_label || 'Anime Practice Session',
              listening_mode: dayObj?.listening_mode || 'subs_optional'
            };
          }).sort((a, b) => b.day_number - a.day_number);

          setLogs(combined);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink flex items-center gap-2 select-none">
          <Video className="w-8 h-8 text-sakura" />
          Listening Practice Logs
        </h1>
        <p className="text-sm text-ink-muted mt-0.5 font-medium">
          A history of your media streaming sessions and comprehension expression logs.
        </p>
      </div>

      {/* Numerical logs card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border bg-card rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Total Sessions</span>
          <div className="text-2xl font-black text-ink mt-1">
            {logs.length} Videos
          </div>
          <span className="text-[10px] text-ink-muted font-medium mt-0.5 block">
            Media assignments completed
          </span>
        </Card>

        <Card className="border border-border bg-sakura/5 rounded-2xl p-5 shadow-sm md:col-span-2">
          <span className="text-[10px] font-bold text-sakura-deep uppercase tracking-wider block flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Listening Tip
          </span>
          <div className="text-xs font-semibold text-ink leading-relaxed mt-1.5">
            Focus on expressions, tone, and pacing. Avoid direct literal translation — try to write down what they meant, not just what they said!
          </div>
        </Card>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-ink-muted/50 font-medium animate-pulse">
            Loading listening diary...
          </div>
        ) : logs.length === 0 ? (
          <Card className="border border-border bg-card rounded-2xl">
            <CardContent className="p-8 text-center text-sm text-ink-muted/50 italic select-none">
              No listening logs recorded yet. Visit today's lesson page and complete the listening practice checklist!
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => {
            const hasThumbnail = !!log.listening_youtube_id;
            const thumbnailUrl = hasThumbnail
              ? `https://img.youtube.com/vi/${log.listening_youtube_id}/mqdefault.jpg`
              : null;

            return (
              <Card key={log.day_number} className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Video Thumbnail side */}
                  <div className="w-full md:w-48 aspect-video md:aspect-auto relative bg-bg border-r border-border/40 select-none">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={log.listening_label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 text-xs font-bold text-ink-muted">
                        <Video className="w-6 h-6 mb-1 text-sakura" />
                        <span>Anime Watch Day</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-sakura text-white hover:bg-sakura border-none font-bold text-[9px]">
                        Day {log.day_number}
                      </Badge>
                    </div>
                  </div>

                  {/* Written Content side */}
                  <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-baseline gap-2 flex-wrap">
                        <h3 className="font-display font-extrabold text-base text-ink leading-tight">
                          {log.listening_label}
                        </h3>
                        <span className="text-[10px] text-ink-muted font-bold flex items-center gap-1 select-none">
                          <Calendar size={11} /> {new Date(log.updated_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-1 bg-bg/40 border border-border rounded-xl p-3">
                        <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider block flex items-center gap-1">
                          <FileText size={10} /> My Expressions Log:
                        </span>
                        <p className="text-xs sm:text-sm text-ink leading-relaxed font-medium">
                          {log.caseoh_expressions}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-ink-muted font-semibold pt-1">
                      <span>Mode: <span className="text-sakura-deep capitalize font-bold">{log.listening_mode.replace('_', ' ')}</span></span>
                      <Link
                        href={`/day/${log.day_number}#listening`}
                        className="text-sakura hover:underline font-bold"
                      >
                        Open Lesson
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
