'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Volume2, Mic, Plus, Check, Trash2, Library, BookOpen, Layers, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { createClient } from '@/lib/supabase/client';
import TTSButton from '@/components/TTSButton';
import PronunciationPractice from '@/components/PronunciationPractice';

interface LibraryClientProps {
  profile: any;
  words: any[];
  initialProgress: any[];
}

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'emotions', label: 'Emotions (懐・喜)' },
  { id: 'daily_life', label: 'Daily Life (日常)' },
  { id: 'anime', label: 'Anime/Manga (アニメ)' },
  { id: 'music', label: 'Music & Art (音楽)' },
  { id: 'nature', label: 'Nature & Seasons (自然)' },
  { id: 'food', label: 'Food & Culture (食)' },
  { id: 'internet', label: 'Internet & Slang (ネット)' },
  { id: 'travel', label: 'Travel (旅行)' },
  { id: 'academic', label: 'Academic/Formal (教養)' }
];

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1'];

export default function LibraryClient({ profile, words, initialProgress }: LibraryClientProps) {
  const { lang, t } = useI18n();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'browse' | 'deck'>('browse');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('All');
  const [progressList, setProgressList] = useState<any[]>(initialProgress);
  const [activePracticeWordId, setActivePracticeWordId] = useState<number | null>(null);

  // Map of word_id -> progress status
  const progressMap = new Map(progressList.map(p => [p.word_id, p.status]));

  // 1. Add to SRS study deck
  const handleAddToDeck = async (wordId: number) => {
    try {
      const { data, error } = await supabase
        .from('library_progress')
        .upsert({
          user_id: profile.id,
          word_id: wordId,
          status: 'learning',
          due_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (!error && data) {
        setProgressList(prev => {
          const filtered = prev.filter(p => p.word_id !== wordId);
          return [...filtered, data];
        });
      }
    } catch (err) {
      console.error("Failed to add word to deck:", err);
    }
  };

  // 2. Remove from deck
  const handleRemoveFromDeck = async (wordId: number) => {
    try {
      const { error } = await supabase
        .from('library_progress')
        .delete()
        .eq('user_id', profile.id)
        .eq('word_id', wordId);

      if (!error) {
        setProgressList(prev => prev.filter(p => p.word_id !== wordId));
        if (activePracticeWordId === wordId) {
          setActivePracticeWordId(null);
        }
      }
    } catch (err) {
      console.error("Failed to remove word from deck:", err);
    }
  };

  // 3. Mark as Mastered
  const handleMarkMastered = async (wordId: number) => {
    try {
      const { data, error } = await supabase
        .from('library_progress')
        .update({ status: 'mastered' })
        .eq('user_id', profile.id)
        .eq('word_id', wordId)
        .select()
        .single();

      if (!error && data) {
        setProgressList(prev => {
          const filtered = prev.filter(p => p.word_id !== wordId);
          return [...filtered, data];
        });
      }
    } catch (err) {
      console.error("Failed to mark word as mastered:", err);
    }
  };

  // Filter browse words list
  const filteredWords = words.filter(w => {
    const matchesSearch = w.word.toLowerCase().includes(search.toLowerCase()) ||
      (w.meaning && w.meaning.toLowerCase().includes(search.toLowerCase())) ||
      (w.meaning_ja && w.meaning_ja.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = category === 'all' || w.category === category;
    const matchesLevel = level === 'All' || w.difficulty_level === level;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  // Study deck words list
  const deckWordIds = progressList.filter(p => p.status === 'learning').map(p => p.word_id);
  const deckWords = words.filter(w => deckWordIds.includes(w.id));

  // Mastered words count
  const masteredCount = progressList.filter(p => p.status === 'mastered').length;

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto p-2 sm:p-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink flex items-center gap-2">
            <Library className="w-8 h-8 text-sakura" />
            Sakura Word Library
          </h1>
          <p className="text-xs text-ink-muted mt-1 font-medium leading-relaxed">
            Expand your vocabulary with 500+ handpicked anime, music, internet, and daily slang terms.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-bg border border-border p-1 rounded-xl shadow-xs self-stretch sm:self-auto">
          <button
            onClick={() => { setActiveTab('browse'); setActivePracticeWordId(null); }}
            className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'browse'
                ? 'bg-sakura text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <BookOpen size={14} /> Browse Library ({words.length})
          </button>
          <button
            onClick={() => { setActiveTab('deck'); setActivePracticeWordId(null); }}
            className={`flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'deck'
                ? 'bg-sakura text-white shadow-xs'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Layers size={14} /> Study Deck ({deckWords.length})
          </button>
        </div>
      </div>

      {activeTab === 'browse' ? (
        <div className="space-y-6">
          {/* Browse Search Bar & Filters */}
          <Card className="border border-border bg-card rounded-2xl shadow-xs p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-ink-muted" />
                <input
                  placeholder="Search words, translations, or meanings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 border border-border/80 focus:border-sakura focus:ring-sakura rounded-xl text-sm w-full bg-card px-3"
                />
              </div>

              {/* CEFR Level filter */}
              <div className="flex gap-1.5 self-center sm:self-auto overflow-x-auto pb-1 sm:pb-0">
                {LEVELS.map(l => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                      level === l
                        ? 'bg-sakura/10 text-sakura border-sakura/30'
                        : 'border-border/60 hover:bg-bg/40 text-ink-muted hover:text-ink'
                    }`}
                  >
                    {l === 'All' ? 'All Levels' : l}
                  </button>
                ))}
              </div>
            </div>

            {/* Category horizontal strip filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border shrink-0 transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-sakura text-white border-sakura shadow-sm'
                      : 'border-border/60 bg-bg/20 hover:bg-bg/50 text-ink-muted hover:text-ink'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Stats Bar */}
          <div className="flex justify-between items-center text-xs font-bold text-ink-muted px-1 select-none">
            <span>Showing {filteredWords.length} words</span>
            <span className="flex items-center gap-1 text-matcha">
              <Check size={14} /> {masteredCount} Library Words Mastered
            </span>
          </div>

          {/* Words Grid list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWords.length === 0 ? (
              <div className="col-span-full text-center py-16 text-ink-muted/50 italic bg-card border border-border border-dashed rounded-2xl">
                No matching words found in this category or level. Try clearing filters!
              </div>
            ) : (
              filteredWords.map(w => {
                const status = progressMap.get(w.id);
                const isLearning = status === 'learning';
                const isMastered = status === 'mastered';

                return (
                  <Card key={w.id} className="border border-border bg-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-extrabold text-xl text-ink">
                              {w.word}
                            </h3>
                            <Badge className="bg-sakura/10 text-sakura-deep hover:bg-sakura/10 border-none font-bold text-[9px] px-2 py-0.5 rounded">
                              {w.difficulty_level}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                            <span className="font-mono text-[10px] italic">/{w.pronunciation}/</span>
                            <span>·</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider">{w.part_of_speech}</span>
                          </div>
                        </div>

                        {/* Speech Play Trigger */}
                        <div className="flex items-center gap-1">
                          <TTSButton text={w.word} size="icon" />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setActivePracticeWordId(activePracticeWordId === w.id ? null : w.id)}
                            className={`border-border/60 hover:bg-bg rounded-xl shrink-0 cursor-pointer ${activePracticeWordId === w.id ? 'bg-sakura/10 text-sakura border-sakura/20' : 'text-ink-muted'}`}
                            title="Pronunciation Practice"
                          >
                            <Mic size={15} />
                          </Button>
                        </div>
                      </div>

                      {/* Meanings */}
                      <div className="space-y-1.5 pt-1 text-left">
                        <div className="text-sm font-semibold text-ink leading-relaxed">
                          {lang === 'ja' && w.meaning_ja ? w.meaning_ja : w.meaning}
                        </div>
                        <p className="text-xs text-ink-muted italic leading-relaxed">
                          "{w.example_sentence}"
                        </p>
                      </div>
                    </div>

                    {/* Inline Speaking Challenge panel */}
                    {activePracticeWordId === w.id && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <PronunciationPractice
                          targetText={w.word}
                          onSuccess={() => handleAddToDeck(w.id)}
                        />
                      </div>
                    )}

                    {/* Add to Deck toggle button */}
                    <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3">
                      <span className="text-[9px] font-bold text-ink-muted/50 uppercase tracking-widest">
                        Category: {w.category?.replace('_', ' ')}
                      </span>

                      {isMastered ? (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-matcha bg-matcha/5 border border-matcha/10 px-3 py-1.5 rounded-xl">
                          <Check size={12} /> Mastered
                        </div>
                      ) : isLearning ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFromDeck(w.id)}
                          className="text-xs text-destructive hover:bg-destructive/5 rounded-xl cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Remove from Deck
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddToDeck(w.id)}
                          className="bg-sakura hover:bg-sakura-deep text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
                        >
                          <Plus size={12} /> Add to Study Deck
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Deck view instructions banner */}
          <Card className="border border-border bg-[#FAF6F1]/60 dark:bg-card/45 rounded-2xl p-5 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-sakura/10 text-sakura flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-sakura-deep uppercase tracking-widest block">
                Study Deck Rules
              </span>
              <p className="text-xs text-ink-muted leading-relaxed font-semibold">
                Practice pronunciation for these queued library words. Achieve a passing score or complete reviews, then mark them as "Mastered" to remove them from your active review deck!
              </p>
            </div>
          </Card>

          {/* Study Deck Grid list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deckWords.length === 0 ? (
              <div className="col-span-full text-center py-20 text-ink-muted/50 italic bg-card border border-border border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3 select-none">
                <Sparkles className="w-8 h-8 text-sakura/40 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-ink font-heading">Your Study Deck is empty</h4>
                  <p className="text-xs text-ink-muted max-w-xs leading-relaxed">
                    Browse the library to find custom words and click "+" to add them here for active revision.
                  </p>
                </div>
              </div>
            ) : (
              deckWords.map(w => {
                return (
                  <Card key={w.id} className="border-2 border-sakura/10 bg-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-sm">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-extrabold text-xl text-ink">
                              {w.word}
                            </h3>
                            <Badge className="bg-sakura/15 text-sakura-deep hover:bg-sakura/15 border-none font-bold text-[9px] px-2 py-0.5 rounded">
                              {w.difficulty_level}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-ink-muted mt-0.5">
                            <span className="font-mono text-[10px] italic">/{w.pronunciation}/</span>
                            <span>·</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider">{w.part_of_speech}</span>
                          </div>
                        </div>

                        {/* Speech Play Trigger */}
                        <div className="flex items-center gap-1">
                          <TTSButton text={w.word} size="icon" />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setActivePracticeWordId(activePracticeWordId === w.id ? null : w.id)}
                            className={`border-border/60 hover:bg-bg rounded-xl shrink-0 cursor-pointer ${activePracticeWordId === w.id ? 'bg-sakura/10 text-sakura border-sakura/20' : 'text-ink-muted'}`}
                            title="Pronunciation Practice"
                          >
                            <Mic size={15} />
                          </Button>
                        </div>
                      </div>

                      {/* Meanings */}
                      <div className="space-y-1.5 pt-1 text-left">
                        <div className="text-sm font-semibold text-ink leading-relaxed">
                          {lang === 'ja' && w.meaning_ja ? w.meaning_ja : w.meaning}
                        </div>
                        <p className="text-xs text-ink-muted italic leading-relaxed">
                          "{w.example_sentence}"
                        </p>
                      </div>
                    </div>

                    {/* Inline Speaking Challenge panel */}
                    {activePracticeWordId === w.id && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <PronunciationPractice
                          targetText={w.word}
                          onSuccess={() => handleMarkMastered(w.id)}
                        />
                      </div>
                    )}

                    {/* Action controls */}
                    <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveFromDeck(w.id)}
                        className="text-xs text-destructive hover:bg-destructive/5 rounded-xl cursor-pointer flex items-center gap-1 px-2.5 py-1.5"
                      >
                        <Trash2 size={12} /> Remove
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleMarkMastered(w.id)}
                        className="bg-matcha hover:bg-matcha-deep text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1 px-3 py-1.5"
                      >
                        <Check size={12} /> Mark Mastered
                      </Button>
                    </div>
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
