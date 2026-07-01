'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, Layers, BookOpen, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import ConfettiBurst from '@/components/ConfettiBurst';
import { useI18n } from '@/lib/i18n/context';

interface Challenge {
  day: number;
  sentence: string;
  arrange_words: string[];
  fill_gap: string;
  fill_options: string[];
  translation: string;
}

interface SentenceBuilderClientProps {
  challenge: Challenge;
  dayNumber: number;
}

export default function SentenceBuilderClient({ challenge, dayNumber }: SentenceBuilderClientProps) {
  const router = useRouter();
  const { lang, t } = useI18n();

  // Mode Selection: 'arrange' or 'fill'
  const [mode, setMode] = useState<'arrange' | 'fill'>('arrange');

  // Game states for ARRANGE MODE
  const [shuffledPool, setShuffledPool] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [arrangeStatus, setArrangeStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [arrangeAttempts, setArrangeAttempts] = useState(1);

  // Game states for FILL MODE
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [fillStatus, setFillStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [fillAttempts, setFillAttempts] = useState(1);

  // Confetti trigger
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize pool for Arrange Mode
  useEffect(() => {
    // Shuffle the challenge words
    const shuffled = [...challenge.arrange_words].sort(() => Math.random() - 0.5);
    setShuffledPool(shuffled);
    setSelectedWords([]);
    setArrangeStatus('idle');
    setArrangeAttempts(1);
    
    // Reset Fill Mode states too
    setSelectedOption(null);
    setFillStatus('idle');
    setFillAttempts(1);
    setTriggerConfetti(false);
  }, [challenge, mode]);

  // Handle tile interactions
  const handleTapPoolWord = (word: string, index: number) => {
    if (arrangeStatus === 'correct') return;
    
    // Add to selected words
    setSelectedWords((prev) => [...prev, word]);
    
    // Remove from pool (using index to support duplicate words)
    setShuffledPool((prev) => prev.filter((_, i) => i !== index));
    if (arrangeStatus === 'incorrect') {
      setArrangeStatus('idle');
    }
  };

  const handleTapSelectedWord = (word: string, index: number) => {
    if (arrangeStatus === 'correct') return;

    // Return word to pool
    setShuffledPool((prev) => [...prev, word]);
    
    // Remove from selected list
    setSelectedWords((prev) => prev.filter((_, i) => i !== index));
    if (arrangeStatus === 'incorrect') {
      setArrangeStatus('idle');
    }
  };

  const handleResetArrange = () => {
    const shuffled = [...challenge.arrange_words].sort(() => Math.random() - 0.5);
    setShuffledPool(shuffled);
    setSelectedWords([]);
    setArrangeStatus('idle');
  };

  const handleCheckArrange = async () => {
    const joinedSentence = selectedWords.join(' ');
    // Handle punctuation matches cleanly
    const cleanProposed = joinedSentence.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase().trim();
    const cleanTarget = challenge.sentence.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase().trim();

    if (cleanProposed === cleanTarget) {
      setArrangeStatus('correct');
      setTriggerConfetti(true);
      
      // Save result to db
      setIsSaving(true);
      try {
        await fetch('/api/save-sentence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayNumber,
            mode: 'arrange',
            correct: true,
            attempts: arrangeAttempts
          })
        });
      } catch (err) {
        console.error('Failed to save sentence builder results:', err);
      } finally {
        setIsSaving(false);
      }
    } else {
      setArrangeStatus('incorrect');
      setArrangeAttempts((prev) => prev + 1);
    }
  };

  const handleCheckFill = async () => {
    if (!selectedOption) return;

    if (selectedOption === challenge.fill_gap) {
      setFillStatus('correct');
      setTriggerConfetti(true);

      // Save result to db
      setIsSaving(true);
      try {
        await fetch('/api/save-sentence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dayNumber,
            mode: 'fill',
            correct: true,
            attempts: fillAttempts
          })
        });
      } catch (err) {
        console.error('Failed to save sentence builder results:', err);
      } finally {
        setIsSaving(false);
      }
    } else {
      setFillStatus('incorrect');
      setFillAttempts((prev) => prev + 1);
    }
  };

  // Generate Fill visual sentence with underscore blank
  const getFillSentence = () => {
    const parts = challenge.sentence.split(new RegExp(`\\b${challenge.fill_gap}\\b`, 'gi'));
    if (parts.length > 1) {
      return (
        <span className="font-display text-lg sm:text-xl font-bold text-ink leading-relaxed">
          {parts[0]}
          <span className="inline-block border-b-2 border-sakura min-w-[70px] px-2 text-center text-sakura-deep select-none">
            {selectedOption || '_____'}
          </span>
          {parts[1]}
        </span>
      );
    }
    return challenge.sentence;
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      {triggerConfetti && <ConfettiBurst />}

      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/home')}
          className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-sakura transition-colors cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" /> {t('common.back')}
        </button>
        <span className="text-xs font-bold text-ink-muted font-mono select-none">
          Day {dayNumber} Grammar Challenge
        </span>
      </div>

      {/* Mode switcher tabs */}
      <div className="flex bg-bg/50 border border-border p-1 rounded-xl select-none">
        <button
          onClick={() => setMode('arrange')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            mode === 'arrange' ? 'bg-card text-sakura shadow-sm border border-sakura/15' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Scrambled Tiles
        </button>
        <button
          onClick={() => setMode('fill')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            mode === 'fill' ? 'bg-card text-sakura shadow-sm border border-sakura/15' : 'text-ink-muted hover:text-ink'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" /> Fill the Gap
        </button>
      </div>

      <Card className="border border-border bg-card/90 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-sakura-deep uppercase tracking-wider block">
            {mode === 'arrange' ? 'Arrange Scrambled Tiles' : 'Fill In The Connector Word'}
          </span>
          <div className="text-xs text-ink-muted leading-relaxed">
            Construct the English sentence matching the Japanese translation below.
          </div>
        </div>

        {/* Translation Cue */}
        <div className="bg-[#FAF6F1]/55 border border-border/80 rounded-xl p-4 space-y-1">
          <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider block">
            Japanese Translation / 和訳
          </span>
          <p className="text-sm font-semibold text-ink leading-relaxed">
            {challenge.translation}
          </p>
        </div>

        {/* ARRANGE MODE GAMEPLAY SURFACE */}
        {mode === 'arrange' && (
          <div className="space-y-6">
            {/* Selected Words Slots area */}
            <div className="min-h-[90px] border border-dashed border-border/80 rounded-xl p-3 flex flex-wrap gap-2 items-start bg-bg/10">
              {selectedWords.length === 0 ? (
                <span className="text-xs text-ink-muted/50 italic select-none p-1">
                  Tap word tiles below to construct the sentence...
                </span>
              ) : (
                selectedWords.map((word, idx) => (
                  <motion.button
                    key={idx}
                    layoutId={`selected-${idx}`}
                    onClick={() => handleTapSelectedWord(word, idx)}
                    className="py-1.5 px-3 bg-sakura/10 border border-sakura/20 text-sakura rounded-lg text-sm font-medium hover:bg-sakura/25 cursor-pointer"
                  >
                    {word}
                  </motion.button>
                ))
              )}
            </div>

            {/* Shuffled pool of tiles */}
            <div className="space-y-2.5">
              <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider block">
                Word Pool
              </span>
              <div className="flex flex-wrap gap-2">
                {shuffledPool.map((word, idx) => (
                  <motion.button
                    key={idx}
                    layoutId={`pool-${idx}`}
                    onClick={() => handleTapPoolWord(word, idx)}
                    className="py-1.5 px-3 bg-card border border-border text-ink rounded-lg text-sm font-medium hover:border-sakura hover:bg-sakura/5 active:scale-95 transition-all cursor-pointer"
                  >
                    {word}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleResetArrange}
                disabled={selectedWords.length === 0 || arrangeStatus === 'correct'}
                className="border-border text-ink-muted hover:bg-bg rounded-xl font-bold px-4 cursor-pointer"
              >
                Reset
              </Button>
              <Button
                onClick={handleCheckArrange}
                disabled={selectedWords.length === 0 || arrangeStatus === 'correct'}
                className="flex-1 bg-[#E8A6B8] hover:bg-[#E293A7] text-white rounded-xl font-bold cursor-pointer"
              >
                Check Sentence
              </Button>
            </div>

            {/* Correctness Feedbacks */}
            {arrangeStatus === 'correct' && (
              <div className="bg-matcha/10 border border-matcha/30 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-matcha shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-matcha">Well Done!</p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    You built the correct sentence: "{challenge.sentence}"
                  </p>
                </div>
              </div>
            )}

            {arrangeStatus === 'incorrect' && (
              <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-red-500">Not quite correct yet.</p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Check your word order or ending punctuation and try again! (Attempt {arrangeAttempts})
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FILL MODE GAMEPLAY SURFACE */}
        {mode === 'fill' && (
          <div className="space-y-6">
            {/* Visual sentence display */}
            <div className="p-5 border border-border/70 rounded-xl bg-bg/15 text-center leading-relaxed">
              {getFillSentence()}
            </div>

            {/* Options grid */}
            <div className="space-y-2.5">
              <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider block">
                Choose the correct option:
              </span>
              <div className="grid grid-cols-2 gap-3">
                {challenge.fill_options.map((opt) => {
                  let btnStyle = 'border-border bg-bg/25 text-ink hover:border-sakura hover:bg-sakura/5';
                  if (selectedOption === opt) {
                    btnStyle = 'border-sakura bg-sakura/10 text-sakura font-semibold';
                  }
                  if (fillStatus === 'correct') {
                    if (opt === challenge.fill_gap) {
                      btnStyle = 'border-matcha bg-matcha/10 text-matcha font-bold';
                    } else {
                      btnStyle = 'border-border bg-bg/10 text-ink-muted/50 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={opt}
                      disabled={fillStatus === 'correct'}
                      onClick={() => setSelectedOption(opt)}
                      className={`w-full text-left p-4 rounded-xl border text-sm transition-all cursor-pointer ${btnStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2">
              <Button
                disabled={!selectedOption || fillStatus === 'correct'}
                onClick={handleCheckFill}
                className="w-full bg-[#E8A6B8] hover:bg-[#E293A7] disabled:bg-bg disabled:text-ink-muted/40 text-white rounded-xl font-bold cursor-pointer"
              >
                Submit Answer
              </Button>
            </div>

            {/* Correctness Feedbacks */}
            {fillStatus === 'correct' && (
              <div className="bg-matcha/10 border border-matcha/30 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-matcha shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-matcha">Correct!</p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    "{challenge.sentence}" is correct.
                  </p>
                </div>
              </div>
            )}

            {fillStatus === 'incorrect' && (
              <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-red-500">Incorrect Choice</p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    That word doesn't fit the grammar structure. Select another option and check again! (Attempt {fillAttempts})
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Finished / Return panel */}
        {(arrangeStatus === 'correct' || fillStatus === 'correct') && (
          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              onClick={() => router.push('/home')}
              className="bg-matcha hover:bg-matcha-deep text-white rounded-xl font-bold px-6 py-2.5 cursor-pointer flex items-center gap-1.5 shadow-sm animate-fade-in"
            >
              Finish Challenge
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
