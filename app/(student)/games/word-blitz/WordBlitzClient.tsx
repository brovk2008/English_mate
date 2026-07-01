// app/(student)/games/word-blitz/WordBlitzClient.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, RotateCcw, Heart, Zap, Clock, Star, Trophy } from 'lucide-react';
import { playSound } from '@/lib/sounds';
import dictionary from '@/data/dictionary.json';

interface Word {
  word_index: number;
  word: string;
  meaning: string;
}

interface WordBlitzClientProps {
  initialWords: Word[];
}

export default function WordBlitzClient({ initialWords }: WordBlitzClientProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [yProgress, setYProgress] = useState(0); // 0 to 100
  const [options, setOptions] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Game loop configs
  const speedRef = useRef(1.2); // y increment percentage per tick
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to extract Japanese translation from dictionary or fallback to English meaning
  const getTranslation = (wordStr: string, fallback: string): string => {
    const cleaned = wordStr.trim().toLowerCase();
    const entry = (dictionary as any)[cleaned];
    return entry?.meaning_ja || fallback;
  };

  // Start/Restart Game
  const startGame = () => {
    setScore(0);
    setLives(3);
    setTimeLeft(60);
    setYProgress(0);
    speedRef.current = 1.2;
    setGameState('playing');
    selectNextWord(0);
  };

  // Set current word and pick 3 random distractors
  const selectNextWord = (nextIdx: number) => {
    const nextWord = initialWords[nextIdx % initialWords.length];
    const correctTranslation = getTranslation(nextWord.word, nextWord.meaning);

    // Collect translations of other words
    const distractors = initialWords
      .filter(w => w.word !== nextWord.word)
      .map(w => getTranslation(w.word, w.meaning));

    // Shuffle distractors and pick 3
    const selectedDistractors = distractors
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    // Shuffle correct option + 3 distractors
    const allOptions = [correctTranslation, ...selectedDistractors].sort(() => 0.5 - Math.random());
    
    setCurrentWordIndex(nextIdx);
    setOptions(allOptions);
    setYProgress(0);
  };

  // Core Game Speed Engine Loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setYProgress(prev => {
        if (prev >= 100) {
          // Reached the bottom - miss!
          handleMiss();
          return 0;
        }
        return prev + speedRef.current;
      });
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState, currentWordIndex]);

  // Countdown timer loop
  useEffect(() => {
    if (gameState !== 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // Handle incorrect select or miss
  const handleMiss = () => {
    playSound('wrong');
    setShake(true);
    setTimeout(() => setShake(false), 400);

    setLives(prev => {
      const nextLives = prev - 1;
      if (nextLives <= 0) {
        endGame();
        return 0;
      }
      // Continue game with next word
      selectNextWord(currentWordIndex + 1);
      return nextLives;
    });
  };

  // Answer verification click
  const handleOptionSelect = (selectedOpt: string) => {
    if (gameState !== 'playing') return;

    const currentWordObj = initialWords[currentWordIndex % initialWords.length];
    const correctTranslation = getTranslation(currentWordObj.word, currentWordObj.meaning);

    if (selectedOpt === correctTranslation) {
      playSound('correct');
      const nextScore = score + 1;
      setScore(nextScore);

      // Increase speed slightly every 5 correct answers
      if (nextScore % 5 === 0) {
        speedRef.current = Math.min(3.5, speedRef.current + 0.3);
      }

      selectNextWord(currentWordIndex + 1);
    } else {
      handleMiss();
    }
  };

  // Save score and finish
  const endGame = async () => {
    setGameState('gameover');
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setLoading(true);
    // Award 10 XP per correct match up to a ceiling of 100 XP
    const xpEarned = Math.min(100, score * 10);

    try {
      await fetch('/api/save-game-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'word_blitz',
          score,
          xpEarned,
          metadata: { speed: speedRef.current, timeLeft }
        })
      });
    } catch (e) {
      console.error('Failed to log game score:', e);
    } finally {
      setLoading(false);
    }
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
        {/* Start screen */}
        {gameState === 'start' && (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center p-8 bg-card border border-border rounded-3xl space-y-6 shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <Zap size={32} className="animate-bounce" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display font-black text-3xl text-ink">Word Blitz</h1>
              <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto">
                Select the correct Japanese translation of the falling English word before it strikes the bottom. Speed increases every 5 correct answers!
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-3 pt-2 text-xs font-semibold text-left text-ink-muted bg-background/50 p-4 border border-border/60 rounded-2xl">
              <p className="flex items-center gap-2">⏱ 60 Seconds Match Time</p>
              <p className="flex items-center gap-2">❤️ 3 Mistake Lives</p>
              <p className="flex items-center gap-2">⭐ +10 XP Awarded Per Correct Word</p>
            </div>

            <Button
              onClick={startGame}
              className="px-8 py-3 bg-sakura hover:bg-sakura-deep text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-md hover:shadow-lg border-none"
            >
              <Play size={16} /> Start Blitz
            </Button>
          </motion.div>
        )}

        {/* Game play area */}
        {gameState === 'playing' && (
          <motion.div
            key="play-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`w-full bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col ${shake ? 'animate-shake' : ''}`}
            style={{ minHeight: '480px' }}
          >
            {/* Status Header */}
            <div className="border-b border-border/40 p-4 flex items-center justify-between bg-muted/30 select-none">
              <div className="flex items-center gap-4 text-xs font-bold text-ink">
                <span className="flex items-center gap-1"><Star size={14} className="text-amber-500 animate-spin" style={{ animationDuration: '6s' }} /> Score: {score}</span>
                <span className="flex items-center gap-1 text-rose-500">
                  <Heart size={14} fill="currentColor" /> 
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} className={`text-sm ${i >= lives ? 'opacity-30' : ''}`}>🌸</span>
                  ))}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-ink-muted bg-background border border-border px-3 py-1 rounded-full">
                <Clock size={13} className="text-sakura animate-pulse" /> {timeLeft}s
              </div>
            </div>

            {/* Falling game board viewport */}
            <div className="flex-1 relative bg-background/30 overflow-hidden" style={{ minHeight: '260px' }}>
              {/* Target falling word */}
              <motion.div
                key={currentWordIndex}
                className="absolute left-1/2 -translate-x-1/2 p-3 bg-card border-2 border-sakura/30 text-sakura-deep font-bold rounded-2xl shadow-sm text-center min-w-[120px]"
                style={{ top: `${yProgress}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="text-lg md:text-xl font-black">{initialWords[currentWordIndex % initialWords.length]?.word}</span>
              </motion.div>
            </div>

            {/* Options selection grid */}
            <div className="p-6 border-t border-border/40 bg-muted/10 grid grid-cols-2 gap-4">
              {options.map((opt, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(opt)}
                  className="p-4 bg-card border border-border/80 hover:border-sakura hover:bg-sakura/5 active:scale-95 transition-all text-sm font-bold text-ink rounded-2xl shadow-xs text-center cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Game over screen */}
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
              <h1 className="font-display font-black text-3xl text-ink">Game Over!</h1>
              <p className="text-sm text-ink-muted">Nice try! Let's check your results:</p>
            </div>

            <div className="max-w-xs mx-auto grid grid-cols-2 gap-4 bg-background/50 border border-border/60 p-4 rounded-2xl font-bold">
              <div className="text-center">
                <span className="text-[10px] text-ink-muted uppercase block">Score</span>
                <span className="text-2xl text-ink font-mono">{score} words</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-ink-muted uppercase block">XP Gained</span>
                <span className="text-2xl text-matcha font-mono">+{Math.min(100, score * 10)} XP</span>
              </div>
            </div>

            <div className="flex gap-4 max-w-xs mx-auto">
              <Button
                onClick={startGame}
                disabled={loading}
                className="flex-1 py-3 bg-sakura hover:bg-sakura-deep text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg border-none"
              >
                <RotateCcw size={14} /> Play Again
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
