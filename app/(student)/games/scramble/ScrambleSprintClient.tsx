// app/(student)/games/scramble/ScrambleSprintClient.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, RotateCcw, HelpCircle, Check, X, Clock, Star, Trophy } from 'lucide-react';
import { playSound } from '@/lib/sounds';

interface ScrambleSentence {
  english: string;
  japanese: string;
}

interface ScrambleSprintClientProps {
  dbTopics: any[];
}

const CURATED_SENTENCES: ScrambleSentence[] = [
  { english: "I want to watch anime tonight", japanese: "今夜はアニメが見たいです。" },
  { english: "She studies English every single day", japanese: "彼女は毎日英語を勉強しています。" },
  { english: "Learning a new language is fun", japanese: "新しい言語を学ぶのは楽しいです。" },
  { english: "He forgot his keys inside the room", japanese: "彼は部屋の中に鍵を忘れました。" },
  { english: "Where is the nearest convenience store", japanese: "一番近いコンビニはどこですか。" },
  { english: "We will go to Tokyo next week", japanese: "私たちは来週東京に行きます。" },
  { english: "This music makes me feel happy", japanese: "この音楽は私を幸せな気持ちにさせます。" },
  { english: "What is your favorite Japanese dish", japanese: "お気に入りの日本料理は何ですか。" },
  { english: "They have been living here for five years", japanese: "彼らはここに5年間住んでいます。" },
  { english: "I will call you when I arrive", japanese: "到着したら電話します。" },
  { english: "She loves reading books in the library", japanese: "彼女は図書館で本を読むのが大好きです。" },
  { english: "Could you please speak a bit slower", japanese: "もう少しゆっくり話していただけますか。" },
  { english: "I am looking forward to our trip", japanese: "私たちの旅行を楽しみにしています。" },
  { english: "He plays guitar extremely well", japanese: "彼はギターを弾くのがとても上手です。" },
  { english: "Do you know how to get there", japanese: "そこへの行き方を知っていますか。" }
];

export default function ScrambleSprintClient({ dbTopics }: ScrambleSprintClientProps) {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [sentences, setSentences] = useState<ScrambleSentence[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledTiles, setShuffledTiles] = useState<string[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [score, setScore] = useState(0); // correct sentences count
  const [xpEarned, setXpEarned] = useState(0);
  
  // Per sentence timers
  const [secondsLeft, setSecondsLeft] = useState(20);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [loading, setLoading] = useState(false);

  const sentenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and select 10 sentences
  const initGame = () => {
    setScore(0);
    setXpEarned(0);
    setCurrentIndex(0);
    setFeedback(null);
    setSelectedTiles([]);

    // Merge database topics if available, else use curated list
    let pool = [...CURATED_SENTENCES];
    if (dbTopics && dbTopics.length > 0) {
      dbTopics.forEach(topic => {
        // Parse sentences out of grammar_explainer if any look simple
        const match = topic.grammar_explainer?.match(/"([^"]+)"/);
        if (match && match[1] && match[1].split(' ').length < 8) {
          pool.push({
            english: match[1].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ""),
            japanese: topic.grammar_topic || 'curriculum sentence'
          });
        }
      });
    }

    // Shuffle and pick 10
    const selected = pool.sort(() => 0.5 - Math.random()).slice(0, 10);
    setSentences(selected);
    setGameState('playing');
    loadSentence(0, selected);
  };

  const loadSentence = (idx: number, poolList: ScrambleSentence[]) => {
    if (idx >= poolList.length) {
      endGame(score, xpEarned);
      return;
    }

    const current = poolList[idx];
    const words = current.english.split(' ').filter(Boolean);
    
    // Add 1 or 2 distractor words
    const distractors = ["always", "yesterday", "tomorrow", "sometimes", "never"];
    const activeDistractors = distractors
      .filter(d => !words.includes(d))
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    const allTiles = [...words, ...activeDistractors].sort(() => 0.5 - Math.random());

    setCurrentIndex(idx);
    setShuffledTiles(allTiles);
    setSelectedTiles([]);
    setFeedback(null);
    setSecondsLeft(20);
  };

  // Sentence countdown timer loop
  useEffect(() => {
    if (gameState !== 'playing' || feedback !== null) {
      if (sentenceTimerRef.current) clearInterval(sentenceTimerRef.current);
      return;
    }

    sentenceTimerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          // Time ran out
          handleWrong();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sentenceTimerRef.current) clearInterval(sentenceTimerRef.current);
    };
  }, [gameState, currentIndex, feedback]);

  // Tile interactions
  const handleTileClick = (word: string) => {
    if (feedback !== null) return;
    playSound('flip');

    // Move to selected
    setSelectedTiles(prev => [...prev, word]);
    // Remove from shuffled tiles list (first occurrence only)
    setShuffledTiles(prev => {
      const idx = prev.indexOf(word);
      if (idx > -1) {
        const copy = [...prev];
        copy.splice(idx, 1);
        return copy;
      }
      return prev;
    });
  };

  const handleSelectedClick = (word: string) => {
    if (feedback !== null) return;
    playSound('flip');

    // Remove from selected
    setSelectedTiles(prev => {
      const idx = prev.indexOf(word);
      if (idx > -1) {
        const copy = [...prev];
        copy.splice(idx, 1);
        return copy;
      }
      return prev;
    });
    // Add back to options
    setShuffledTiles(prev => [...prev, word]);
  };

  const handleReset = () => {
    if (feedback !== null) return;
    const current = sentences[currentIndex];
    const words = current.english.split(' ').filter(Boolean);
    const distractors = ["always", "yesterday", "tomorrow", "sometimes", "never"];
    const activeDistractors = distractors.filter(d => !words.includes(d)).slice(0, 2);

    setShuffledTiles([...words, ...activeDistractors].sort(() => 0.5 - Math.random()));
    setSelectedTiles([]);
  };

  // Check correctness
  const handleCheck = () => {
    const current = sentences[currentIndex];
    const assembled = selectedTiles.join(' ');
    
    if (assembled.toLowerCase() === current.english.toLowerCase()) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  const handleCorrect = () => {
    playSound('correct');
    setFeedback('correct');
    setScore(prev => prev + 1);

    // Calculate XP: 10 base + 15 speed bonus (<10s left means >10s elapsed, so >10s left is <10s elapsed!)
    // Wait, "correct in < 10 seconds" means elapsed time is less than 10s. Since total is 20s, secondsLeft must be > 10s!
    const speedBonus = secondsLeft > 10;
    const gain = 10 + (speedBonus ? 15 : 0);
    setXpEarned(prev => prev + gain);

    setTimeout(() => {
      loadSentence(currentIndex + 1, sentences);
    }, 1500);
  };

  const handleWrong = () => {
    playSound('wrong');
    setFeedback('wrong');

    setTimeout(() => {
      // Auto return tiles on fail
      handleReset();
      setFeedback(null);
    }, 1500);
  };

  const handleSkip = () => {
    loadSentence(currentIndex + 1, sentences);
  };

  // Scoreboard logger
  const endGame = async (finalScore: number, finalXp: number) => {
    setGameState('gameover');
    if (sentenceTimerRef.current) clearInterval(sentenceTimerRef.current);

    setLoading(true);
    try {
      await fetch('/api/save-game-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: 'scramble_sprint',
          score: finalScore,
          xpEarned: finalXp,
          metadata: { sentencesCompleted: 10 }
        })
      });
    } catch (e) {
      console.error('Failed to log scramble score:', e);
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
        {/* Start Screen */}
        {gameState === 'start' && (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center p-8 bg-card border border-border rounded-3xl space-y-6 shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
              <HelpCircle size={32} />
            </div>

            <div className="space-y-2">
              <h1 className="font-display font-black text-3xl text-ink">Scramble Sprint</h1>
              <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto">
                Arrange the scrambled word tiles in correct sequential order to translate the Japanese phrase. Sprint through 10 sentences before time runs out!
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-3 pt-2 text-xs font-semibold text-left text-ink-muted bg-background/50 p-4 border border-border/60 rounded-2xl">
              <p className="flex items-center gap-2">⚡ 10 Sentences per round</p>
              <p className="flex items-center gap-2">⏱ 20 Seconds limit per sentence</p>
              <p className="flex items-center gap-2">🚀 +15 XP Speed Bonus if solved in &lt;10s</p>
            </div>

            <Button
              onClick={initGame}
              className="px-8 py-3 bg-sakura hover:bg-sakura-deep text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 mx-auto cursor-pointer shadow-md hover:shadow-lg border-none"
            >
              <Play size={16} /> Start Sprint
            </Button>
          </motion.div>
        )}

        {/* Game play area */}
        {gameState === 'playing' && sentences[currentIndex] && (
          <motion.div
            key="play-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Status bar */}
            <div className="flex items-center justify-between bg-card border border-border px-5 py-3 rounded-2xl shadow-xs select-none">
              <span className="text-xs font-bold text-ink">Sentence: <span className="font-mono text-sakura-deep">{currentIndex + 1} / 10</span></span>
              
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink-muted bg-background border border-border px-3 py-1 rounded-full">
                <Clock size={13} className={`animate-pulse ${secondsLeft < 5 ? 'text-rose-500 font-extrabold' : 'text-sakura'}`} /> {secondsLeft}s
              </div>
            </div>

            {/* Target Japanese sentence card */}
            <Card className="border border-border bg-card shadow-xs rounded-2xl overflow-hidden">
              <CardContent className="p-6 text-center space-y-2">
                <span className="text-[10px] font-bold text-sakura-deep uppercase tracking-wider block font-sans">Translate this Japanese phrase</span>
                <p className="text-lg md:text-xl font-bold text-ink leading-relaxed">
                  {sentences[currentIndex].japanese}
                </p>
              </CardContent>
            </Card>

            {/* Selected answer slots container */}
            <div 
              className={`min-h-[70px] border-2 border-dashed rounded-2xl p-4 flex flex-wrap gap-2 items-center bg-[#FAF6F1]/30 transition-all ${
                feedback === 'correct' 
                  ? 'border-matcha bg-matcha/5' 
                  : feedback === 'wrong' 
                  ? 'border-rose-500 bg-rose-500/5 animate-shake' 
                  : 'border-border/80'
              }`}
            >
              {selectedTiles.length === 0 && (
                <span className="text-xs italic text-ink-muted/50 w-full text-center">Tap word tiles below to build the sentence...</span>
              )}
              {selectedTiles.map((tile, i) => (
                <motion.button
                  layoutId={`tile-${tile}`}
                  key={`sel-${i}`}
                  onClick={() => handleSelectedClick(tile)}
                  className="px-3.5 py-2 bg-card hover:bg-muted border border-border text-xs font-bold text-ink rounded-xl shadow-xs cursor-pointer select-none"
                >
                  {tile}
                </motion.button>
              ))}
            </div>

            {/* Feedback states banner */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`text-center py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 ${
                    feedback === 'correct' 
                      ? 'bg-matcha/10 text-matcha-deep border border-matcha/20' 
                      : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                  }`}
                >
                  {feedback === 'correct' ? (
                    <>
                      <Check size={14} /> Correct! {secondsLeft > 10 ? '+25 XP (Speed Bonus!)' : '+10 XP'}
                    </>
                  ) : (
                    <>
                      <X size={14} /> Incorrect order. Retrying...
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Word Tiles pool */}
            <div className="flex flex-wrap gap-2.5 justify-center py-4">
              {shuffledTiles.map((tile, i) => (
                <button
                  key={`tile-${i}`}
                  onClick={() => handleTileClick(tile)}
                  className="px-4 py-2.5 bg-card hover:bg-sakura/5 active:scale-95 border border-border/80 hover:border-sakura transition-all text-xs font-bold text-ink rounded-xl shadow-xs cursor-pointer select-none"
                >
                  {tile}
                </button>
              ))}
            </div>

            {/* Buttons control footer */}
            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={feedback !== null}
                className="py-2.5 rounded-xl text-xs font-semibold border-border text-ink cursor-pointer bg-card hover:bg-muted"
              >
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={feedback !== null}
                className="py-2.5 rounded-xl text-xs font-semibold border-border text-ink-muted cursor-pointer hover:bg-muted"
              >
                Skip
              </Button>
              <Button
                onClick={handleCheck}
                disabled={selectedTiles.length === 0 || feedback !== null}
                className="py-2.5 bg-sakura hover:bg-sakura-deep text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm hover:shadow border-none px-6"
              >
                Check Answer
              </Button>
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
              <h1 className="font-display font-black text-3xl text-ink">Scramble Complete!</h1>
              <p className="text-sm text-ink-muted">Excellent grammatical understanding! Your metrics:</p>
            </div>

            <div className="max-w-xs mx-auto grid grid-cols-2 gap-4 bg-background/50 border border-border/60 p-4 rounded-2xl font-bold">
              <div className="text-center">
                <span className="text-[10px] text-ink-muted uppercase block">Solved</span>
                <span className="text-2xl text-ink font-mono">{score} / 10</span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-ink-muted uppercase block">XP Gained</span>
                <span className="text-2xl text-matcha font-mono">+{xpEarned} XP</span>
              </div>
            </div>

            <div className="flex gap-4 max-w-xs mx-auto">
              <Button
                onClick={initGame}
                disabled={loading}
                className="flex-1 py-3 bg-sakura hover:bg-sakura-deep text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg border-none"
              >
                <RotateCcw size={14} /> Sprint Again
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
