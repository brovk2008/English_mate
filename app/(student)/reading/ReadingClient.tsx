'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, CheckCircle, HelpCircle, GraduationCap, X, Check, ChevronRight } from 'lucide-react';
import ConfettiBurst from '@/components/ConfettiBurst';
import { useI18n } from '@/lib/i18n/context';

interface WordDef {
  translation: string;
  example: string;
}

interface Passage {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  passage: string;
  words_dictionary: Record<string, WordDef>;
  questions: {
    question: string;
    options: string[];
    answer: string;
  }[];
}

interface ReadingProgress {
  passage_id: string;
  score: number;
}

interface ReadingClientProps {
  passages: Passage[];
  initialProgress: ReadingProgress[];
}

export default function ReadingClient({ passages, initialProgress }: ReadingClientProps) {
  const router = useRouter();
  const { lang, t } = useI18n();

  const [selectedPassage, setSelectedPassage] = useState<Passage | null>(null);
  const [localProgress, setLocalProgress] = useState<ReadingProgress[]>(initialProgress);

  // Active word translations popover state
  const [activeWord, setActiveWord] = useState<{ word: string; translation: string; example: string } | null>(null);

  // Quiz gameplay states
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectPassage = (p: Passage) => {
    setSelectedPassage(p);
    setActiveWord(null);
    setAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setTriggerConfetti(false);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-matcha/10 text-matcha border-matcha/25';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Hard':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default:
        return '';
    }
  };

  const handleOptionSelect = (qIdx: number, val: string) => {
    if (quizSubmitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: val }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedPassage || quizSubmitted) return;

    let correctCount = 0;
    selectedPassage.questions.forEach((q, idx) => {
      if (answers[idx] === q.answer) {
        correctCount++;
      }
    });

    setQuizScore(correctCount);
    setQuizSubmitted(true);

    if (correctCount === selectedPassage.questions.length) {
      setTriggerConfetti(true);
    }

    // Save progress
    setIsSaving(true);
    try {
      await fetch('/api/save-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageId: selectedPassage.id,
          score: correctCount
        })
      });

      // Update local state list
      setLocalProgress((prev) => {
        const existing = prev.find((x) => x.passage_id === selectedPassage.id);
        if (existing) {
          return prev.map((x) => (x.passage_id === selectedPassage.id ? { ...x, score: Math.max(x.score, correctCount) } : x));
        }
        return [...prev, { passage_id: selectedPassage.id, score: correctCount }];
      });
    } catch (err) {
      console.error('Failed to save reading scores:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Split reading passage into interactive word spans
  const renderInteractiveText = (p: Passage) => {
    const rawSegments = p.passage.split(/(\s+)/); // Maintain spaces

    return rawSegments.map((seg, idx) => {
      // Check if word
      const cleanWord = seg.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toLowerCase().trim();
      const lookup = p.words_dictionary[cleanWord];

      if (lookup) {
        const isHighlighted = activeWord?.word === cleanWord;
        return (
          <span
            key={idx}
            onClick={() => setActiveWord({ word: cleanWord, translation: lookup.translation, example: lookup.example })}
            className={`cursor-pointer underline decoration-dotted decoration-sakura hover:text-sakura font-semibold transition-colors duration-150 px-0.5 rounded ${
              isHighlighted ? 'bg-sakura/15 text-sakura-deep scale-105' : 'text-ink hover:bg-sakura/5'
            }`}
            title="Tap for definition"
          >
            {seg}
          </span>
        );
      }

      return <span key={idx}>{seg}</span>;
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 select-none">
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
          Graded Reading Room
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Passages Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border border-border bg-card rounded-2xl p-4">
            <h2 className="font-display font-extrabold text-sm text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sakura" /> Passages Library
            </h2>

            <div className="space-y-2">
              {passages.map((p) => {
                const prog = localProgress.find((x) => x.passage_id === p.id);
                const isSelected = selectedPassage?.id === p.id;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPassage(p)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col space-y-1.5 ${
                      isSelected
                        ? 'border-sakura bg-sakura/5 shadow-sm'
                        : 'border-border/60 bg-bg/10 hover:border-border hover:bg-bg/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-sm font-bold truncate ${isSelected ? 'text-sakura-deep' : 'text-ink'}`}>
                        {p.title}
                      </span>
                      {prog && (
                        <span className="text-[10px] text-matcha font-bold shrink-0">
                          {prog.score}/3 ✓
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`text-[9px] px-2 py-0 border ${getDifficultyColor(p.difficulty)}`}>
                        {p.difficulty}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Selected Passage & Interactive Reading Section */}
        <div className="md:col-span-2 space-y-6">
          {!selectedPassage ? (
            <Card className="border border-border/80 bg-card rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-14 h-14 bg-sakura/10 text-sakura rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink mb-1">
                Select a Reading Passage
              </h3>
              <p className="text-xs text-ink-muted max-w-xs leading-relaxed">
                Choose a graded text from the library on the left. Click dotted words to view translations in Japanese instantly.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Passage Details and Interactive Text Content */}
              <Card className="border border-border bg-card rounded-2xl overflow-hidden p-6 space-y-6 shadow-sm relative">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="space-y-1">
                    <h2 className="font-display font-extrabold text-xl text-ink">
                      {selectedPassage.title}
                    </h2>
                    <Badge variant="outline" className={`text-[9px] px-2 py-0 border ${getDifficultyColor(selectedPassage.difficulty)}`}>
                      {selectedPassage.difficulty}
                    </Badge>
                  </div>
                </div>

                {/* Main reading content block */}
                <div className="font-serif text-sm sm:text-base leading-relaxed text-ink space-y-4 bg-bg/5 p-4 rounded-xl border border-border/40 select-text">
                  {renderInteractiveText(selectedPassage)}
                </div>

                {/* Inline word definition popover card */}
                <AnimatePresence>
                  {activeWord && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="bg-[#FAF1F3] border border-sakura/20 rounded-xl p-4 space-y-2 relative animate-fade-in"
                    >
                      <button
                        onClick={() => setActiveWord(null)}
                        className="absolute top-2 right-2 text-ink-muted/60 p-1 hover:text-sakura transition-colors cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-sakura-deep uppercase tracking-wider block">Vocabulary Translation</span>
                        <div className="flex items-baseline gap-2">
                          <span className="font-display font-bold text-sm text-ink">{activeWord.word}</span>
                          <span className="text-xs text-ink font-semibold">→ {activeWord.translation}</span>
                        </div>
                      </div>
                      <div className="text-[11px] text-ink-muted italic leading-relaxed">
                        Example: "{activeWord.example}"
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Comprehension Quiz section */}
              <Card className="border border-border bg-card rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="space-y-1 pb-3 border-b border-border/40">
                  <h3 className="font-display text-base font-bold text-ink flex items-center gap-1.5">
                    <HelpCircle className="w-5 h-5 text-sakura" />
                    Comprehension Questions
                  </h3>
                  <p className="text-[10px] text-ink-muted">
                    Test your understanding of the text above. Select the correct options.
                  </p>
                </div>

                <div className="space-y-6">
                  {selectedPassage.questions.map((q, idx) => (
                    <div key={idx} className="space-y-3">
                      <p className="text-xs font-bold text-ink-muted">
                        Q{idx + 1}: {q.question}
                      </p>
                      <div className="grid grid-cols-1 gap-2.5">
                        {q.options.map((opt) => {
                          let optStyle = 'border-border bg-bg/25 text-ink hover:border-sakura hover:bg-sakura/5';
                          let isCorrectTick = null;

                          if (answers[idx] === opt) {
                            optStyle = 'border-sakura bg-sakura/10 text-sakura-deep font-semibold';
                          }

                          if (quizSubmitted) {
                            if (opt === q.answer) {
                              optStyle = 'border-matcha bg-matcha/10 text-matcha font-bold';
                              isCorrectTick = <Check className="w-4 h-4 text-matcha shrink-0" />;
                            } else if (answers[idx] === opt) {
                              optStyle = 'border-red-400 bg-red-50 text-red-500';
                            } else {
                              optStyle = 'border-border bg-bg/10 text-ink-muted/50 opacity-60';
                            }
                          }

                          return (
                            <button
                              key={opt}
                              disabled={quizSubmitted}
                              onClick={() => handleOptionSelect(idx, opt)}
                              className={`w-full flex items-center justify-between text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${optStyle}`}
                            >
                              <span>{opt}</span>
                              {isCorrectTick}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submissions button */}
                <div className="pt-2 flex justify-end">
                  {!quizSubmitted ? (
                    <Button
                      disabled={Object.keys(answers).length < selectedPassage.questions.length || isSaving}
                      onClick={handleSubmitQuiz}
                      className="bg-[#E8A6B8] hover:bg-[#E293A7] text-white rounded-xl font-bold px-6 py-2.5 cursor-pointer shadow-sm disabled:bg-bg disabled:text-ink-muted/40"
                    >
                      Submit Answers
                    </Button>
                  ) : (
                    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 bg-bg/40 border border-border/80 rounded-xl p-4 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-sakura" />
                        <span className="text-xs font-bold text-ink">
                          Score: {quizScore} / {selectedPassage.questions.length}
                        </span>
                      </div>
                      <Button
                        onClick={() => setSelectedPassage(null)}
                        className="bg-matcha hover:bg-matcha-deep text-white rounded-xl font-bold px-5 py-2 flex items-center gap-1 cursor-pointer"
                      >
                        Back to Library <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
