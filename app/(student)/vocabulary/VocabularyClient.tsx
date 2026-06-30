'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search, Check, Filter, Sparkles, Brain } from 'lucide-react';
import Flashcards from '@/components/Flashcards';
import ConfettiBurst from '@/components/ConfettiBurst';

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
  due_date?: string;
  review_count?: number;
  ease_factor?: number;
  interval?: number;
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
  const [activeTab, setActiveTab] = useState<'review' | 'explorer'>('review');
  const [progress, setProgress] = useState<VocabProgress[]>(initialProgress);
  const [search, setSearch] = useState('');
  const [learnedFilter, setLearnedFilter] = useState<'all' | 'learned' | 'not_learned'>('all');
  const [monthFilter, setMonthFilter] = useState<'all' | 1 | 2 | 3>('all');
  
  // Confetti trigger when review deck is finished
  const [celebrate, setCelebrate] = useState(false);

  // Compute due reviews
  const todayStr = new Date().toISOString().split('T')[0];
  
  // A word is due if it has been marked as learned at least once,
  // AND (due_date is null OR due_date <= today)
  const reviewWords = vocabWords.filter((word) => {
    const wordProg = progress.find((p) => p.word_index === word.word_index);
    if (!wordProg || !wordProg.learned) return false;
    
    // If due_date is missing, it counts as due for review initial seeding
    if (!wordProg.due_date) return true;
    return wordProg.due_date <= todayStr;
  });

  const handleToggleWord = async (wordIndex: number, checked: boolean) => {
    const supabase = createClient();

    if (checked) {
      const { error } = await supabase
        .from('user_vocab_progress')
        .upsert({
          user_id: userId,
          word_index: wordIndex,
          learned: true,
          due_date: todayStr,
          review_count: 0,
          ease_factor: 2.5,
          interval: 1
        }, { onConflict: 'user_id,word_index' });

      if (!error) {
        setProgress(prev => {
          const filtered = prev.filter(p => p.word_index !== wordIndex);
          return [...filtered, {
            word_index: wordIndex,
            learned: true,
            due_date: todayStr,
            review_count: 0,
            ease_factor: 2.5,
            interval: 1
          }];
        });
      }
    } else {
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

  // Tinder swipe deck handler for review cards
  const handleReviewSwipe = async (wordIndex: number, mastered: boolean) => {
    const supabase = createClient();
    
    const existing = progress.find(p => p.word_index === wordIndex);
    const score = mastered ? 5 : 1;
    const currentReps = existing?.review_count || 0;
    const currentInterval = existing?.interval || 1;
    const currentEase = existing?.ease_factor || 2.5;

    const { calculateSM2 } = require('@/lib/sm2');
    const sm2Result = calculateSM2(score, currentReps, currentInterval, currentEase);

    const updatedRow = {
      user_id: userId,
      word_index: wordIndex,
      learned: true, // Keep learned flag active
      due_date: sm2Result.dueDate,
      review_count: sm2Result.repetitions,
      ease_factor: sm2Result.easeFactor,
      interval: sm2Result.interval
    };

    const { error } = await supabase
      .from('user_vocab_progress')
      .upsert(updatedRow, { onConflict: 'user_id,word_index' });

    if (!error) {
      setProgress(prev => {
        const filtered = prev.filter(p => p.word_index !== wordIndex);
        return [...filtered, updatedRow];
      });
    }
  };

  const isWordLearned = (wordIndex: number) => {
    return progress.some(p => p.word_index === wordIndex && p.learned);
  };

  // Filter words inside the library explorer
  const filteredWords = vocabWords.filter(word => {
    const matchesSearch = 
      word.word.toLowerCase().includes(search.toLowerCase()) || 
      word.meaning.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    const isLearned = isWordLearned(word.word_index);
    if (learnedFilter === 'learned' && !isLearned) return false;
    if (learnedFilter === 'not_learned' && isLearned) return false;

    if (monthFilter === 1 && (word.word_index < 1 || word.word_index > 100)) return false;
    if (monthFilter === 2 && (word.word_index < 101 || word.word_index > 200)) return false;
    if (monthFilter === 3 && (word.word_index < 201 || word.word_index > 300)) return false;

    return true;
  });

  const learnedCount = progress.filter(p => p.learned).length;
  const percentLearned = Math.round((learnedCount / 300) * 100);

  return (
    <div className="space-y-6">
      {celebrate && <ConfettiBurst />}

      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink flex items-center gap-2 select-none">
            <BookOpen className="w-8 h-8 text-sakura" />
            Vocab Review Center
          </h1>
          <p className="text-sm text-ink-muted mt-0.5">
            Master the 300 core Oxford vocabulary words using Spaced Repetition (SM-2).
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-card border border-border p-1 rounded-xl shadow-sm self-start sm:self-center select-none">
          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer
              ${activeTab === 'review' ? 'bg-sakura text-white' : 'text-ink-muted hover:text-sakura'}`}
          >
            <Brain size={14} /> Review ({reviewWords.length})
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer
              ${activeTab === 'explorer' ? 'bg-sakura text-white' : 'text-ink-muted hover:text-sakura'}`}
          >
            <Search size={14} /> Library Explorer
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'review' ? (
        <div className="space-y-6">
          {reviewWords.length > 0 ? (
            <Card className="border border-border bg-card rounded-2xl p-6 flex flex-col items-center">
              <div className="text-center max-w-sm mb-4 space-y-1 select-none">
                <h3 className="font-display font-bold text-lg text-ink">
                  Spaced Repetition Drills
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  These words are due for review based on your performance. Swipe right if you remember, swipe left to review again.
                </p>
              </div>

              <Flashcards
                words={reviewWords}
                learnedIndices={[]} // Always start uncompleted for review drills
                onWordMastered={handleReviewSwipe}
                onAllCompleted={() => {
                  setCelebrate(true);
                  setTimeout(() => setCelebrate(false), 3000);
                }}
              />
            </Card>
          ) : (
            <Card className="border border-border bg-matcha/5 border-l-4 border-l-matcha rounded-2xl p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-matcha/10 text-matcha rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-xl text-ink">
                  No Reviews Due Today! 🌸
                </h3>
                <p className="text-sm text-ink-muted max-w-sm mx-auto">
                  Your vocabulary memory is blooming beautifully. New words will become due for review automatically as time passes.
                </p>
              </div>
              <div className="pt-2">
                <Button
                  onClick={() => setActiveTab('explorer')}
                  className="bg-sakura hover:bg-sakura-deep/90 text-white dark:text-bg rounded-xl font-bold text-xs cursor-pointer"
                >
                  Browse Vocabulary Library
                </Button>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Progress tracker */}
          <Card className="border border-border bg-card/75 rounded-2xl shadow-sm">
            <CardContent className="p-5 flex items-center justify-between gap-6 flex-wrap sm:flex-nowrap">
              <div className="space-y-1 flex-1 min-w-[200px]">
                <div className="flex justify-between text-xs font-semibold text-ink-muted">
                  <span>Library Progress</span>
                  <span>{learnedCount} / 300 words ({percentLearned}%)</span>
                </div>
                <Progress value={percentLearned} className="h-2.5 bg-border" />
              </div>
              <Badge className="bg-matcha text-white hover:bg-matcha border-none px-3.5 py-1.5 rounded-xl font-semibold text-sm">
                Keep Blooming! 🌸
              </Badge>
            </CardContent>
          </Card>

          {/* Search & Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-ink-muted/50" />
              <input
                type="text"
                placeholder="Search words or meanings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-ink placeholder-ink-muted/40 focus:outline-none focus:ring-2 focus:ring-sakura/20 focus:border-sakura shadow-sm transition-all"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center justify-between">
              {/* Learned filters */}
              <div className="flex gap-1 bg-card border border-border p-1 rounded-xl shadow-sm">
                {(['all', 'learned', 'not_learned'] as const).map((filter) => (
                  <Button
                    key={filter}
                    size="sm"
                    variant={learnedFilter === filter ? 'default' : 'ghost'}
                    onClick={() => setLearnedFilter(filter)}
                    className={`text-xs h-7 px-2.5 rounded-lg cursor-pointer ${
                      learnedFilter === filter
                        ? 'bg-sakura text-white hover:bg-sakura-deep/90'
                        : 'text-ink-muted hover:text-sakura'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter === 'learned' ? 'Learned' : 'Unlearned'}
                  </Button>
                ))}
              </div>

              {/* Month filter */}
              <div className="flex gap-1 bg-card border border-border p-1 rounded-xl shadow-sm">
                {(['all', 1, 2, 3] as const).map((m) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={monthFilter === m ? 'default' : 'ghost'}
                    onClick={() => setMonthFilter(m)}
                    className={`text-xs h-7 px-2.5 rounded-lg cursor-pointer ${
                      monthFilter === m
                        ? 'bg-matcha text-white hover:bg-matcha'
                        : 'text-ink-muted hover:text-matcha'
                    }`}
                  >
                    {m === 'all' ? 'All Months' : `Month ${m}`}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* List display */}
          <div className="grid grid-cols-1 gap-4">
            {filteredWords.length === 0 ? (
              <div className="text-center py-12 text-sm text-ink-muted/50 italic border border-dashed border-border rounded-2xl select-none">
                No vocabulary words match your current filters.
              </div>
            ) : (
              filteredWords.map((word) => {
                const learned = isWordLearned(word.word_index);
                const wordProg = progress.find(p => p.word_index === word.word_index);

                return (
                  <Card
                    key={word.word_index}
                    className={`border border-border bg-card rounded-2xl transition-all shadow-sm
                      ${learned ? 'bg-matcha/5 border-matcha/20 border-l-4 border-l-matcha' : 'border-l-4 border-l-border/50'}`}
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-lg font-bold text-ink">{word.word}</span>
                            {word.pronunciation && (
                              <span className="text-xs text-ink-muted font-mono">/{word.pronunciation}/</span>
                            )}
                            <Badge variant="outline" className="text-[9px] border-border text-ink-muted font-bold select-none">
                              No. {word.word_index}
                            </Badge>
                            {wordProg?.due_date && (
                              <Badge className="bg-sakura/10 text-sakura-deep hover:bg-sakura/10 text-[9px] font-bold select-none">
                                Review: {wordProg.due_date}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-ink-muted">
                            {word.meaning}
                          </p>
                        </div>

                        <Checkbox
                          checked={learned}
                          onCheckedChange={(checked) => handleToggleWord(word.word_index, !!checked)}
                          className="w-5 h-5 border-border data-[state=checked]:bg-matcha data-[state=checked]:border-matcha rounded-lg cursor-pointer mt-1"
                        />
                      </div>

                      <div className="bg-bg/40 p-3 rounded-xl text-xs italic text-ink-muted leading-relaxed">
                        <span className="font-bold not-italic text-ink mr-1">Example:</span>
                        "{word.example_sentence}"
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
