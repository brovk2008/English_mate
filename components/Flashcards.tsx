'use client';

import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import { Check, X, RotateCw, Sparkles, BookOpen } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface Word {
  id?: number;
  word_index: number;
  word: string;
  pronunciation: string | null;
  meaning: string;
  meaning_ja?: string | null;
  example_sentence: string;
}

interface FlashcardsProps {
  words: Word[];
  learnedIndices: number[];
  onWordMastered: (wordIndex: number, mastered: boolean) => void;
  onAllCompleted: () => void;
}

export default function Flashcards({ words, learnedIndices, onWordMastered, onAllCompleted }: FlashcardsProps) {
  const { lang, t } = useI18n();
  // We keep a local queue of words to study
  // Words swiped left (again) are moved to the end of the queue
  const [deck, setDeck] = useState<Word[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  
  const controls = useAnimation();
  const x = useMotionValue(0);
  
  // Transform values for rotation/opacity as card is dragged
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
  const yesOpacity = useTransform(x, [0, 150], [0, 1]);
  const noOpacity = useTransform(x, [-150, 0], [1, 0]);

  useEffect(() => {
    // Reset and initialize deck
    // Filter words so she studies all 10 words for today
    setDeck(words);
    setActiveIdx(0);
    setIsFlipped(false);
    
    // Count how many are already mastered in database
    const initialMastered = words.filter(w => learnedIndices.includes(w.word_index)).length;
    setMasteredCount(initialMastered);
  }, [words, learnedIndices]);

  const currentWord = deck[activeIdx];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentWord) return;

    if (direction === 'right') {
      // Swiped Right = Mastered!
      onWordMastered(currentWord.word_index, true);
      setMasteredCount(prev => Math.min(words.length, prev + 1));
      
      // Move to next card
      setActiveIdx(prev => prev + 1);
      setIsFlipped(false);
    } else {
      // Swiped Left = Needs practice!
      onWordMastered(currentWord.word_index, false);
      
      // Spaced Repetition Light: push to end of active study queue
      const updatedDeck = [...deck];
      updatedDeck.push(currentWord);
      
      setDeck(updatedDeck);
      setActiveIdx(prev => prev + 1);
      setIsFlipped(false);
    }

    // Check if we finished studying everything
    // Note: since we push cards to back, activeIdx might increase past words.length,
    // but the session ends when the count of mastered words hits words.length!
    const updatedMasteredCount = direction === 'right' 
      ? masteredCount + 1 
      : masteredCount;

    if (updatedMasteredCount >= words.length) {
      onAllCompleted();
    }
  };

  const handleDragEnd = async (event: any, info: any) => {
    const threshold = 140;
    if (info.offset.x > threshold) {
      // Fly off to right
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.2 } });
      handleSwipe('right');
      x.set(0);
      controls.set({ x: 0, opacity: 1 });
    } else if (info.offset.x < -threshold) {
      // Fly off to left
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } });
      handleSwipe('left');
      x.set(0);
      controls.set({ x: 0, opacity: 1 });
    } else {
      // Snap back to center
      controls.start({ x: 0, opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  if (activeIdx >= deck.length || masteredCount >= words.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-matcha/5 border border-matcha/20 rounded-2xl text-center space-y-4">
        <div className="w-14 h-14 bg-matcha/10 rounded-full flex items-center justify-center text-matcha">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="font-display font-bold text-xl text-ink">
          Vocabulary Mastered!
        </h3>
        <p className="text-sm text-ink-muted max-w-[280px]">
          You have mastered all {words.length} vocabulary words for today. Great job!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center py-4">
      {/* Top progress indicator */}
      <div className="w-full max-w-sm flex items-center justify-between mb-4 text-xs font-semibold text-ink-muted uppercase">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3.5 h-3.5" /> Study Deck
        </span>
        <span>{masteredCount} / {words.length} Mastered</span>
      </div>

      {/* Card area container with perspective */}
      <div className="relative w-full max-w-sm h-72 cursor-grab active:cursor-grabbing select-none" style={{ perspective: 1000 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord.word_index + '_' + activeIdx}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            animate={controls}
            style={{ x, rotate, opacity, transformStyle: 'preserve-3d' }}
            className="w-full h-full relative"
          >
            {/* Gesture indicators overlay */}
            <motion.div style={{ opacity: yesOpacity }} className="absolute inset-0 bg-matcha/10 border-2 border-matcha rounded-2xl flex items-center justify-center z-20 pointer-events-none">
              <span className="bg-matcha text-white font-bold text-sm px-4 py-1.5 rounded-full shadow flex items-center gap-1.5">
                <Check size={16} /> Got it!
              </span>
            </motion.div>

            <motion.div style={{ opacity: noOpacity }} className="absolute inset-0 bg-sakura/10 border-2 border-sakura rounded-2xl flex items-center justify-center z-20 pointer-events-none">
              <span className="bg-sakura text-white font-bold text-sm px-4 py-1.5 rounded-full shadow flex items-center gap-1.5">
                <X size={16} /> Again
              </span>
            </motion.div>

            {/* FLIPPABLE CARD BODY */}
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{ transformStyle: 'preserve-3d' }}
              className="w-full h-full relative shadow-md rounded-2xl border border-border"
            >
              {/* CARD FRONT */}
              <div
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                className="absolute inset-0 bg-card rounded-2xl p-6 flex flex-col justify-between"
              >
                <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                  Front · Tap to Reveal
                </div>
                <div className="flex flex-col items-center justify-center flex-1">
                  <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-ink text-center">
                    {currentWord.word}
                  </h2>
                  {currentWord.pronunciation && (
                    <span className="text-xs text-ink-muted font-mono mt-1">
                      /{currentWord.pronunciation}/
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                  className="flex items-center justify-center gap-1 mx-auto py-1.5 px-3 bg-bg hover:bg-sakura/10 text-ink-muted hover:text-sakura rounded-lg text-xs font-semibold border border-border/70 transition-colors cursor-pointer"
                >
                  <RotateCw size={12} /> Flip Card
                </button>
              </div>

              {/* CARD BACK */}
              <div
                style={{
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden'
                }}
                className="absolute inset-0 bg-card rounded-2xl p-6 flex flex-col justify-between border-2 border-sakura/20"
              >
                <div className="text-[10px] font-bold text-sakura-deep uppercase tracking-wider">
                  {t('vocab.tap_to_flip')}
                </div>
                <div className="flex flex-col justify-center flex-1 text-left space-y-3 mt-2 overflow-y-auto">
                  <div>
                    <span className="text-[10px] text-ink-muted font-bold block uppercase tracking-wider">{t('vocab.meaning')}</span>
                    <p className="text-sm font-semibold text-ink leading-relaxed">
                      {lang === 'ja' && currentWord.meaning_ja ? currentWord.meaning_ja : currentWord.meaning}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-ink-muted font-bold block uppercase tracking-wider">{t('vocab.example')}</span>
                    <p className="text-xs text-ink-muted italic leading-relaxed">
                      "{currentWord.example_sentence}"
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                  className="flex items-center justify-center gap-1 mx-auto py-1.5 px-3 bg-bg hover:bg-sakura/10 text-ink-muted hover:text-sakura rounded-lg text-xs font-semibold border border-border/70 transition-colors cursor-pointer"
                >
                  <RotateCw size={12} /> {t('vocab.tap_to_flip')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe action buttons below card */}
      <div className="flex items-center gap-6 mt-6">
        <button
          onClick={() => handleSwipe('left')}
          className="w-12 h-12 rounded-full border border-sakura/30 bg-sakura/5 hover:bg-sakura hover:text-white text-sakura transition-all shadow-sm flex items-center justify-center cursor-pointer active:scale-95"
          title="Review Again"
        >
          <X className="w-5 h-5" />
        </button>

        <button
          onClick={() => handleSwipe('right')}
          className="w-12 h-12 rounded-full border border-matcha/30 bg-matcha/5 hover:bg-matcha hover:text-white text-matcha transition-all shadow-sm flex items-center justify-center cursor-pointer active:scale-95"
          title="Got it!"
        >
          <Check className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
