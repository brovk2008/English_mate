'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Award, BookOpen, Calendar, Clock, FileText, Flame, 
  Layers, Mic, Sparkles, TrendingUp, Trophy, Video, AlertTriangle, BarChart2, Music
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid, ReferenceLine, LineChart, Line, BarChart, Bar, Cell
} from 'recharts';

import { BADGES } from '@/lib/check-achievements';
import { useI18n } from '@/lib/i18n/context';

interface ProgressClientProps {
  profile: any;
  completedCount: number;
  wordsLearnedCount: number;
  songsCount: number;
  videosCount: number;
  chartData: Array<{ day: string; words: number }>;
  listeningChartData: Array<{ day: string; comprehension: number }>;
  mistakeChartData: Array<{ name: string; count: number }>;
  earnedBadgeIds: string[];
}

export default function ProgressClient({
  profile,
  completedCount,
  wordsLearnedCount,
  songsCount,
  videosCount,
  chartData,
  listeningChartData,
  mistakeChartData,
  earnedBadgeIds,
}: ProgressClientProps) {
  const { lang } = useI18n();
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

      {/* CEFR Level Banner */}
      {profile.cefr_level && (
        <Card className="border border-border bg-[#FAF6F1]/60 dark:bg-card/45 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4 select-none">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-sakura-deep uppercase tracking-widest block">
              CEFR Level Placement
            </span>
            <h3 className="font-display text-lg font-black text-ink flex items-center gap-1.5">
              Level {profile.cefr_level}
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed font-medium">
              Based on your placement diagnostic test. You're following an adaptive {profile.daily_minutes}m daily curriculum.
            </p>
          </div>
          <div className="w-14 h-14 bg-sakura/10 border border-sakura/15 rounded-2xl flex items-center justify-center text-2xl font-black text-sakura-deep shrink-0 font-mono">
            {profile.cefr_level}
          </div>
        </Card>
      )}

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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Listening Comprehension Pacing Chart */}
        <Card className="border border-border bg-card rounded-2xl">
          <CardHeader>
            <CardTitle className="font-display text-lg font-bold text-ink flex items-center gap-2">
              <Video className="w-5 h-5 text-matcha" />
              Listening Comprehension Growth
            </CardTitle>
            <CardDescription className="text-xs text-ink-muted">
              Visualizes your self-reported understanding percentage of CaseOh/Anime videos over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {listeningChartData.length === 0 ? (
              <div className="text-center py-16 text-ink-muted/50 italic bg-bg/25 rounded-2xl border border-dashed border-border select-none">
                No video summaries recorded yet. Start watching challenges to track your progress!
              </div>
            ) : mounted ? (
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={listeningChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
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
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
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
                      formatter={(v) => [`${v}%`, 'Comprehension']}
                    />
                    <ReferenceLine 
                      y={80} 
                      stroke="var(--color-sakura-deep)" 
                      strokeDasharray="4 4" 
                      label={{ value: 'Target: 80%', fill: 'var(--color-sakura-deep)', fontSize: 9, position: 'top' }} 
                    />
                    <Line
                      type="monotone"
                      dataKey="comprehension"
                      stroke="var(--color-matcha)"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 1 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="w-full h-[280px] bg-bg/15 animate-pulse rounded-2xl" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mistake Category Analytics Card */}
      <Card className="border border-border bg-card rounded-2xl overflow-hidden shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-sakura animate-bounce" />
            Grammar & Expression Slips by Category
          </CardTitle>
          <CardDescription className="text-xs text-ink-muted">
            Teacher-flagged corrections grouped by error type. Focus on high-frequency error categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {mistakeChartData.every(c => c.count === 0) ? (
            <div className="text-center py-12 text-ink-muted/50 italic bg-bg/25 rounded-2xl border border-dashed border-border select-none">
              Clean ledger! No corrections logged by the teacher yet.
            </div>
          ) : mounted ? (
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mistakeChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
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
                    allowDecimals={false}
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
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {mistakeChartData.map((entry, index) => {
                      const colors = ['#E8A6B8', '#9DBF9E', '#F4E3B1', '#A3A3D3', '#E0A3C4', '#A8DADC'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full h-[280px] bg-bg/15 animate-pulse rounded-2xl" />
          )}
        </CardContent>
      </Card>

      {/* Badges / Milestones Section */}
      <Card className="border border-border bg-card rounded-2xl overflow-hidden shadow-xs">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <Award className="w-5 h-5 text-sakura" />
            Milestones & Achievements
          </CardTitle>
          <CardDescription className="text-xs text-ink-muted">
            Unlock premium badges as you progress through your 90-day English journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 select-none">
            {BADGES.map((badge) => {
              const isEarned = earnedBadgeIds.includes(badge.id);
              const badgeName = lang === 'ja' ? badge.name_ja : badge.name;
              const badgeDesc = lang === 'ja' ? badge.description_ja : badge.description;

              return (
                <div
                  key={badge.id}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border transition-all duration-200 ${
                    isEarned
                      ? 'bg-[#FAF1F3]/40 border-sakura/25 dark:bg-sakura/5'
                      : 'bg-bg/10 border-border/40 opacity-40 grayscale'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
                    isEarned ? 'bg-sakura/10 border border-sakura/15' : 'bg-bg'
                  }`}>
                    {isEarned ? badge.icon : '🔒'}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${isEarned ? 'text-sakura-deep' : 'text-ink-muted'}`}>
                        {badgeName}
                      </span>
                      {isEarned && (
                        <span className="text-[8px] bg-matcha/10 text-matcha font-bold px-1.5 py-0 rounded border border-matcha/10">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-ink-muted leading-relaxed font-medium">
                      {badgeDesc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
