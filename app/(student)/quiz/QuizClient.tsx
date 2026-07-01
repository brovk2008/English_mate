'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ChevronRight, Award, HelpCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import ConfettiBurst from '@/components/ConfettiBurst';
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

interface Question {
  type: 'A' | 'B' | 'C';
  wordIndex: number;
  word: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizClientProps {
  unlockedWords: Word[];
  dayNumber: number;
}

export default function QuizClient({ unlockedWords, dayNumber }: QuizClientProps) {
  const router = useRouter();
  const { lang, t } = useI18n();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [answers, setAnswers] = useState<{ wordIndex: number; correct: boolean; word: string }[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [perfectScore, setPerfectScore] = useState(false);

  // Helper to shuffle arrays
  const shuffleArray = <T,>(arr: T[]): T[] => {
    return [...arr].sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    // Generate 10 random questions
    const pool = [...unlockedWords];
    const quizSize = Math.min(10, pool.length);
    
    // Shuffle and pick 10 words
    const chosenWords = shuffleArray(pool).slice(0, quizSize);

    const generatedQuestions: Question[] = chosenWords.map((wordObj) => {
      // Pick random question type A, B, or C
      const types: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
      const type = types[Math.floor(Math.random() * types.length)];

      let questionText = '';
      let correctAnswer = '';
      let options: string[] = [];
      let explanation = `"${wordObj.word}" means "${wordObj.meaning}". Example: ${wordObj.example_sentence}`;

      // Pick 3 random distractors from the rest of the pool
      const distractorsPool = pool.filter((w) => w.word_index !== wordObj.word_index);
      const randomDistractors = shuffleArray(distractorsPool).slice(0, 3);

      if (type === 'A') {
        // Type A: "What does [word] mean?"
        questionText = `What is the meaning of the word "${wordObj.word}"?`;
        correctAnswer = wordObj.meaning;
        options = [correctAnswer, ...randomDistractors.map((d) => d.meaning)];
      } else if (type === 'B') {
        // Type B: "Which word matches this meaning?"
        questionText = `Which word matches the definition: "${wordObj.meaning}"?`;
        correctAnswer = wordObj.word;
        options = [correctAnswer, ...randomDistractors.map((d) => d.word)];
      } else {
        // Type C: "Complete the sentence..."
        const placeholderSentence = wordObj.example_sentence.replace(
          new RegExp(`\\b${wordObj.word}\\b`, 'gi'),
          '_______'
        );
        questionText = `Complete the sentence: "${placeholderSentence}"`;
        correctAnswer = wordObj.word;
        options = [correctAnswer, ...randomDistractors.map((d) => d.word)];
      }

      // Ensure we have exactly 4 choices (or fewer if we have very small pool)
      options = Array.from(new Set(options));
      while (options.length < 4 && distractorsPool.length > options.length) {
        const extra = shuffleArray(distractorsPool).find(d => !options.includes(d.word) && !options.includes(d.meaning));
        if (extra) {
          options.push(type === 'A' ? extra.meaning : extra.word);
        } else {
          break;
        }
      }

      return {
        type,
        wordIndex: wordObj.word_index,
        word: wordObj.word,
        questionText,
        options: shuffleArray(options),
        correctAnswer,
        explanation
      };
    });

    setQuestions(generatedQuestions);
  }, [unlockedWords]);

  const handleSelectOption = (option: string) => {
    if (isSubmitted) return;
    setSelectedOpt(option);
  };

  const handleCheckAnswer = () => {
    if (!selectedOpt || isSubmitted) return;
    setIsSubmitted(true);

    const currentQuestion = questions[currentIdx];
    const isCorrect = selectedOpt === currentQuestion.correctAnswer;

    setAnswers((prev) => [
      ...prev,
      {
        wordIndex: currentQuestion.wordIndex,
        word: currentQuestion.word,
        correct: isCorrect
      }
    ]);
  };

  const handleNextQuestion = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOpt(null);
      setIsSubmitted(false);
    } else {
      // Save results
      setIsSaving(true);
      const score = answers.filter((a) => a.correct).length;
      const total = questions.length;
      const wrongWords = answers.filter((a) => !a.correct).map((a) => a.wordIndex);

      if (score === total) {
        setPerfectScore(true);
      }

      try {
        await fetch('/api/save-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score,
            total,
            wrongWords,
            dayNumber
          })
        });
      } catch (err) {
        console.error('Failed to save quiz results:', err);
      } finally {
        setIsSaving(false);
        setIsFinished(true);
      }
    }
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-sakura animate-spin" />
        <p className="text-sm text-ink-muted">Generating your quiz...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const progressPercent = ((currentIdx) / questions.length) * 100;
  const score = answers.filter((a) => a.correct).length;

  if (isFinished) {
    const wrongAnswersList = answers.filter((a) => !a.correct);
    const wrongWordsDetailed = unlockedWords.filter((w) =>
      wrongAnswersList.some((wa) => wa.wordIndex === w.word_index)
    );

    return (
      <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
        {perfectScore && <ConfettiBurst />}

        <Card className="border border-border bg-card/90 rounded-2xl shadow-md overflow-hidden text-center p-8 space-y-6">
          <div className="mx-auto w-16 h-16 bg-matcha/10 border border-matcha/20 text-matcha rounded-full flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-3xl font-black text-ink">
              {t('quiz.results')}
            </h1>
            <p className="text-sm text-ink-muted leading-relaxed">
              Beautiful effort! Spaced repetition parameters have been updated automatically.
            </p>
          </div>

          <div className="py-4 px-6 bg-bg/50 border border-border/80 rounded-xl max-w-xs mx-auto">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block mb-1">
              {t('quiz.score')}
            </span>
            <span className="font-display font-black text-4xl text-ink">
              {score} <span className="text-lg text-ink-muted">/ {questions.length}</span>
            </span>
          </div>

          {wrongWordsDetailed.length > 0 && (
            <div className="text-left space-y-3 pt-2">
              <span className="text-[10px] font-bold text-sakura-deep uppercase tracking-wider block">
                {t('quiz.incorrect_words')} (Scheduled for tomorrow)
              </span>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-bg/25">
                {wrongWordsDetailed.map((w) => (
                  <div key={w.word_index} className="p-3 text-xs space-y-1 bg-card hover:bg-bg/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">{w.word}</span>
                      <span className="text-ink-muted font-mono">/{w.pronunciation}/</span>
                    </div>
                    <p className="text-ink leading-relaxed">
                      {lang === 'ja' && w.meaning_ja ? w.meaning_ja : w.meaning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Button
              onClick={() => router.push('/home')}
              className="w-full bg-[#E8A6B8] hover:bg-[#E293A7] text-white rounded-xl font-bold cursor-pointer"
            >
              {t('common.back')}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6 select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to exit the quiz?')) router.push('/home');
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-sakura transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Exit
        </button>
        <span className="text-xs font-bold text-ink-muted font-mono">
          Question {currentIdx + 1} of {questions.length}
        </span>
      </div>

      {/* Progress slider bar */}
      <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-sakura transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <Card className="border border-border bg-card/90 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
        {/* Question Text */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sakura-deep">
            <HelpCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Multiple Choice</span>
          </div>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-ink leading-snug">
            {currentQuestion.questionText}
          </h2>
        </div>

        {/* Options list */}
        <div className="grid grid-cols-1 gap-3">
          {currentQuestion.options.map((opt, idx) => {
            let btnStyle = 'border-border bg-bg/25 text-ink hover:border-sakura hover:bg-sakura/5';
            let iconElement = null;

            if (selectedOpt === opt) {
              btnStyle = 'border-sakura bg-sakura/10 text-sakura font-semibold';
            }

            if (isSubmitted) {
              if (opt === currentQuestion.correctAnswer) {
                btnStyle = 'border-matcha bg-matcha/10 text-matcha font-bold';
                iconElement = <CheckCircle2 className="w-4 h-4 text-matcha ml-auto" />;
              } else if (selectedOpt === opt) {
                btnStyle = 'border-red-400 bg-red-50 text-red-500';
                iconElement = <XCircle className="w-4 h-4 text-red-400 ml-auto" />;
              } else {
                btnStyle = 'border-border bg-bg/10 text-ink-muted/50 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                disabled={isSubmitted}
                onClick={() => handleSelectOption(opt)}
                className={`w-full flex items-center justify-between text-left p-4 rounded-xl border text-sm transition-all duration-200 cursor-pointer ${btnStyle}`}
              >
                <span>{opt}</span>
                {iconElement}
              </button>
            );
          })}
        </div>

        {/* Explanation sheet */}
        <AnimatePresence>
          {isSubmitted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-bg/40 border border-border rounded-xl p-4 text-xs space-y-1.5"
            >
              <span className="font-bold text-ink block uppercase tracking-wider text-[9px]">Explanation</span>
              <p className="text-ink-muted leading-relaxed italic">
                {currentQuestion.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit button bar */}
        <div className="pt-2">
          {!isSubmitted ? (
            <Button
              disabled={!selectedOpt}
              onClick={handleCheckAnswer}
              className="w-full bg-[#E8A6B8] hover:bg-[#E293A7] disabled:bg-bg disabled:text-ink-muted/40 text-white rounded-xl font-bold cursor-pointer"
            >
              {t('quiz.check_answer') || 'Check Answer'}
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              disabled={isSaving}
              className="w-full bg-matcha hover:bg-matcha-deep text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>
                {currentIdx < questions.length - 1 
                  ? (t('quiz.next') || 'Next Question')
                  : (t('quiz.finish') || 'Finish Quiz')}
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
