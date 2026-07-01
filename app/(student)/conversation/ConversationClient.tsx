'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, Volume2, Mic, CheckCircle, RefreshCw, Eye, EyeOff, User, Users, ChevronRight } from 'lucide-react';
import ConfettiBurst from '@/components/ConfettiBurst';
import { useI18n } from '@/lib/i18n/context';

interface Step {
  speaker: string;
  text: string;
  text_ja: string;
}

interface Scenario {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  roleA: string;
  roleB: string;
  steps: Step[];
}

interface ProgressRecord {
  conversation_id: string;
}

interface ConversationClientProps {
  scenarios: Scenario[];
  initialProgress: ProgressRecord[];
}

export default function ConversationClient({ scenarios, initialProgress }: ConversationClientProps) {
  const router = useRouter();
  const { lang, t } = useI18n();

  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [localProgress, setLocalProgress] = useState<ProgressRecord[]>(initialProgress);

  // Setup gameplay choices
  const [userRole, setUserRole] = useState<'A' | 'B' | null>(null); // null means role selection screen
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [history, setHistory] = useState<Step[]>([]);
  const [showTranslations, setShowTranslations] = useState<Record<number, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Browser Text to Speech Synthesis
  const playAudio = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Slightly slower for language learners
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectScenario = (s: Scenario) => {
    setSelectedScenario(s);
    setUserRole(null);
    setCurrentStepIdx(0);
    setHistory([]);
    setShowTranslations({});
    setIsCompleted(false);
    setTriggerConfetti(false);
  };

  const handleStartConversation = (role: 'A' | 'B') => {
    setUserRole(role);
    setCurrentStepIdx(0);
    setHistory([]);
    
    // If user is Role B, the Partner (Role A) speaks first!
    if (role === 'B' && selectedScenario) {
      const firstStep = selectedScenario.steps[0];
      setHistory([firstStep]);
      setCurrentStepIdx(1);
      setTimeout(() => {
        playAudio(firstStep.text);
      }, 500);
    }
  };

  const handleAdvanceStep = async () => {
    if (!selectedScenario || userRole === null) return;

    const nextStep = selectedScenario.steps[currentStepIdx];
    
    // Add active step to history
    setHistory((prev) => [...prev, nextStep]);

    // Check if we just completed the last step
    if (currentStepIdx >= selectedScenario.steps.length - 1) {
      setIsCompleted(true);
      setTriggerConfetti(true);

      // Save completion
      setIsSaving(true);
      try {
        await fetch('/api/save-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: selectedScenario.id
          })
        });

        setLocalProgress((prev) => {
          if (prev.some((x) => x.conversation_id === selectedScenario.id)) return prev;
          return [...prev, { conversation_id: selectedScenario.id }];
        });
      } catch (err) {
        console.error('Failed to save conversation progress:', err);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Move index
      const newIndex = currentStepIdx + 1;
      setCurrentStepIdx(newIndex);

      // Speak next line automatically if it's the partner's turn!
      const followingStep = selectedScenario.steps[newIndex];
      const isPartnerNext = 
        (userRole === 'A' && followingStep.speaker !== selectedScenario.roleA) ||
        (userRole === 'B' && followingStep.speaker !== selectedScenario.roleB);

      if (isPartnerNext) {
        setTimeout(() => {
          playAudio(followingStep.text);
        }, 1000);
      }
    }
  };

  const toggleTranslation = (idx: number) => {
    setShowTranslations((prev) => ({ ...prev, [idx]: !prev[idx] }));
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
          Conversation Roleplay Room
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Scenarios List Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <Card className="border border-border bg-card rounded-2xl p-4">
            <h2 className="font-display font-extrabold text-sm text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-sakura" /> Dialogue Scenarios
            </h2>

            <div className="space-y-2">
              {scenarios.map((s) => {
                const isCompleted = localProgress.some((x) => x.conversation_id === s.id);
                const isSelected = selectedScenario?.id === s.id;

                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectScenario(s)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col space-y-1 ${
                      isSelected
                        ? 'border-sakura bg-sakura/5 shadow-sm'
                        : 'border-border/60 bg-bg/10 hover:border-border hover:bg-bg/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-sm font-bold truncate ${isSelected ? 'text-sakura-deep' : 'text-ink'}`}>
                        {s.title}
                      </span>
                      {isCompleted && (
                        <Badge className="bg-matcha text-white hover:bg-matcha border-none text-[8px] py-0 px-1.5 rounded-full select-none">
                          Done
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-ink-muted line-clamp-1">
                      {s.description}
                    </p>
                    <div className="pt-1">
                      <Badge variant="outline" className={`text-[8px] px-2 py-0 border ${getDifficultyColor(s.difficulty)}`}>
                        {s.difficulty}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Selected Scenario Surface */}
        <div className="md:col-span-2 space-y-6">
          {!selectedScenario ? (
            <Card className="border border-border/80 bg-card rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-14 h-14 bg-sakura/10 text-sakura rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink mb-1">
                Select a Conversation
              </h3>
              <p className="text-xs text-ink-muted max-w-xs leading-relaxed">
                Choose a roleplay scenario on the left, pick your speaking character, and practice speaking aloud with interactive speech support!
              </p>
            </Card>
          ) : userRole === null ? (
            /* Character/Role Choice Select Panel */
            <Card className="border border-border bg-card rounded-2xl p-6 space-y-6 shadow-sm animate-fade-in">
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-ink">
                  Select Your Role
                </h3>
                <p className="text-xs text-ink-muted">
                  Choose which character you want to speak. The partner will speak the other.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleStartConversation('A')}
                  className="border border-border hover:border-sakura hover:bg-sakura/5 rounded-2xl p-5 text-left space-y-2.5 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-sakura/10 text-sakura flex items-center justify-center group-hover:scale-105 transition-transform">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-ink">{selectedScenario.roleA}</div>
                    <div className="text-[10px] text-ink-muted mt-0.5">You will speak first and play the role of the host.</div>
                  </div>
                </button>

                <button
                  onClick={() => handleStartConversation('B')}
                  className="border border-border hover:border-sakura hover:bg-sakura/5 rounded-2xl p-5 text-left space-y-2.5 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-matcha/10 text-matcha flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-ink">{selectedScenario.roleB}</div>
                    <div className="text-[10px] text-ink-muted mt-0.5">You will speak second and play the guest.</div>
                  </div>
                </button>
              </div>
            </Card>
          ) : (
            /* Dialogue simulation screen */
            <div className="space-y-6">
              <Card className="border border-border bg-card rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between min-h-[400px]">
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-sakura/10 text-sakura-deep hover:bg-sakura/10 border-none font-bold text-xs select-none">
                      Role: {userRole === 'A' ? selectedScenario.roleA : selectedScenario.roleB}
                    </Badge>
                  </div>
                  <button
                    onClick={() => setUserRole(null)}
                    className="text-xs font-semibold text-ink-muted hover:text-sakura transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Change Character
                  </button>
                </div>

                {/* Conversation bubbles stream */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[350px]">
                  {history.map((step, idx) => {
                    const isUserLine =
                      (userRole === 'A' && step.speaker === selectedScenario.roleA) ||
                      (userRole === 'B' && step.speaker === selectedScenario.roleB);

                    const showJa = !!showTranslations[idx];

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col max-w-[85%] space-y-1 ${
                          isUserLine ? 'ml-auto items-end text-right' : 'mr-auto items-start text-left'
                        }`}
                      >
                        <span className="text-[9px] font-bold text-ink-muted uppercase">
                          {step.speaker}
                        </span>
                        
                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm shadow-sm relative group leading-relaxed ${
                            isUserLine
                              ? 'bg-sakura text-white dark:text-bg rounded-tr-none'
                              : 'bg-bg text-ink border border-border/80 rounded-tl-none'
                          }`}
                        >
                          <p>{step.text}</p>
                          
                          {/* Translations toggle */}
                          {showJa && (
                            <p className={`text-[11px] mt-2 border-t pt-1.5 leading-relaxed ${
                              isUserLine ? 'border-white/20 text-white/80' : 'border-border/60 text-ink-muted'
                            }`}>
                              {step.text_ja}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => playAudio(step.text)}
                              className={`p-1 rounded hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                                isUserLine ? 'text-white/80 hover:text-white' : 'text-ink-muted hover:text-sakura'
                              }`}
                              title="Listen again"
                            >
                              <Volume2 size={13} />
                            </button>
                            <button
                              onClick={() => toggleTranslation(idx)}
                              className={`p-1 rounded hover:scale-105 active:scale-95 transition-all cursor-pointer ${
                                isUserLine ? 'text-white/80 hover:text-white' : 'text-ink-muted hover:text-sakura'
                              }`}
                              title="Toggle Japanese"
                            >
                              {showJa ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Active input control panel */}
                {!isCompleted ? (
                  <div className="border-t border-border/40 pt-4 space-y-4">
                    {(() => {
                      const activeStep = selectedScenario.steps[currentStepIdx];
                      if (!activeStep) return null;

                      const isUserTurn =
                        (userRole === 'A' && activeStep.speaker === selectedScenario.roleA) ||
                        (userRole === 'B' && activeStep.speaker === selectedScenario.roleB);

                      return (
                        <div className="space-y-4">
                          <div className="bg-bg/40 border border-border/70 rounded-xl p-4 space-y-2 animate-pulse">
                            <span className="text-[9px] font-bold text-sakura-deep uppercase tracking-wider block">
                              {isUserTurn ? 'Your Turn to Speak! Read Aloud:' : 'Partner is Speaking...'}
                            </span>
                            <p className="text-sm font-semibold text-ink leading-relaxed">
                              {activeStep.text}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <Button
                              onClick={() => playAudio(activeStep.text)}
                              variant="outline"
                              className="border-border text-ink hover:bg-bg rounded-xl font-bold cursor-pointer"
                            >
                              <Volume2 className="w-4 h-4 mr-1.5" /> Listen
                            </Button>
                            
                            <Button
                              onClick={handleAdvanceStep}
                              className="flex-1 bg-sakura hover:bg-sakura-deep/90 text-white dark:text-bg rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              {isUserTurn ? (
                                <>
                                  <Mic className="w-4 h-4 animate-bounce" /> I've Spoken
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="w-4 h-4" /> Next Turn
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* Completed state */
                  <div className="border-t border-border/40 pt-4 text-center space-y-4 animate-fade-in">
                    <div className="w-12 h-12 bg-matcha/10 text-matcha rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-6 h-6 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-display font-extrabold text-base text-ink">Roleplay Complete!</h4>
                      <p className="text-xs text-ink-muted mt-0.5">Spoken dialog scores saved on profile.</p>
                    </div>
                    <Button
                      onClick={() => handleSelectScenario(selectedScenario)}
                      variant="outline"
                      className="border-border text-ink-muted hover:bg-bg rounded-xl font-bold text-xs cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Practice Again
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
