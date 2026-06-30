'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Search, Sparkles, BookOpen, Layers, Check, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SlangItem {
  phrase: string;
  meaning: string;
  source: 'curated' | 'my_submission';
  dayNumber?: number;
  type: 'idiom' | 'slang' | 'expression';
}

const CURATED_SLANGS: SlangItem[] = [
  { phrase: "No cap", meaning: "No lie; speaking the absolute truth.", source: "curated", type: "slang" },
  { phrase: "Spill the beans", meaning: "To reveal secret information prematurely.", source: "curated", type: "idiom" },
  { phrase: "Break a leg", meaning: "A superstitious way to wish a performer good luck.", source: "curated", type: "idiom" },
  { phrase: "Throw shade", meaning: "To subtly or indirectly insult or express contempt for someone.", source: "curated", type: "slang" },
  { phrase: "Hit the sack", meaning: "To go to bed/sleep.", source: "curated", type: "idiom" },
  { phrase: "Bite the bullet", meaning: "To face a difficult situation with courage and get it over with.", source: "curated", type: "idiom" },
  { phrase: "Under the weather", meaning: "Feeling slightly sick or unwell.", source: "curated", type: "idiom" },
  { phrase: "On the house", meaning: "Provided free of charge by a business/restaurant.", source: "curated", type: "expression" },
  { phrase: "Rule of thumb", meaning: "A broadly accurate guide or principle based on practice rather than theory.", source: "curated", type: "idiom" },
  { phrase: "Rent free", meaning: "Thinking about someone or something constantly without being able to stop.", source: "curated", type: "slang" },
  { phrase: "Beat around the bush", meaning: "Avoid speaking directly about the main topic/issue.", source: "curated", type: "idiom" },
  { phrase: "Pull someone's leg", meaning: "To tease or play a friendly joke on someone.", source: "curated", type: "idiom" }
];

export default function IdiomsPage() {
  const [list, setList] = useState<SlangItem[]>(CURATED_SLANGS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'curated' | 'my_submission'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'idiom' | 'slang'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubmissions() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch student logs containing slangs
        const { data: logs } = await supabase
          .from('user_day_progress')
          .select('day_number, songs_new_words')
          .eq('user_id', user.id)
          .not('songs_new_words', 'is', null);

        if (logs && logs.length > 0) {
          const submittedItems: SlangItem[] = [];
          
          logs.forEach((log) => {
            if (!log.songs_new_words) return;
            // Split by comma
            const phrases = log.songs_new_words.split(',').map((p: string) => p.trim()).filter(Boolean);
            phrases.forEach((phrase: string) => {
              // Avoid duplicate submissions
              if (!submittedItems.some(i => i.phrase.toLowerCase() === phrase.toLowerCase())) {
                submittedItems.push({
                  phrase,
                  meaning: `Discovered during Day ${log.day_number} Song analysis.`,
                  source: 'my_submission',
                  dayNumber: log.day_number,
                  type: 'expression'
                });
              }
            });
          });

          setList([...CURATED_SLANGS, ...submittedItems]);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }

    loadSubmissions();
  }, []);

  const filtered = list.filter((item) => {
    const matchesSearch = 
      item.phrase.toLowerCase().includes(search.toLowerCase()) ||
      item.meaning.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter !== 'all' && item.source !== filter) return false;
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink flex items-center gap-2 select-none">
          <MessageSquare className="w-8 h-8 text-sakura" />
          Slang & Idiom Bank
        </h1>
        <p className="text-sm text-ink-muted mt-0.5 font-medium">
          A dictionary of daily slang, pop-culture idioms, and custom expressions you logged during studies.
        </p>
      </div>

      {/* Progress metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border border-border bg-card rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Slang Bank Capacity</span>
          <div className="text-2xl font-black text-ink mt-1">
            {list.length} Expressions
          </div>
          <span className="text-[10px] text-ink-muted font-medium mt-0.5 block">
            {list.filter(i => i.source === 'my_submission').length} Custom additions
          </span>
        </Card>

        <Card className="border border-border bg-sakura/5 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-sakura-deep uppercase tracking-wider block flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Daily Focus
          </span>
          <div className="text-xs font-semibold text-ink leading-relaxed mt-1.5">
            Log new slang in your Daily Songs task to expand this bank dynamically.
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-ink-muted/50" />
          <input
            type="text"
            placeholder="Search slang phrase or meaning..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-ink placeholder-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-sakura/20 focus:border-sakura shadow-sm transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-between select-none">
          {/* Source filters */}
          <div className="flex gap-1 bg-card border border-border p-1 rounded-xl shadow-sm">
            {(['all', 'curated', 'my_submission'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer
                  ${filter === s ? 'bg-sakura text-white' : 'text-ink-muted hover:text-sakura'}`}
              >
                {s === 'all' ? 'All' : s === 'curated' ? 'Featured' : 'My Logged'}
              </button>
            ))}
          </div>

          {/* Type filters */}
          <div className="flex gap-1 bg-card border border-border p-1 rounded-xl shadow-sm">
            {(['all', 'idiom', 'slang'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer
                  ${typeFilter === t ? 'bg-matcha text-white font-medium' : 'text-ink-muted hover:text-matcha'}`}
              >
                {t === 'all' ? 'All Types' : t === 'idiom' ? 'Idioms Only' : 'Slang Only'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-ink-muted/50 font-medium animate-pulse">
            Loading expressions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-sm text-ink-muted/50 italic border border-dashed border-border rounded-2xl select-none">
            No slang found matching filters.
          </div>
        ) : (
          filtered.map((item, idx) => (
            <Card key={idx} className="border border-border bg-card rounded-2xl shadow-sm transition-all hover:scale-105">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-[9px] select-none capitalize ${
                      item.source === 'my_submission' 
                        ? 'border-matcha/40 bg-matcha/5 text-matcha' 
                        : 'border-sakura/30 bg-sakura/5 text-sakura-deep'
                    }`}>
                      {item.source === 'my_submission' ? `Day ${item.dayNumber} log` : item.type}
                    </Badge>
                  </div>
                  
                  <h3 className="font-display font-extrabold text-lg text-ink leading-tight">
                    {item.phrase}
                  </h3>
                  
                  <p className="text-xs text-ink-muted leading-relaxed font-semibold">
                    {item.meaning}
                  </p>
                </div>

                {item.source === 'my_submission' && (
                  <div className="text-[9px] text-matcha font-bold flex items-center gap-1 border-t border-border/40 pt-2.5 select-none">
                    <Check className="w-3.5 h-3.5" /> Logged by you
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
