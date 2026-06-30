'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, Check, Filter } from 'lucide-react';

interface VocabWord {
  word_index: number;
  word: string;
  pronunciation: string;
  meaning: string;
  example_sentence: string;
}

interface VocabProgress {
  word_index: number;
  learned: boolean;
}

interface VocabularyClientProps {
  userId: string;
  vocabWords: VocabWord[];
  initialProgress: VocabProgress[];
}

export default function VocabularyClient({
  userId,
  vocabWords,
  initialProgress,
}: VocabularyClientProps) {
  const [progress, setProgress] = useState<VocabProgress[]>(initialProgress);
  const [search, setSearch] = useState('');
  const [learnedFilter, setLearnedFilter] = useState<'all' | 'learned' | 'not_learned'>('all');
  const [monthFilter, setMonthFilter] = useState<'all' | 1 | 2 | 3>('all');

  const handleToggleWord = async (wordIndex: number, checked: boolean) => {
    const supabase = createClient();

    if (checked) {
      // Add
      const { error } = await supabase
        .from('user_vocab_progress')
        .upsert({
          user_id: userId,
          word_index: wordIndex,
          learned: true
        }, { onConflict: 'user_id,word_index' });

      if (!error) {
        setProgress(prev => [...prev, { word_index: wordIndex, learned: true }]);
      }
    } else {
      // Delete
      const { error } = await supabase
        .from('user_vocab_progress')
        .delete()
        .eq('user_id', userId)
        .eq('word_index', wordIndex);

      if (!error) {
        setProgress(prev => prev.filter(item => item.word_index !== wordIndex));
      }
    }
  };

  const isWordLearned = (wordIndex: number) => {
    return progress.some(p => p.word_index === wordIndex);
  };

  // Filter words
  const filteredWords = vocabWords.filter(word => {
    // 1. Search filter
    const matchesSearch = 
      word.word.toLowerCase().includes(search.toLowerCase()) || 
      word.meaning.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Learned filter
    const isLearned = isWordLearned(word.word_index);
    if (learnedFilter === 'learned' && !isLearned) return false;
    if (learnedFilter === 'not_learned' && isLearned) return false;

    // 3. Month filter
    if (monthFilter === 1 && (word.word_index < 1 || word.word_index > 100)) return false;
    if (monthFilter === 2 && (word.word_index < 101 || word.word_index > 200)) return false;
    if (monthFilter === 3 && (word.word_index < 201 || word.word_index > 300)) return false;

    return true;
  });

  const learnedCount = progress.length;
  const percentLearned = Math.round((learnedCount / 300) * 100);

  return (
    <div className="space-y-6">
      {/* Header title */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#33312E] flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-[#E8A6B8]" />
          Oxford Vocabulary Explorer
        </h1>
        <p className="text-sm text-[#73706B]">
          Revisit and track your mastery of all 300 primary words.
        </p>
      </div>

      {/* Progress tracker */}
      <Card className="border border-[#E8E2D9] bg-white rounded-xl shadow-[0_2px_10px_rgba(232,166,184,0.02)]">
        <CardContent className="p-5 flex items-center justify-between gap-6 flex-wrap sm:flex-nowrap">
          <div className="space-y-1 flex-1 min-w-[200px]">
            <div className="flex justify-between text-xs font-semibold text-[#73706B]">
              <span>Mastery Progress</span>
              <span>{learnedCount} / 300 words ({percentLearned}%)</span>
            </div>
            <Progress value={percentLearned} className="h-2 bg-[#FAF6F1]/50" />
          </div>
          <div className="bg-[#5B7F6B]/10 text-[#5B7F6B] px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-semibold text-sm">
            <Check className="w-4 h-4" /> Keep Blooming!
          </div>
        </CardContent>
      </Card>

      {/* Search & Filters */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-[#73706B]/50" />
          <input
            type="text"
            placeholder="Search words or meanings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-white border border-[#E8E2D9] rounded-xl text-sm text-[#33312E] placeholder-[#73706B]/40 focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8] shadow-sm"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          {/* Learned states */}
          <div className="flex gap-1.5 bg-white border border-[#E8E2D9] p-1 rounded-xl shadow-sm">
            <Button
              size="sm"
              variant={learnedFilter === 'all' ? 'default' : 'ghost'}
              onClick={() => setLearnedFilter('all')}
              className={`text-xs h-8 rounded-lg cursor-pointer ${learnedFilter === 'all' ? 'bg-[#E8A6B8] text-white hover:bg-[#E8A6B8]' : 'text-[#73706B] hover:text-[#E8A6B8]'}`}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={learnedFilter === 'learned' ? 'default' : 'ghost'}
              onClick={() => setLearnedFilter('learned')}
              className={`text-xs h-8 rounded-lg cursor-pointer ${learnedFilter === 'learned' ? 'bg-[#E8A6B8] text-white hover:bg-[#E8A6B8]' : 'text-[#73706B] hover:text-[#E8A6B8]'}`}
            >
              Learned
            </Button>
            <Button
              size="sm"
              variant={learnedFilter === 'not_learned' ? 'default' : 'ghost'}
              onClick={() => setLearnedFilter('not_learned')}
              className={`text-xs h-8 rounded-lg cursor-pointer ${learnedFilter === 'not_learned' ? 'bg-[#E8A6B8] text-white hover:bg-[#E8A6B8]' : 'text-[#73706B] hover:text-[#E8A6B8]'}`}
            >
              Unlearned
            </Button>
          </div>

          {/* Month brackets */}
          <div className="flex gap-1.5 bg-white border border-[#E8E2D9] p-1 rounded-xl shadow-sm">
            <Button
              size="sm"
              variant={monthFilter === 'all' ? 'default' : 'ghost'}
              onClick={() => setMonthFilter('all')}
              className={`text-xs h-8 rounded-lg cursor-pointer ${monthFilter === 'all' ? 'bg-[#5B7F6B] text-white hover:bg-[#5B7F6B]' : 'text-[#73706B] hover:text-[#5B7F6B]'}`}
            >
              All Months
            </Button>
            <Button
              size="sm"
              variant={monthFilter === 1 ? 'default' : 'ghost'}
              onClick={() => setMonthFilter(1)}
              className={`text-xs h-8 rounded-lg cursor-pointer ${monthFilter === 1 ? 'bg-[#5B7F6B] text-white hover:bg-[#5B7F6B]' : 'text-[#73706B] hover:text-[#5B7F6B]'}`}
            >
              Month 1
            </Button>
            <Button
              size="sm"
              variant={monthFilter === 2 ? 'default' : 'ghost'}
              onClick={() => setMonthFilter(2)}
              className={`text-xs h-8 rounded-lg cursor-pointer ${monthFilter === 2 ? 'bg-[#5B7F6B] text-white hover:bg-[#5B7F6B]' : 'text-[#73706B] hover:text-[#5B7F6B]'}`}
            >
              Month 2
            </Button>
            <Button
              size="sm"
              variant={monthFilter === 3 ? 'default' : 'ghost'}
              onClick={() => setMonthFilter(3)}
              className={`text-xs h-8 rounded-lg cursor-pointer ${monthFilter === 3 ? 'bg-[#5B7F6B] text-white hover:bg-[#5B7F6B]' : 'text-[#73706B] hover:text-[#5B7F6B]'}`}
            >
              Month 3
            </Button>
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="space-y-3">
        {filteredWords.length === 0 ? (
          <div className="text-center py-12 text-[#73706B]/50 italic bg-white border border-[#E8E2D9] rounded-xl">
            No matching words found.
          </div>
        ) : (
          filteredWords.map((word) => {
            const learned = isWordLearned(word.word_index);
            const month = Math.ceil(word.word_index / 100);
            
            return (
              <Card 
                key={word.word_index} 
                className={`border border-[#E8E2D9] bg-white rounded-xl transition-all ${
                  learned ? 'bg-[#FAF6F1]/30 border-[#E8E2D9]/40' : ''
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Badge variant="outline" className="border-[#E8E2D9] bg-[#FAF6F1]/50 text-[#73706B] font-mono mt-1 shrink-0 scale-90">
                      W{word.word_index}
                    </Badge>
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-bold text-[#33312E]">{word.word}</span>
                        <span className="text-xs text-[#73706B]/70 font-mono">[{word.pronunciation}]</span>
                        <span className="text-[10px] uppercase font-bold text-[#C9A86A] bg-[#C9A86A]/5 px-1.5 py-0.5 rounded">
                          M{month}
                        </span>
                      </div>
                      <p className="text-sm text-[#73706B] mt-1 leading-relaxed">
                        {word.meaning}
                      </p>
                      <p className="text-xs italic text-[#73706B]/60 mt-1">
                        "{word.example_sentence}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center shrink-0">
                    <Checkbox
                      checked={learned}
                      onCheckedChange={(checked) => handleToggleWord(word.word_index, !!checked)}
                      className="w-5 h-5 border-[#E8E2D9] data-[state=checked]:bg-[#E8A6B8] data-[state=checked]:border-[#E8A6B8] rounded cursor-pointer"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
