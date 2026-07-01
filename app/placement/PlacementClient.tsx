'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, GraduationCap, ChevronRight, Check, AlertCircle } from 'lucide-react';
import ConfettiBurst from '@/components/ConfettiBurst';

interface Question {
  id: string;
  level: string;
  type: string;
  question: string;
  options: string[];
  answer: number;
  question_ja: string;
}

interface PlacementClientProps {
  questions: Question[];
}

type Step = 'self-assessment' | 'daily-time' | 'diagnostic' | 'result';

export default function PlacementClient({ questions }: PlacementClientProps) {
  const router = useRouter();

  // Navigation steps
  const [step, setStep] = useState<Step>('self-assessment');

  // Step 1: Self-score range 1-10
  const [selfScore, setSelfScore] = useState<number | null>(null);

  // Step 2: Daily time preference
  const [dailyMinutes, setDailyMinutes] = useState<number>(90);

  // Step 3: Diagnostic test states
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<Question[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  // Step 4: Final Results
  const [cefrResult, setCefrResult] = useState<string>('A2');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Self assessment choices
  const selfAssessmentOptions = [
    { range: '1-2', value: 2, label: 'Almost nothing — I only know "Hello" and "Thank you"', label_ja: 'ほぼゼロ — 「こんにちは」「ありがとう」程度だけ知っている' },
    { range: '3-4', value: 4, label: 'I know some words and simple sentences', label_ja: 'いくつかの単語と簡単な短文を知っている' },
    { range: '5-6', value: 6, label: 'I can read subtitles and understand some things', label_ja: '字幕を読めばある程度理解できる（ CaseOhの動画など）' },
    { range: '7-8', value: 8, label: 'I can hold basic conversations', label_ja: '日常の簡単な会話ならやり取りできる' },
    { range: '9-10', value: 10, label: "I'm quite good, I just want to get better", label_ja: 'かなり得意だが、さらに表現力を磨きたい' }
  ];

  // Daily minutes choices
  const dailyTimeOptions = [
    { label: '30 min', value: 30, desc: 'Short sessions — I\'m busy', desc_ja: '忙しい日々のためのショートセッション' },
    { label: '1 hour', value: 60, desc: 'Normal pace', desc_ja: '無理のない標準的なペース' },
    { label: '1.5 hours', value: 90, desc: 'Dedicated learner', desc_ja: 'おすすめの充実した学習ペース（推奨）' },
    { label: '2+ hours', value: 120, desc: 'Full immersion mode', desc_ja: 'いち早く上達するための集中モード' }
  ];

  // Determine CEFR level descriptions
  const getCefrDescription = (level: string) => {
    switch (level) {
      case 'A1':
        return {
          en: "You are an absolute beginner. You'll build spelling foundations, basic pronouns, and core daily vocabulary.",
          ja: "完全な初心者レベルです。アルファベットの基礎、基本的な代名詞、日常生活で必須となる英単語を学びます。"
        };
      case 'A2':
        return {
          en: "You are an elementary learner. You can build simple sentences and understand familiar phrases. We'll stretch your grammar.",
          ja: "初級者レベルです。簡単な文法で文章を作り、身近なフレーズを理解できます。より幅広い表現に挑戦しましょう。"
        };
      case 'B1':
        return {
          en: "B1 — Pre-Intermediate. You understand quite a lot when you read, but speaking and writing take more effort. That's exactly what this course is designed for.",
          ja: "B1 — 中級準備レベル。読んで理解することはかなりできますが、話すことや書くことにはまだ努力が必要です。このコースはまさにその克服のために設計されています。"
        };
      case 'B1+':
        return {
          en: "You are intermediate. You can describe experiences, express opinions, and follow dialogues easily. We will focus on conversational fluency.",
          ja: "中級レベルです。これまでの経験を語り、意見を述べ、会話をスムーズに追うことができます。表現の流暢さとスピーキングに重点を置きます。"
        };
      case 'B2':
        return {
          en: "You are upper-intermediate. You understand complex text and can communicate spontaneously with native speakers.",
          ja: "上級に近い中上級レベルです。複雑な文章を理解し、ネイティブスピーカーと自然にやり取りができます。より洗練されたスラングや表現を極めます。"
        };
      default:
        return {
          en: "Your 90-day plan is ready to start.",
          ja: "90日間の学習プランが整いました。"
        };
    }
  };

  const handleSelectSelfScore = (score: number) => {
    setSelfScore(score);
    // Filter questions adaptively
    let filtered: Question[] = [];
    if (score <= 4) {
      filtered = questions.filter(q => q.level === 'A1' || q.level === 'A2');
    } else if (score <= 7) {
      filtered = questions.filter(q => q.level === 'A2' || q.level === 'B1');
    } else {
      filtered = questions.filter(q => q.level === 'B1' || q.level === 'B1+' || q.level === 'B2');
    }
    setAdaptiveQuestions(filtered);
    setStep('daily-time');
  };

  const handleNextQuestion = () => {
    if (selectedOption === null || selfScore === null) return;

    const currentQuestion = adaptiveQuestions[activeQuestionIdx];
    const isCorrect = selectedOption === currentQuestion.answer;

    if (isCorrect) {
      setCorrectAnswersCount(prev => prev + 1);
    }

    setSelectedOption(null);

    if (activeQuestionIdx < adaptiveQuestions.length - 1) {
      setActiveQuestionIdx(prev => prev + 1);
    } else {
      // Evaluate diagnostic scores
      const totalPresented = adaptiveQuestions.length;
      let finalCorrectSum = correctAnswersCount + (isCorrect ? 1 : 0);

      // Award points for levels skipped
      if (selfScore >= 5 && selfScore <= 7) {
        finalCorrectSum += 2; // skipped 2 A1 questions
      } else if (selfScore >= 8) {
        finalCorrectSum += 5; // skipped 5 A1+A2 questions
      }

      // Map to CEFR level code
      let cefr = 'A2';
      if (finalCorrectSum <= 3) {
        cefr = 'A1';
      } else if (finalCorrectSum <= 5) {
        cefr = 'A2';
      } else if (finalCorrectSum <= 7) {
        cefr = 'B1';
      } else if (finalCorrectSum <= 9) {
        cefr = 'B1+';
      } else {
        cefr = 'B2';
      }

      setCefrResult(cefr);
      setStep('result');
    }
  };

  const handleFinishPlacement = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/save-placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selfScore,
          dailyMinutes,
          cefrLevel: cefrResult
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save results');
      }

      // Successfully saved! Go back to home page (will trigger onboarding next)
      router.push('/home');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 select-none">
      {step === 'result' && <ConfettiBurst />}

      {/* Step 1: Self-Assessment */}
      {step === 'self-assessment' && (
        <Card className="border border-border bg-card rounded-3xl p-6 sm:p-8 space-y-6 shadow-md">
          <div className="text-center space-y-2">
            <GraduationCap className="w-10 h-10 text-sakura mx-auto animate-pulse" />
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink">
              English Placement Test
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              How would you describe your English right now?
            </p>
          </div>

          <div className="space-y-3">
            {selfAssessmentOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleSelectSelfScore(opt.value)}
                className="w-full text-left p-4 rounded-2xl border border-border/80 hover:border-sakura hover:bg-sakura/5 transition-all cursor-pointer group flex flex-col space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-sakura/10 text-sakura border-none font-bold text-xs select-none">
                    {opt.range}
                  </Badge>
                  <span className="font-bold text-xs sm:text-sm text-ink group-hover:text-sakura-deep">
                    {opt.label}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-ink-muted leading-relaxed font-medium pl-1">
                  {opt.label_ja}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Step 2: Daily Time Commitment */}
      {step === 'daily-time' && (
        <Card className="border border-border bg-card rounded-3xl p-6 sm:p-8 space-y-6 shadow-md animate-fade-in">
          <div className="text-center space-y-2">
            <Sparkles className="w-10 h-10 text-sakura mx-auto" />
            <h2 className="font-display text-xl sm:text-2xl font-extrabold text-ink">
              Daily Study Plan
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              How much time can you study each day?
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dailyTimeOptions.map((opt) => {
              const isSelected = dailyMinutes === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setDailyMinutes(opt.value)}
                  className={`p-5 rounded-2xl border text-left flex flex-col space-y-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sakura bg-sakura/5 text-sakura-deep'
                      : 'border-border hover:border-sakura hover:bg-sakura/5 text-ink-muted'
                  }`}
                >
                  <span className="font-black text-sm text-ink">{opt.label}</span>
                  <p className="text-[10px] text-ink-muted leading-relaxed font-medium">{opt.desc}</p>
                  <p className="text-[9px] text-ink-muted/80 leading-relaxed font-medium italic">{opt.desc_ja}</p>
                </button>
              );
            })}
          </div>

          <Button
            onClick={() => setStep('diagnostic')}
            className="w-full bg-[#E8A6B8] hover:bg-[#E293A7] text-white rounded-2xl font-bold py-3.5 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-sm"
          >
            Start Diagnostic Test <ChevronRight className="w-4 h-4" />
          </Button>
        </Card>
      )}

      {/* Step 3: Diagnostic test */}
      {step === 'diagnostic' && (() => {
        const currentQuestion = adaptiveQuestions[activeQuestionIdx];
        if (!currentQuestion) return null;

        const progressPercent = Math.round((activeQuestionIdx / adaptiveQuestions.length) * 100);

        return (
          <Card className="border border-border bg-card rounded-3xl p-6 sm:p-8 space-y-6 shadow-md animate-fade-in">
            <div className="space-y-2 select-none">
              <div className="flex justify-between items-center text-[10px] font-bold text-ink-muted uppercase">
                <span>Diagnostic Check</span>
                <span>Question {activeQuestionIdx + 1} of {adaptiveQuestions.length}</span>
              </div>
              <Progress value={progressPercent} className="h-1 bg-border" />
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-bold text-sakura-deep uppercase tracking-wider block">
                Type: {currentQuestion.type}
              </span>
              <h3 className="font-display text-base sm:text-lg font-bold text-ink leading-relaxed">
                {currentQuestion.question}
              </h3>
              <p className="text-xs text-ink-muted italic font-medium">
                {currentQuestion.question_ja}
              </p>
            </div>

            <div className="space-y-2">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer font-medium text-xs sm:text-sm flex items-center justify-between ${
                      isSelected
                        ? 'border-sakura bg-sakura/5 text-sakura-deep font-bold'
                        : 'border-border/60 hover:border-sakura hover:bg-sakura/5 text-ink'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check className="w-4 h-4 text-sakura" />}
                  </button>
                );
              })}
            </div>

            <Button
              disabled={selectedOption === null}
              onClick={handleNextQuestion}
              className="w-full bg-sakura hover:bg-sakura-deep text-white dark:text-bg rounded-2xl font-bold py-3.5 flex items-center justify-center gap-1.5 cursor-pointer text-sm"
            >
              Confirm Answer <ChevronRight className="w-4 h-4" />
            </Button>
          </Card>
        );
      })()}

      {/* Step 4: Placement Results page */}
      {step === 'result' && (() => {
        const desc = getCefrDescription(cefrResult);
        return (
          <Card className="border border-border bg-[#FAF6F1]/90 dark:bg-card rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-fade-in text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-sakura/10 text-sakura rounded-full flex items-center justify-center text-3xl animate-bounce">
              🌸
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-sakura-deep uppercase tracking-widest block">
                Result Unlocked
              </span>
              <h2 className="font-display text-2xl font-black text-ink">
                Your English Level
              </h2>
            </div>

            <div className="w-full py-4 px-6 bg-card border border-border/80 rounded-2xl space-y-3">
              <span className="text-3xl font-black text-sakura-deep tracking-wider font-mono">
                {cefrResult}
              </span>

              {/* Slider scale */}
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-ink-muted uppercase">
                  <span className={cefrResult === 'A1' ? 'text-sakura-deep font-black' : ''}>A1</span>
                  <span className={cefrResult === 'A2' ? 'text-sakura-deep font-black' : ''}>A2</span>
                  <span className={cefrResult === 'B1' ? 'text-sakura-deep font-black' : ''}>B1</span>
                  <span className={cefrResult === 'B1+' ? 'text-sakura-deep font-black' : ''}>B1+</span>
                  <span className={cefrResult === 'B2' ? 'text-sakura-deep font-black' : ''}>B2</span>
                </div>
                <div className="h-2 bg-bg rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-sakura"
                    style={{
                      width:
                        cefrResult === 'A1' ? '20%' :
                        cefrResult === 'A2' ? '40%' :
                        cefrResult === 'B1' ? '60%' :
                        cefrResult === 'B1+' ? '80%' : '100%'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 max-w-sm">
              <p className="text-xs sm:text-sm text-ink leading-relaxed font-semibold">
                {desc.en}
              </p>
              <p className="text-[11px] sm:text-xs text-ink-muted leading-relaxed italic font-medium">
                {desc.ja}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-500/10 max-w-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              disabled={saving}
              onClick={handleFinishPlacement}
              className="w-full bg-sakura hover:bg-sakura-deep text-white dark:text-bg rounded-2xl font-bold py-4 text-sm shadow-md cursor-pointer flex items-center justify-center gap-1"
            >
              {saving ? 'Creating Plan...' : 'Start Day 1 →'}
            </Button>
          </Card>
        );
      })()}
    </div>
  );
}
