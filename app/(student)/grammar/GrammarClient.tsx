'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, ChevronUp, Layers, ExternalLink, HelpCircle } from 'lucide-react';
import YouTubeEmbed from '@/components/YouTubeEmbed';

interface DayGrammar {
  day_number: number;
  month: number;
  week: number;
  grammar_topic: string;
  grammar_explainer: string;
  grammar_youtube_id: string | null;
}

interface GrammarClientProps {
  daysList: DayGrammar[];
}

export default function GrammarClient({ daysList }: GrammarClientProps) {
  const [search, setSearch] = useState('');
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [monthFilter, setMonthFilter] = useState<'all' | 1 | 2 | 3>('all');

  const toggleExpand = (dayNumber: number) => {
    setExpandedDay(expandedDay === dayNumber ? null : dayNumber);
  };

  const filteredDays = daysList.filter(day => {
    const matchesSearch = 
      day.grammar_topic.toLowerCase().includes(search.toLowerCase()) ||
      day.grammar_explainer.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (monthFilter !== 'all' && day.month !== monthFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink flex items-center gap-2 select-none">
            <Layers className="w-8 h-8 text-sakura" />
            Grammar Timelines
          </h1>
          <p className="text-sm text-ink-muted mt-0.5 font-medium">
            Review and search the grammar sheets you have unlocked during your 90 days.
          </p>
        </div>

        {/* Month selector tabs */}
        <div className="flex bg-card border border-border p-1 rounded-xl shadow-sm self-start sm:self-center select-none">
          {(['all', 1, 2, 3] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMonthFilter(m)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer
                ${monthFilter === m ? 'bg-sakura text-white' : 'text-ink-muted hover:text-sakura'}`}
            >
              {m === 'all' ? 'All Months' : `Month ${m}`}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-ink-muted/50" />
        <input
          type="text"
          placeholder="Search grammar topics or explanation text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-ink placeholder-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-sakura/20 focus:border-sakura shadow-sm transition-all"
        />
      </div>

      {/* Grammar sheets list */}
      <div className="space-y-3">
        {filteredDays.length === 0 ? (
          <div className="text-center py-12 text-ink-muted/50 italic bg-card border border-border rounded-2xl select-none">
            No grammar topics found matching your query.
          </div>
        ) : (
          filteredDays.map((day) => {
            const isExpanded = expandedDay === day.day_number;

            return (
              <Card 
                key={day.day_number} 
                className={`border bg-card rounded-2xl transition-all shadow-sm overflow-hidden
                  ${isExpanded ? 'border-sakura/30 border-l-4 border-l-sakura' : 'border-border border-l-4 border-l-border/50'}`}
              >
                <div 
                  onClick={() => toggleExpand(day.day_number)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-bg/25 transition-colors select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className="border-border bg-bg/50 text-ink-muted font-mono shrink-0 font-bold text-[10px]">
                      Day {day.day_number}
                    </Badge>
                    <span className="font-bold text-ink truncate font-display text-base">
                      {day.grammar_topic}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-black text-ink-muted/55 tracking-wider">
                      Week {day.week}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-ink-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-ink-muted" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-bg/20 p-5 space-y-4">
                    <div className="bg-card border border-border rounded-xl p-4">
                      <span className="text-[9px] font-bold text-ink-muted uppercase block tracking-wider mb-2">Grammar Explainer</span>
                      <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap font-medium">
                        {day.grammar_explainer}
                      </p>
                    </div>

                    {day.grammar_youtube_id ? (
                      <div className="max-w-2xl mx-auto pt-2">
                        <YouTubeEmbed youtubeId={day.grammar_youtube_id} title={day.grammar_topic} />
                      </div>
                    ) : (
                      <div className="text-center py-5 bg-card border border-border rounded-xl space-y-1 max-w-2xl mx-auto">
                        <p className="text-xs text-ink-muted font-medium flex items-center justify-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-sakura" /> No lesson video ID currently set.
                        </p>
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(day.grammar_topic + ' English lesson')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-sakura hover:underline font-bold"
                        >
                          Search on YouTube <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
