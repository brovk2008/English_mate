'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Volume2, X, PlusCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import dictionary from '@/data/dictionary.json';

interface LookupDetails {
  word: string;
  pronunciation?: string;
  meaning: string;
  meaning_ja: string;
  example: string;
  isCustom?: boolean;
}

interface WordLookupContextType {
  triggerWordLookup: (word: string, x: number, y: number) => void;
}

const WordLookupContext = createContext<WordLookupContextType | undefined>(undefined);

export function useWordLookup() {
  const context = useContext(WordLookupContext);
  if (!context) {
    throw new Error('useWordLookup must be used within a WordLookupProvider');
  }
  return context;
}

export default function WordLookupProvider({ children }: { children: React.ReactNode }) {
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [details, setDetails] = useState<LookupDetails | null>(null);
  const [isAddingSRS, setIsAddingSRS] = useState(false);
  const [addedSRS, setAddedSRS] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const triggerWordLookup = async (word: string, clientX: number, clientY: number) => {
    const cleaned = word.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    if (!cleaned || cleaned.length <= 1) return;

    setActiveWord(cleaned);
    setPosition({ x: clientX, y: clientY });
    setDetails(null);
    setAddedSRS(false);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // 1. Search database vocab_words first
      const { data: vocabMatch } = await supabase
        .from('vocab_words')
        .select('*')
        .eq('word', cleaned)
        .maybeSingle();

      if (vocabMatch) {
        setDetails({
          word: vocabMatch.word,
          pronunciation: vocabMatch.pronunciation || '',
          meaning: vocabMatch.meaning,
          meaning_ja: vocabMatch.meaning_ja || '',
          example: vocabMatch.example_sentence || '',
          isCustom: false
        });
      } else {
        // 2. Search local dictionary mapping
        const localMatch = (dictionary as any)[cleaned];
        if (localMatch) {
          setDetails({
            word: cleaned,
            pronunciation: localMatch.pronunciation,
            meaning: localMatch.meaning,
            meaning_ja: localMatch.meaning_ja,
            example: localMatch.example,
            isCustom: true
          });
        } else {
          // If not found in either, provide a placeholder / auto-translate outline
          setDetails({
            word: cleaned,
            meaning: `Click "Add to SRS" to define and study this word.`,
            meaning_ja: `この単語をタップして辞書登録またはSRS学習デッキに追加できます。`,
            example: `I encountered the word "${cleaned}" in today's lesson.`,
            isCustom: true
          });
        }
      }

      // 3. Log search to word_lookups database table
      if (user) {
        await supabase.from('word_lookups').insert({
          user_id: user.id,
          word: cleaned,
          context_page: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
        });
      }
    } catch (err) {
      console.error('Word lookup logging error:', err);
    }
  };

  // Text Selection listeners
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Avoid triggering when clicking inside the lookup popup itself
      if (containerRef.current?.contains(e.target as Node)) return;

      const selection = window.getSelection();
      if (!selection) return;

      const text = selection.toString().trim();
      // Ensure single word selections
      if (text && text.length > 1 && text.length < 25 && !text.includes(' ') && !text.includes('\n')) {
        triggerWordLookup(text, e.clientX, e.clientY);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;

      const selection = window.getSelection();
      if (!selection) return;

      const text = selection.toString().trim();
      if (text && text.length > 1 && text.length < 25 && !text.includes(' ') && e.changedTouches[0]) {
        triggerWordLookup(text, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveWord(null);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveWord(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Speak word aloud using browser synthesis
  const speakWord = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85; // slower, natural pace
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAddToSRS = async () => {
    if (!details) return;
    setIsAddingSRS(true);
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if word exists in vocab_words first, if not insert it
      let wordIndex = 999; // custom word marker
      
      const { data: vocabMatch } = await supabase
        .from('vocab_words')
        .select('word_index')
        .eq('word', details.word)
        .maybeSingle();

      if (vocabMatch) {
        wordIndex = vocabMatch.word_index;
      } else {
        // Insert custom word into vocab_words first to maintain database schema references
        const { data: maxIdxRow } = await supabase
          .from('vocab_words')
          .select('word_index')
          .order('word_index', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        const nextIdx = (maxIdxRow?.word_index || 300) + 1;
        wordIndex = nextIdx;

        await supabase.from('vocab_words').insert({
          word_index: nextIdx,
          word: details.word,
          pronunciation: details.pronunciation || '',
          meaning: details.meaning,
          meaning_ja: details.meaning_ja,
          example_sentence: details.example,
          month: 99, // custom Month
          week: 99,
          day: 99
        });
      }

      // Add to user vocab reviews
      await supabase.from('user_vocab_progress').upsert({
        user_id: user.id,
        word_index: wordIndex,
        learned: false,
        due_date: new Date().toISOString() // Due today for review
      }, { onConflict: 'user_id,word_index' });

      setAddedSRS(true);
    } catch (err) {
      console.error('Error adding custom word to SRS:', err);
    } finally {
      setIsAddingSRS(false);
    }
  };

  return (
    <WordLookupContext.Provider value={{ triggerWordLookup }}>
      {children}

      <AnimatePresence>
        {activeWord && details && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{
              position: 'fixed',
              top: Math.max(80, Math.min(window.innerHeight - 200, position.y - 170)),
              left: Math.max(20, Math.min(window.innerWidth - 300, position.x - 130)),
              zIndex: 9999
            }}
            className="w-[280px] bg-card border border-border rounded-2xl shadow-2xl p-4 space-y-3 font-sans"
          >
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-[10px] font-bold text-sakura-deep tracking-wider uppercase font-mono">
                Word Lookup
              </span>
              <button
                onClick={() => setActiveWord(null)}
                className="text-ink-muted hover:text-sakura p-0.5 rounded cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-display font-black text-base text-ink">
                  {details.word}
                </span>
                {details.pronunciation && (
                  <span className="text-[10px] text-ink-muted font-mono">
                    /{details.pronunciation}/
                  </span>
                )}
                <button
                  onClick={() => speakWord(details.word)}
                  className="p-1 text-ink-muted hover:text-sakura rounded cursor-pointer"
                  title="Speak"
                >
                  <Volume2 size={13} />
                </button>
              </div>

              <div className="space-y-1 mt-1 text-[11px] leading-relaxed">
                <p className="text-ink font-semibold">{details.meaning}</p>
                <p className="text-ink-muted italic font-medium">{details.meaning_ja}</p>
              </div>
            </div>

            <div className="border-t border-border/40 pt-2 space-y-1.5">
              <span className="text-[8px] font-bold text-ink-muted uppercase tracking-wider block">
                Example Sentence
              </span>
              <p className="text-[10px] italic text-ink leading-normal font-medium">
                "{details.example}"
              </p>
            </div>

            <div className="pt-1 flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isAddingSRS || addedSRS}
                onClick={handleAddToSRS}
                className="w-full text-[9px] h-7 font-bold border-sakura/20 text-sakura hover:bg-sakura/5 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
              >
                {addedSRS ? (
                  <>
                    <Check size={11} className="text-matcha" /> Added to Study Deck
                  </>
                ) : (
                  <>
                    <PlusCircle size={11} /> {isAddingSRS ? 'Adding...' : 'Add to Study Deck'}
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </WordLookupContext.Provider>
  );
}
