'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart2, Flame, Award, BookOpen, Music, Video, 
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
  // Avoid hydration mismatch for Recharts responsive container
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
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#33312E] flex items-center gap-2">
          <BarChart2 className="w-7 h-7 text-[#E8A6B8]" />
          My Learning Journey Stats
        </h1>
        <p className="text-sm text-[#73706B]">
          Visualizing your growth, word-count improvements, and accomplishments.
        </p>
      </div>

      {/* Numerical Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Days Complete */}
        <Card className="border border-[#E8E2D9] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-[#73706B]/75">
              <span className="text-xs font-semibold uppercase tracking-wider">Days Complete</span>
              <Calendar className="w-4 h-4 text-[#E8A6B8]" />
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-extrabold text-[#33312E]">{completedCount} / 90</div>
              <Progress value={totalDaysPercent} className="h-1.5 bg-[#FAF6F1]" />
            </div>
          </CardContent>
        </Card>

        {/* Words Learned */}
        <Card className="border border-[#E8E2D9] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-[#73706B]/75">
              <span className="text-xs font-semibold uppercase tracking-wider">Words Mastered</span>
              <BookOpen className="w-4 h-4 text-[#5B7F6B]" />
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-extrabold text-[#33312E]">{wordsLearnedCount} / 300</div>
              <Progress value={wordsPercent} className="h-1.5 bg-[#FAF6F1]" />
            </div>
          </CardContent>
        </Card>

        {/* Songs Completed */}
        <Card className="border border-[#E8E2D9] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-[#73706B]/75 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Songs Heard</span>
              <Music className="w-4 h-4 text-amber-700/70" />
            </div>
            <div className="text-2xl font-extrabold text-[#33312E]">{songsCount}</div>
            <span className="text-[10px] font-medium text-[#73706B]/60">Listening sets done</span>
          </CardContent>
        </Card>

        {/* Videos Watched */}
        <Card className="border border-[#E8E2D9] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
          <CardContent className="p-5 space-y-1">
            <div className="flex items-center justify-between text-[#73706B]/75 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">Videos Watched</span>
              <Video className="w-4 h-4 text-red-600/70" />
            </div>
            <div className="text-2xl font-extrabold text-[#33312E]">{videosCount}</div>
            <span className="text-[10px] font-medium text-[#73706B]/60">Streaming sessions done</span>
          </CardContent>
        </Card>
      </div>

      {/* Diary Word Count Over Time Chart */}
      <Card className="border border-[#E8E2D9] bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-lg font-bold text-[#33312E] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#E8A6B8]" />
            Writing Vocabulary Growth
          </CardTitle>
          <CardDescription className="text-xs text-[#73706B]">
            Tracks your diary entry word count over the 90 days. Keep writing to see the curve rise!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {chartData.length === 0 ? (
            <div className="text-center py-16 text-[#73706B]/50 italic bg-[#FAF6F1]/20 rounded-xl border border-dashed border-[#E8E2D9]">
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
                      <stop offset="5%" stopColor="#E8A6B8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#E8A6B8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D9/50" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    stroke="#73706B" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#73706B" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF6F1',
                      border: '1px solid #E8E2D9',
                      borderRadius: '8px',
                      fontFamily: 'inherit',
                      fontSize: '12px',
                      color: '#33312E'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="words"
                    stroke="#E8A6B8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWords)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full h-[280px] bg-[#FAF6F1]/10 animate-pulse rounded-xl" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
