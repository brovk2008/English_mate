'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  BookOpen, Layers, Music, Video, FileText, Mic, 
  ArrowLeft, CheckCircle2, AlertCircle, Sparkles, ChevronDown, ChevronUp, Check, RefreshCw
} from 'lucide-react';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import Flashcards from '@/components/Flashcards';
import ConfettiBurst from '@/components/ConfettiBurst';

interface VocabWord {
  word_index: number;
  word: string;
  pronunciation: string;
  meaning: string;
  example_sentence: string;
}

interface VocabProgress {
  word_index: number;
  learned: boolean;
  review_count?: number;
  ease_factor?: number;
  due_date?: string;
  interval?: number;
}

interface DayClientProps {
  profile: any;
  dayNum: number;
  dayContent: any;
  vocabWords: VocabWord[];
  initialProgress: any;
  initialVocabProgress: VocabProgress[];
  dailyQuote: { day: number; quote: string; author: string };
}

// Programmatic dynamic quiz questions based on Day's Grammar Topic
function getGrammarQuiz(dayNum: number, topic: string) {
  const t = topic.toLowerCase();
  
  if (t.includes('present perfect')) {
    return [
      {
        question: "I ________ (live) in Tokyo since 2018.",
        options: ["live", "lived", "have lived", "am living"],
        answer: "have lived"
      },
      {
        question: "She has already ________ (eat) dinner.",
        options: ["eat", "ate", "eaten", "eating"],
        answer: "eaten"
      },
      {
        question: "________ you ever met CaseOh?",
        options: ["Did", "Have", "Has", "Do"],
        answer: "Have"
      }
    ];
  }
  
  if (t.includes('passive')) {
    return [
      {
        question: "The diary entry was ________ (write) by her yesterday.",
        options: ["write", "wrote", "written", "writing"],
        answer: "written"
      },
      {
        question: "English is ________ (speak) all over the world.",
        options: ["speak", "spoke", "spoken", "speaking"],
        answer: "spoken"
      },
      {
        question: "The custom playlist ________ created last night.",
        options: ["was", "is", "were", "did"],
        answer: "was"
      }
    ];
  }
  
  if (t.includes('future') || t.includes('will') || t.includes('going to')) {
    return [
      {
        question: "I think it ________ (rain) tomorrow.",
        options: ["will rain", "rains", "is going to rain", "rained"],
        answer: "will rain"
      },
      {
        question: "We are ________ (watch) CaseOh's stream tonight.",
        options: ["go watch", "going to watch", "will watch", "watched"],
        answer: "going to watch"
      },
      {
        question: "What time ________ you meet them tomorrow?",
        options: ["will", "are", "do", "did"],
        answer: "will"
      }
    ];
  }

  // Fallback general grammar drill questions
  return [
    {
      question: "He ________ (go) to the library every Wednesday.",
      options: ["go", "goes", "went", "going"],
      answer: "goes"
    },
    {
      question: "She is very interested ________ learning connectives.",
      options: ["in", "on", "at", "for"],
      answer: "in"
    },
    {
      question: "They ________ playing vocabulary drills right now.",
      options: ["is", "am", "are", "was"],
      answer: "are"
    }
  ];
}

export default function DayClient({
  profile,
  dayNum,
  dayContent,
  vocabWords,
  initialProgress,
  initialVocabProgress,
  dailyQuote,
}: DayClientProps) {
  const router = useRouter();

  // Progress states
  const [progress, setProgress] = useState(initialProgress);
  const [vocabProgress, setVocabProgress] = useState<VocabProgress[]>(initialVocabProgress);
  
  // Section collapse states
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    vocab: false,
    grammar: false,
    song: false,
    listening: false,
    writing: false,
    speaking: false,
  });

  // Text inputs & autosave indicators
  const [songsNewWords, setSongsNewWords] = useState(progress.songs_new_words || '');
  const [caseohExpressions, setCaseohExpressions] = useState(progress.caseoh_expressions || '');
  const [diaryText, setDiaryText] = useState(progress.diary_text || '');
  const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({
    song: 'idle',
    listening: 'idle',
    diary: 'idle',
  });

  // Confetti Burst Trigger
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  // Grammar Quiz States
  const quizQuestions = getGrammarQuiz(dayNum, dayContent.grammar_topic);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Day complete checks
  const allTasksDone = 
    progress.vocab_done && 
    progress.grammar_done && 
    progress.song_done && 
    progress.listening_done && 
    progress.writing_done && 
    progress.speaking_done;

  useEffect(() => {
    if (allTasksDone) {
      setTriggerConfetti(true);
      // Auto-collapse sections on complete to clean up viewport
      setCollapsed({
        vocab: true,
        grammar: true,
        song: true,
        listening: true,
        writing: true,
        speaking: true,
      });
    } else {
      setTriggerConfetti(false);
    }
  }, [allTasksDone]);

  // Extract Spotify Track ID
  const getSpotifyEmbedUrl = (spotifyUrl: string) => {
    try {
      const parts = spotifyUrl.split('/track/');
      if (parts.length > 1) {
        const trackId = parts[1].split('?')[0];
        return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;
      }
    } catch (e) {
      console.error('Error parsing Spotify URL:', e);
    }
    return '';
  };

  const spotifyEmbedUrl = getSpotifyEmbedUrl(dayContent.song_spotify_url);

  // Toggle checklist states
  const handleToggleCheck = async (columnName: string, isChecked: boolean) => {
    const supabase = createClient();
    setProgress((prev: any) => ({ ...prev, [columnName]: isChecked }));

    const updatePayload: any = {
      user_id: profile.id,
      day_number: dayNum,
      [columnName]: isChecked,
      updated_at: new Date().toISOString()
    };

    const mockNextProgress = { ...progress, [columnName]: isChecked };
    const nextComplete = 
      mockNextProgress.vocab_done && 
      mockNextProgress.grammar_done && 
      mockNextProgress.song_done && 
      mockNextProgress.listening_done && 
      mockNextProgress.writing_done && 
      mockNextProgress.speaking_done;

    if (nextComplete) {
      updatePayload.completed_at = new Date().toISOString();

      // Update streak in streak_data
      const todayStr = new Date().toISOString().split('T')[0];
      try {
        const { data: currentStreakRow } = await supabase
          .from('streak_data')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle();

        if (currentStreakRow) {
          if (currentStreakRow.last_completed_date !== todayStr) {
            const nextStreak = currentStreakRow.current_streak + 1;
            const nextLongest = Math.max(currentStreakRow.longest_streak, nextStreak);
            
            await supabase
              .from('streak_data')
              .update({
                current_streak: nextStreak,
                longest_streak: nextLongest,
                last_completed_date: todayStr
              })
              .eq('user_id', profile.id);
          }
        } else {
          await supabase
            .from('streak_data')
            .insert({
              user_id: profile.id,
              current_streak: 1,
              longest_streak: 1,
              freezes_available: 1,
              last_completed_date: todayStr
            });
        }
      } catch (err) {
        console.error("Failed to update streak:", err);
      }
    } else {
      updatePayload.completed_at = null;
    }

    const { error } = await supabase
      .from('user_day_progress')
      .upsert(updatePayload, { onConflict: 'user_id,day_number' });

    if (error) {
      console.error(`Error saving check:`, error.message);
      setProgress((prev: any) => ({ ...prev, [columnName]: !isChecked }));
    }
  };

  // Auto-save text area on blur
  const handleSaveTextField = async (fieldName: string, value: string, statusKey: string) => {
    setSaveStatus(prev => ({ ...prev, [statusKey]: 'saving' }));
    const supabase = createClient();

    const updatePayload: any = {
      user_id: profile.id,
      day_number: dayNum,
      [fieldName]: value,
      updated_at: new Date().toISOString()
    };

    if (fieldName === 'diary_text') {
      const words = value.trim().split(/\s+/).filter(Boolean).length;
      updatePayload.diary_word_count = words;
    }

    const { error } = await supabase
      .from('user_day_progress')
      .upsert(updatePayload, { onConflict: 'user_id,day_number' });

    if (error) {
      console.error(`Error saving ${fieldName}:`, error.message);
      setSaveStatus(prev => ({ ...prev, [statusKey]: 'idle' }));
    } else {
      setSaveStatus(prev => ({ ...prev, [statusKey]: 'saved' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [statusKey]: 'idle' }));
      }, 1500);
    }
  };

  // Toggle word mastered (for Tinder swipe deck callback)
  const handleWordMastered = async (wordIndex: number, mastered: boolean) => {
    const supabase = createClient();
    
    // Find if we have existing progress
    const existing = vocabProgress.find(vp => vp.word_index === wordIndex);
    const score = mastered ? 5 : 1;
    const currentReps = existing?.review_count || 0;
    const currentInterval = existing?.interval || 1;
    const currentEase = existing?.ease_factor || 2.5;

    const { calculateSM2 } = require('@/lib/sm2');
    const sm2Result = calculateSM2(score, currentReps, currentInterval, currentEase);

    const updatedRow = {
      user_id: profile.id,
      word_index: wordIndex,
      learned: mastered,
      due_date: sm2Result.dueDate,
      review_count: sm2Result.repetitions,
      ease_factor: sm2Result.easeFactor,
      interval: sm2Result.interval
    };

    const { error } = await supabase
      .from('user_vocab_progress')
      .upsert(updatedRow, { onConflict: 'user_id,word_index' });

    if (!error) {
      setVocabProgress(prev => {
        const filtered = prev.filter(item => item.word_index !== wordIndex);
        return [...filtered, {
          word_index: wordIndex,
          learned: mastered,
          due_date: sm2Result.dueDate,
          review_count: sm2Result.repetitions,
          ease_factor: sm2Result.easeFactor,
          interval: sm2Result.interval
        }];
      });
    }
  };

  const learnedIndices = vocabProgress.map(vp => vp.word_index);

  // Word count calculations
  const wordCount = diaryText.trim().split(/\s+/).filter(Boolean).length;
  const targetWords = 150;
  const wordPercentage = Math.min(100, (wordCount / targetWords) * 100);
  const circleCircumference = 2 * Math.PI * 18; // radius = 18

  // Quiz submission
  const handleSubmitQuiz = () => {
    let score = 0;
    quizQuestions.forEach((q, i) => {
      if (quizAnswers[i] === q.answer) score++;
    });
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  const getSectionBorderClass = (columnName: string, isExpanded: boolean) => {
    if (progress[columnName]) {
      return 'border-l-4 border-l-matcha border-border';
    }
    if (isExpanded) {
      return 'border-l-4 border-l-sakura border-border';
    }
    return 'border-border';
  };

  const toggleSection = (section: string) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-6">
      {triggerConfetti && <ConfettiBurst />}

      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-sakura transition-colors select-none">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <Badge variant="outline" className="border-border text-ink-muted select-none">
          Month {dayContent.month} · Week {dayContent.week}
        </Badge>
      </div>

      {/* Daily Banner Title */}
      <div className="space-y-3">
        <div className="space-y-1">
          <span className="font-display italic text-sm text-sakura-deep font-semibold tracking-wider block">
            Day {dayNum} · {dayContent.phase_title}
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink leading-tight">
            {dayContent.grammar_topic}
          </h1>
        </div>

        {/* Dynamic quote box & daily tip */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm border-l-4 border-l-sakura">
            <span className="text-[10px] font-bold text-sakura-deep tracking-wider uppercase block mb-1">
              🌸 Daily tip
            </span>
            <p className="font-serif italic text-xs sm:text-sm text-ink-muted leading-relaxed">
              "{dayContent.daily_tip}"
            </p>
          </div>

          <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm border-l-4 border-l-gold">
            <span className="text-[10px] font-bold text-gold tracking-wider uppercase block mb-1">
              ✨ Daily quote
            </span>
            <p className="font-display italic text-xs sm:text-sm text-ink leading-relaxed">
              "{dailyQuote.quote}"
            </p>
            <span className="text-[10px] text-ink-muted block mt-1">— {dailyQuote.author}</span>
          </div>
        </div>
      </div>

      {/* 1. VOCABULARY SECTION */}
      <Card className={`rounded-2xl transition-all shadow-sm ${getSectionBorderClass('vocab_done', !collapsed.vocab)}`}>
        <div className="flex items-center justify-between p-4 cursor-pointer select-none border-b border-border/40" onClick={() => toggleSection('vocab')}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${progress.vocab_done ? 'bg-matcha/10 text-matcha' : 'bg-sakura/10 text-sakura'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-base text-ink">
              1. Vocabulary Swipe Cards
            </span>
          </div>
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={progress.vocab_done}
              onCheckedChange={(checked) => handleToggleCheck('vocab_done', !!checked)}
              className="w-5 h-5 border-border data-[state=checked]:bg-matcha data-[state=checked]:border-matcha rounded-lg cursor-pointer"
            />
            <button className="text-ink-muted/60 p-1 hover:text-ink cursor-pointer" onClick={() => toggleSection('vocab')}>
              {collapsed.vocab ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!collapsed.vocab && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="p-5">
                <Flashcards
                  words={vocabWords}
                  learnedIndices={learnedIndices}
                  onWordMastered={handleWordMastered}
                  onAllCompleted={() => handleToggleCheck('vocab_done', true)}
                />
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* 2. GRAMMAR LESSON SECTION */}
      <Card className={`rounded-2xl transition-all shadow-sm ${getSectionBorderClass('grammar_done', !collapsed.grammar)}`}>
        <div className="flex items-center justify-between p-4 cursor-pointer select-none border-b border-border/40" onClick={() => toggleSection('grammar')}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${progress.grammar_done ? 'bg-matcha/10 text-matcha' : 'bg-sakura/10 text-sakura'}`}>
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-base text-ink">
              2. Grammar Video Explainer
            </span>
          </div>
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={progress.grammar_done}
              onCheckedChange={(checked) => handleToggleCheck('grammar_done', !!checked)}
              className="w-5 h-5 border-border data-[state=checked]:bg-matcha data-[state=checked]:border-matcha rounded-lg cursor-pointer"
            />
            <button className="text-ink-muted/60 p-1 hover:text-ink cursor-pointer" onClick={() => toggleSection('grammar')}>
              {collapsed.grammar ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!collapsed.grammar && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="p-5 space-y-4">
                {dayContent.grammar_youtube_id ? (
                  <YouTubeEmbed youtubeId={dayContent.grammar_youtube_id} title={dayContent.grammar_topic} />
                ) : (
                  <div className="bg-bg/50 border border-dashed border-border rounded-xl aspect-video flex items-center justify-center text-xs text-ink-muted select-none">
                    No grammar tutorial video attached. Read the sheet explainer below.
                  </div>
                )}

                <div className="bg-bg/40 border border-border rounded-xl p-4">
                  <span className="text-[10px] font-bold text-ink-muted uppercase block tracking-wider mb-2">Lesson Sheet</span>
                  <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
                    {dayContent.grammar_explainer}
                  </p>
                </div>

                {/* Collapsible Grammar Quick Quiz */}
                <div className="border border-border/80 rounded-xl overflow-hidden bg-bg/25">
                  <div className="p-3 bg-bg/50 border-b border-border/60 flex items-center justify-between text-xs font-bold text-ink uppercase tracking-wider">
                    <span>Quick Grammar Quiz</span>
                    {quizSubmitted && <span className="text-sakura-deep">Score: {quizScore}/3</span>}
                  </div>

                  <div className="p-4 space-y-4">
                    {quizQuestions.map((q, i) => (
                      <div key={i} className="space-y-2">
                        <p className="text-xs font-semibold text-ink-muted">Q{i+1}: {q.question}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [i]: opt }))}
                              disabled={quizSubmitted}
                              className={`py-1.5 px-3 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer
                                ${quizAnswers[i] === opt 
                                  ? quizSubmitted 
                                    ? opt === q.answer ? 'bg-matcha/10 border-matcha text-matcha' : 'bg-red-500/10 border-red-500 text-red-500'
                                    : 'bg-sakura/10 border-sakura text-sakura-deep'
                                  : 'bg-card border-border hover:bg-bg'
                                }`}
                            >
                              {opt} {quizSubmitted && opt === q.answer && <Check className="w-3.5 h-3.5 inline ml-1.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    {!quizSubmitted ? (
                      <Button
                        size="sm"
                        onClick={handleSubmitQuiz}
                        disabled={Object.keys(quizAnswers).length < 3}
                        className="bg-sakura hover:bg-sakura-deep/90 text-white dark:text-bg rounded-xl font-bold text-xs"
                      >
                        Submit Answers
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setQuizAnswers({});
                          setQuizSubmitted(false);
                        }}
                        className="border-border text-ink-muted hover:bg-bg rounded-xl font-bold text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" /> Retry
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* 3. SONG OF THE DAY SECTION */}
      <Card className={`rounded-2xl transition-all shadow-sm ${getSectionBorderClass('song_done', !collapsed.song)}`}>
        <div className="flex items-center justify-between p-4 cursor-pointer select-none border-b border-border/40" onClick={() => toggleSection('song')}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${progress.song_done ? 'bg-matcha/10 text-matcha' : 'bg-sakura/10 text-sakura'}`}>
              <Music className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-base text-ink">
              3. Song: {dayContent.song_title}
            </span>
          </div>
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={progress.song_done}
              onCheckedChange={(checked) => handleToggleCheck('song_done', !!checked)}
              className="w-5 h-5 border-border data-[state=checked]:bg-matcha data-[state=checked]:border-matcha rounded-lg cursor-pointer"
            />
            <button className="text-ink-muted/60 p-1 hover:text-ink cursor-pointer" onClick={() => toggleSection('song')}>
              {collapsed.song ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!collapsed.song && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="p-5 space-y-4">
                {spotifyEmbedUrl ? (
                  <iframe
                    src={spotifyEmbedUrl}
                    width="100%"
                    height="80"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="border-none rounded-xl bg-bg/50 shadow-sm"
                  />
                ) : (
                  <div className="text-xs text-ink-muted italic">Spotify player failed to configure.</div>
                )}

                {/* Words I Found Input */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-ink-muted tracking-wider uppercase block">
                      New Words I Heard (Slang & Idioms):
                    </label>
                    <span className="text-[10px] text-ink-muted">
                      {saveStatus.song === 'saving' && 'Saving...'}
                      {saveStatus.song === 'saved' && 'Saved ✓'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={songsNewWords}
                    onChange={(e) => setSongsNewWords(e.target.value)}
                    onBlur={() => handleSaveTextField('songs_new_words', songsNewWords, 'song')}
                    placeholder="e.g. gonna, break a leg, throw shade..."
                    className="w-full h-10 px-3 border border-border bg-bg/20 hover:border-sakura focus:border-sakura focus:ring-2 focus:ring-sakura/20 rounded-xl text-sm font-medium transition-all"
                  />
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* 4. LISTENING SECTION */}
      <Card className={`rounded-2xl transition-all shadow-sm ${getSectionBorderClass('listening_done', !collapsed.listening)}`}>
        <div className="flex items-center justify-between p-4 cursor-pointer select-none border-b border-border/40" onClick={() => toggleSection('listening')}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${progress.listening_done ? 'bg-matcha/10 text-matcha' : 'bg-sakura/10 text-sakura'}`}>
              <Video className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-base text-ink">
              4. Listening: {dayContent.listening_label}
            </span>
          </div>
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={progress.listening_done}
              onCheckedChange={(checked) => handleToggleCheck('listening_done', !!checked)}
              className="w-5 h-5 border-border data-[state=checked]:bg-matcha data-[state=checked]:border-matcha rounded-lg cursor-pointer"
            />
            <button className="text-ink-muted/60 p-1 hover:text-ink cursor-pointer" onClick={() => toggleSection('listening')}>
              {collapsed.listening ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!collapsed.listening && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="p-5 space-y-4">
                {/* Mode Indicator Badge */}
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-ink-muted">Listening Target Mode:</span>
                  {dayContent.listening_mode === 'subs_on' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-matcha/15 text-matcha font-bold text-[10px]">🟢 Subtitles On</span>
                  )}
                  {dayContent.listening_mode === 'subs_optional' && (
                    <span className="px-2.5 py-0.5 rounded-full bg-gold/15 text-gold font-bold text-[10px]">🟡 Subtitles Optional</span>
                  )}
                  {(dayContent.listening_mode === 'no_subs' || dayContent.listening_mode === 'dub_only') && (
                    <span className="px-2.5 py-0.5 rounded-full bg-sakura/15 text-sakura-deep font-bold text-[10px]">🔴 No Subtitles</span>
                  )}
                </div>

                {dayContent.listening_youtube_id ? (
                  <YouTubeEmbed youtubeId={dayContent.listening_youtube_id} title={dayContent.listening_label} />
                ) : (
                  <div className="bg-bg/50 border border-dashed border-border rounded-xl aspect-video flex flex-col items-center justify-center text-center p-6 text-xs text-ink-muted select-none">
                    <p className="font-semibold">Anime Listening Day</p>
                    <p className="mt-1">Go to Crunchyroll or Netflix and watch an episode in English dub!</p>
                  </div>
                )}

                {/* Expressions Area */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-ink-muted tracking-wider uppercase block">
                      What happened in this video? Write 3-5 sentences:
                    </label>
                    <span className="text-[10px] text-ink-muted">
                      {saveStatus.listening === 'saving' && 'Saving...'}
                      {saveStatus.listening === 'saved' && 'Saved ✓'}
                    </span>
                  </div>
                  <Textarea
                    value={caseohExpressions}
                    onChange={(e) => setCaseohExpressions(e.target.value)}
                    onBlur={() => handleSaveTextField('caseoh_expressions', caseohExpressions, 'listening')}
                    placeholder="Describe the story briefly. Focus on expressions they used..."
                    className="w-full border-border bg-bg/20 hover:border-sakura focus:border-sakura focus:ring-2 focus:ring-sakura/20 rounded-xl text-sm font-medium transition-all min-h-[90px]"
                  />
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* 5. WRITING DIARY SECTION */}
      <Card className={`rounded-2xl transition-all shadow-sm ${getSectionBorderClass('writing_done', !collapsed.writing)}`}>
        <div className="flex items-center justify-between p-4 cursor-pointer select-none border-b border-border/40" onClick={() => toggleSection('writing')}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${progress.writing_done ? 'bg-matcha/10 text-matcha' : 'bg-sakura/10 text-sakura'}`}>
              <FileText className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-base text-ink">
              5. Daily English Diary
            </span>
          </div>
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={progress.writing_done}
              onCheckedChange={(checked) => handleToggleCheck('writing_done', !!checked)}
              className="w-5 h-5 border-border data-[state=checked]:bg-matcha data-[state=checked]:border-matcha rounded-lg cursor-pointer"
            />
            <button className="text-ink-muted/60 p-1 hover:text-ink cursor-pointer" onClick={() => toggleSection('writing')}>
              {collapsed.writing ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!collapsed.writing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="p-5 space-y-4">
                <div className="bg-bg/40 border border-border rounded-xl p-4 border-l-2 border-l-gold">
                  <span className="text-[10px] font-bold text-gold tracking-wider uppercase block mb-1">Diary Prompt</span>
                  <p className="text-sm font-semibold text-ink leading-relaxed">
                    {dayContent.writing_prompt}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-ink-muted tracking-wider uppercase block">
                      Write your diary entry (Target: 150+ words):
                    </label>
                    <span className="text-[10px] text-ink-muted">
                      {saveStatus.diary === 'saving' && 'Saving...'}
                      {saveStatus.diary === 'saved' && 'Saved ✓'}
                    </span>
                  </div>

                  <Textarea
                    value={diaryText}
                    onChange={(e) => setDiaryText(e.target.value)}
                    onBlur={() => handleSaveTextField('diary_text', diaryText, 'diary')}
                    placeholder="Write freely in English about your day, reflecting on the prompt..."
                    className="w-full border-border bg-bg/20 hover:border-sakura focus:border-sakura focus:ring-2 focus:ring-sakura/20 rounded-xl text-sm font-medium transition-all min-h-[160px]"
                  />

                  {/* Circular word count progress ring */}
                  <div className="flex items-center gap-3 pt-3">
                    <svg className="w-10 h-10 transform -rotate-90 select-none">
                      <circle cx="20" cy="20" r="16" className="stroke-border fill-none" strokeWidth="3.5" />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        className="stroke-sakura fill-none transition-all duration-300"
                        strokeWidth="3.5"
                        strokeDasharray={circleCircumference}
                        strokeDashoffset={circleCircumference - (circleCircumference * wordPercentage) / 100}
                      />
                    </svg>
                    <div className="text-xs font-semibold">
                      <span className="text-ink font-bold">{wordCount}</span>
                      <span className="text-ink-muted"> / {targetWords}+ words written</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* 6. SPEAKING SECTION */}
      <Card className={`rounded-2xl transition-all shadow-sm ${getSectionBorderClass('speaking_done', !collapsed.speaking)}`}>
        <div className="flex items-center justify-between p-4 cursor-pointer select-none border-b border-border/40" onClick={() => toggleSection('speaking')}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${progress.speaking_done ? 'bg-matcha/10 text-matcha' : 'bg-sakura/10 text-sakura'}`}>
              <Mic className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-base text-ink">
              6. Speaking Practice
            </span>
          </div>
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={progress.speaking_done}
              onCheckedChange={(checked) => handleToggleCheck('speaking_done', !!checked)}
              className="w-5 h-5 border-border data-[state=checked]:bg-matcha data-[state=checked]:border-matcha rounded-lg cursor-pointer"
            />
            <button className="text-ink-muted/60 p-1 hover:text-ink cursor-pointer" onClick={() => toggleSection('speaking')}>
              {collapsed.speaking ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!collapsed.speaking && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="p-5 space-y-4">
                <div className="bg-bg/40 border border-border rounded-xl p-4 border-l-2 border-l-gold">
                  <span className="text-[10px] font-bold text-gold tracking-wider uppercase block mb-1">Speaking prompt</span>
                  <p className="text-sm font-semibold text-ink leading-relaxed">
                    {dayContent.speaking_prompt}
                  </p>
                </div>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Record yourself reading your diary aloud or speaking about the prompt on your phone's voice memos. Once practiced, check off the task above!
                </p>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* MISSION COMPLETED CELEBRATORY CARD */}
      {allTasksDone && (
        <Card className="border border-matcha/40 bg-matcha/5 rounded-2xl p-6 text-center space-y-4 shadow-md">
          <div className="w-14 h-14 bg-matcha/10 text-matcha rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display font-extrabold text-2xl text-ink">
              🌸 Mission Complete! 🌸
            </h2>
            <p className="text-sm text-ink-muted max-w-sm mx-auto">
              Day {dayNum} / 90 — Beautiful work today. You kept your streak alive!
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link href="/home">
              <Button variant="outline" className="border-border text-ink-muted hover:bg-bg rounded-xl font-bold cursor-pointer">
                Back to Dashboard
              </Button>
            </Link>
            {dayNum < 90 && (
              <Link href={`/day/${dayNum + 1}`}>
                <Button className="bg-sakura hover:bg-sakura-deep/90 text-white dark:text-bg rounded-xl font-bold cursor-pointer">
                  See Day {dayNum + 1} Preview →
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
