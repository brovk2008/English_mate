'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart2, Award, BookOpen, Music, Video, 
  FileText, Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid 
} from 'recharts';

interface ProgressClientProps {
  profile: any;
  completedCount: number;
  wordsLearnedCount: number;
  songsCount: number;
  videosCount: number;
  chartData: Array<{ day: string; words: number }>;
}

export default function ProgressClient({
  profile,
  completedCount,
  wordsLearnedCount,
  songsCount,
  videosCount,
  chartData,
}: ProgressClientProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalDaysPercent = Math.round((completedCount / 90) * 100);
  const wordsPercent = Math.round((wordsLearnedCount / 300) * 100);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink flex items-center gap-2">
          <BarChart2 className="w-8 h-8 text-sakura" />
          My Learning Journey Stats
        </h1>
        <p className="text-sm text-ink-muted mt-0.5 font-medium">
          Visualizing your growth, word-count improvements, and accomplishments.
        </p>
      </div>

      {/* Numerical Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Days Complete */}
        <Card className="border border-border bg-card rounded-2xl shadow-sm">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-ink-muted">
              <span className="text-[10px] font-bold uppercase tracking-wider">Days Complete</span>
              <Calendar className="w-4 h-4 text-sakura" />
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-ink">{completedCount} / 90</div>
              <Progress value={totalDaysPercent} className="h-1.5 bg-border" />
            </div>
          </CardContent>
        </Card>

        {/* Words Learned */}
        <Card className="border border-border bg-card rounded-2xl shadow-sm">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-ink-muted">
              <span className="text-[10px] font-bold uppercase tracking-wider">Words Mastered</span>
              <BookOpen className="w-4 h-4 text-matcha" />
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-black text-ink">{wordsLearnedCount} / 300</div>
              <Progress value={wordsPercent} className="h-1.5 bg-border" />
            </div>
          </CardContent>
        </Card>

        {/* Songs Completed */}
        <Card className="border border-border bg-card rounded-2xl shadow-sm">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-ink-muted mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Songs Heard</span>
              <Music className="w-4 h-4 text-gold" />
            </div>
            <div className="text-2xl font-black text-ink">{songsCount}</div>
            <span className="text-[10px] font-semibold text-ink-muted">Listening sets done</span>
          </CardContent>
        </Card>

        {/* Videos Watched */}
        <Card className="border border-border bg-card rounded-2xl shadow-sm">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-ink-muted mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Videos Watched</span>
              <Video className="w-4 h-4 text-sakura" />
            </div>
            <div className="text-2xl font-black text-ink">{videosCount}</div>
            <span className="text-[10px] font-semibold text-ink-muted">Streaming sessions done</span>
          </CardContent>
        </Card>
      </div>

      {/* Diary Word Count Over Time Chart */}
      <Card className="border border-border bg-card rounded-2xl">
        <CardHeader>
          <CardTitle className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <FileText className="w-5 h-5 text-sakura" />
            Writing Vocabulary Growth
          </CardTitle>
          <CardDescription className="text-xs text-ink-muted">
            Tracks your diary entry word count over the 90 days. Keep writing to see the curve rise!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {chartData.length === 0 ? (
            <div className="text-center py-16 text-ink-muted/50 italic bg-bg/25 rounded-2xl border border-dashed border-border select-none">
              No writing submissions recorded yet. Complete today's writing mission to seed the chart!
            </div>
          ) : mounted ? (
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-sakura)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-sakura)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    stroke="var(--color-ink-muted)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="var(--color-ink-muted)" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      fontFamily: 'inherit',
                      fontSize: '12px',
                      color: 'var(--color-ink)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="words"
                    stroke="var(--color-sakura)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWords)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full h-[280px] bg-bg/15 animate-pulse rounded-2xl" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
