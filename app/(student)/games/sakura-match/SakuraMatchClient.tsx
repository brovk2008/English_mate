// app/(student)/games/sakura-match/SakuraMatchClient.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, RotateCcw, Heart, Sparkles, Clock, Star, Trophy } from 'lucide-react';
import { playSound } from '@/lib/sounds';
import dictionary from '@/data/dictionary.json';

interface Word {
  word_index: number;
  word: string;
  meaning: string;
}

interface CardItem {
  id: string; // unique card id
  wordIndex: number;
  type: 'word' | 'translation';
  content: string;
}

interface SakuraMatchClientProps {
  initialWords: Word[];
}

export default function SakuraMatchClient({ initialWords }: SakuraMatchClientProps) {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]); // indexes of currently flipped cards
  const [matched, setMatched] = useState<number[]>([]); // indexes of matched cards
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to extract Japanese translation from dictionary or fallback to English meaning
  const getTranslation = (wordStr: string, fallback: string): string => {
    const cleaned = wordStr.trim().toLowerCase();
    const entry = (dictionary as any)[cleaned];
    return entry?.meaning_ja || fallback;
  };

  // Start / Restart game
  const startGame = () => {
    setMoves(0);
    setSeconds(0);
    setFlipped([]);
    setMatched([]);
    
    // Pick 8 random words from initial list
    const shuffledWords = [...initialWords].sort(() => 0.5 - Math.random()).slice(0, 8);
    
    // Create card pairs
    const deck: CardItem[] = [];
    shuffledWords.forEach((word) => {
      deck.push({
        id: `word-${word.word_index}`,
        wordIndex: word.word_index,
        type: 'word',
        content: word.word
      });
      deck.push({
        id: `trans-${word.word_index}`,
        wordIndex: word.word_index,
        type: 'translation',
        content: getTranslation(word.word, word.meaning)
      });
    });

    // Shuffle the final deck of 16 cards
    setCards(deck.sort(() => 0.5 - Math.random()));
    setGameState('playing');
  };

  // Timer loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Card tap
  const handleCardClick = (idx: number) => {
    if (gameState !== 'playing' || flipped.length >= 2 || flipped.includes(idx) || matched.includes(idx)) {
      return;
    }

    playSound('flip');
    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      
      const card1 = cards[newFlipped[0]];
      const card2 = cards[newFlipped[1]];

      if (card1.wordIndex === card2.wordIndex) {
        // MATCH!
        setTimeout(() => {
          playSound('correct');
          const newMatched = [...matched, newFlipped[0], newFlipped[1]];
          setMatched(newMatched);
          setFlipped([]);

          if (newMatched.length === 16) {
            endGame(newMatched.length);
          }
        }, 500);
      } else {
        // NO MATCH - flip back
        setTimeout(() => {
          setFlipped([]);
        }, 1200);
      }
    }
  };

  // Score calculation and logging
  const endGame = async (matchedCount: number) => {
    setGameState('gameover');
    if (timerRef.current) clearInterval(timerRef.current);

    setLoading(true);
    // Score formula: 1000 - (moves * 10) - (seconds * 2), minimum 100
    const rawScore = 1000 - (moves * 10) - (seconds * 2);
    const score = Math.max(100, rawScore);
    const xpEarned = Math.min(100, Math.floor(score / 10));

    try {
      await fetch('/api/save-game-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'sakura_match',
          score,
          xpEarned,
          metadata: { moves, seconds, correctPairs: matchedCount / 2 }
        })
      });
    } catch (e) {
      console.error('Failed to log match score:', e);
    } finally {
      setLoading(false);
    }
  };

  // Helper format seconds
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      {/* Navigation */}
      <Link 
        href="/games" 
        className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-sakura transition-colors select-none print:hidden"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Playroom
      </Link>

      <AnimatePresence mode="wait">
        {/* Start Screen */}
        {gameState === 'start' && (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center p-8 bg-card border border-border rounded-3xl space-y-6 shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-sakura/10 text-sakura flex items-center justify-center mx-auto">
              <Sparkles size={32} className="animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display font-black text-3xl text-ink">Sakura Match</h1>
              <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto">
                Flip cards to match the English vocabulary word with its correct Japanese translation. Find all 8 pairs in the fewest moves!
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-3 pt-2 text-xs font-semibold text-left text-ink-muted bg-background/50 p-4 border border-border/60 rounded-2xl">
              <p className="flex items-center gap-2">🌸 16 Card Grid (8 pairs)</p>
              <p className="flex items-center gap-2">🔄 Glow effect on correct matches</p>
              <p className="flex items-center gap-2">⭐ XP awarded based on moves & speed</p>
            </div>

            <Button
              onClick={startGame}
              className="px-8 py-3 bg-sakura hover:bg-sakura-deep text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-md hover:shadow-lg border-none"
            >
              <Play size={16} /> Start Match
            </Button>
          </motion.div>
        )}

        {/* Game play arena */}
        {gameState === 'playing' && (
          <motion.div
            key="play-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Status bar */}
            <div className="flex items-center justify-between bg-card border border-border px-5 py-3 rounded-2xl shadow-xs select-none">
              <div className="flex items-center gap-4 text-xs font-bold text-ink">
                <span>Moves: <span className="text-sakura-deep font-mono">{moves}</span></span>
                <span>Pairs matched: <span className="text-matcha font-mono">{matched.length / 2} / 8</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink-muted bg-background border border-border px-3 py-1 rounded-full">
                <Clock size={13} className="text-sakura animate-pulse" /> {formatTime(seconds)}
              </div>
            </div>

            {/* Match Grid */}
            <div className="grid grid-cols-4 gap-3 md:gap-4 select-none">
              {cards.map((card, index) => {
                const isFlipped = flipped.includes(index);
                const isMatched = matched.includes(index);
                
                return (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(index)}
                    className="aspect-square relative cursor-pointer group"
                    style={{ perspective: '1000px' }}
                  >
                    <div
                      className="w-full h-full rounded-2xl transition-all duration-500 shadow-sm relative"
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: (isFlipped || isMatched) ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      }}
                    >
                      {/* Back of Card (unflipped) */}
                      <div
                        className="absolute inset-0 bg-[#FAF1F3] dark:bg-sakura/5 border border-sakura/20 rounded-2xl flex items-center justify-center text-3xl"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        🌸
                      </div>

                      {/* Front of Card (flipped / matched) */}
                      <div
                        className={`absolute inset-0 bg-card border rounded-2xl flex items-center justify-center p-2 text-center text-[10px] md:text-xs font-bold leading-normal overflow-hidden select-none ${
                          isMatched 
                            ? 'border-matcha bg-matcha/5 text-matcha-deep' 
                            : 'border-sakura text-ink'
                        }`}
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                      >
                        <div className="break-words w-full">
                          {card.content}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Game over Screen */}
        {gameState === 'gameover' && (
          <motion.div
            key="gameover-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center p-8 bg-card border border-border rounded-3xl space-y-6 shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-sakura/10 text-sakura flex items-center justify-center mx-auto">
              <Trophy size={32} />
            </div>

            <div className="space-y-1">
              <h1 className="font-display font-black text-3xl text-ink">Sakura Match Complete!</h1>
              <p className="text-sm text-ink-muted">Wonderful memory skills! Your metrics:</p>
            </div>

            <div className="max-w-md mx-auto grid grid-cols-3 gap-2 bg-background/50 border border-border/60 p-4 rounded-2xl font-bold text-center">
              <div>
                <span className="text-[9px] text-ink-muted uppercase block">Time</span>
                <span className="text-base text-ink font-mono">{formatTime(seconds)}</span>
              </div>
              <div>
                <span className="text-[9px] text-ink-muted uppercase block">Moves</span>
                <span className="text-base text-ink font-mono">{moves} flips</span>
              </div>
              <div>
                <span className="text-[9px] text-ink-muted uppercase block">XP Gained</span>
                <span className="text-base text-matcha font-mono">+{Math.min(100, Math.floor((1000 - moves * 10 - seconds * 2) / 10))} XP</span>
              </div>
            </div>

            <div className="flex gap-4 max-w-xs mx-auto">
              <Button
                onClick={startGame}
                disabled={loading}
                className="flex-1 py-3 bg-sakura hover:bg-sakura-deep text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg border-none"
              >
                <RotateCcw size={14} /> Replay
              </Button>
              <Link href="/games" className="flex-1">
                <Button variant="outline" className="w-full py-3 border border-border text-ink hover:bg-muted font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer">
                  Go to Hub
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
