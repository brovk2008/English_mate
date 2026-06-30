'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, ChevronUp, Layers, ExternalLink, HelpCircle } from 'lucide-react';

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

  const toggleExpand = (dayNumber: number) => {
    setExpandedDay(expandedDay === dayNumber ? null : dayNumber);
  };

  const filteredDays = daysList.filter(day => 
    day.grammar_topic.toLowerCase().includes(search.toLowerCase()) ||
    day.grammar_explainer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#33312E] flex items-center gap-2">
          <Layers className="w-7 h-7 text-[#E8A6B8]" />
          Grammar Index
        </h1>
        <p className="text-sm text-[#73706B]">
          Revisit all the grammar sheets and videos you have unlocked so far.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-[#73706B]/50" />
        <input
          type="text"
          placeholder="Search grammar topics or explanation text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-3 bg-white border border-[#E8E2D9] rounded-xl text-sm text-[#33312E] placeholder-[#73706B]/40 focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8] shadow-sm"
        />
      </div>

      {/* Grammar sheets list */}
      <div className="space-y-3">
        {filteredDays.length === 0 ? (
          <div className="text-center py-12 text-[#73706B]/50 italic bg-white border border-[#E8E2D9] rounded-xl">
            No grammar topics found matching your query.
          </div>
        ) : (
          filteredDays.map((day) => {
            const isExpanded = expandedDay === day.day_number;

            return (
              <Card 
                key={day.day_number} 
                className={`border border-[#E8E2D9] bg-white rounded-xl transition-all shadow-[0_2px_8px_rgba(232,166,184,0.01)] overflow-hidden`}
              >
                <div 
                  onClick={() => toggleExpand(day.day_number)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF6F1]/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="outline" className="border-[#E8E2D9] bg-[#FAF6F1]/50 text-[#73706B] font-mono shrink-0">
                      Day {day.day_number}
                    </Badge>
                    <span className="font-bold text-[#33312E] truncate font-sans">
                      {day.grammar_topic}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-[#73706B]/40 tracking-wider">
                      W{day.week}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#73706B]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#73706B]" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[#FAF6F1] bg-[#FAF6F1]/10 p-5 space-y-4">
                    <p className="text-sm text-[#73706B] leading-relaxed whitespace-pre-wrap">
                      {day.grammar_explainer}
                    </p>

                    {day.grammar_youtube_id ? (
                      <div className="aspect-video w-full max-w-2xl mx-auto rounded-xl overflow-hidden border border-[#E8E2D9] mt-3">
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${day.grammar_youtube_id}`}
                          title={`YouTube video for ${day.grammar_topic}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-[#FAF6F1]/40 border border-[#E8E2D9]/40 rounded-xl space-y-1">
                        <p className="text-xs text-[#73706B]/60 flex items-center justify-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5" /> No lesson video ID currently set.
                        </p>
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(day.grammar_topic + ' English lesson')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#E8A6B8] hover:underline"
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
