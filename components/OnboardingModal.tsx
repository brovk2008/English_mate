'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n/context';
import { useTheme } from 'next-themes';
import { Sparkles, Sun, Moon, Laptop, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingModalProps {
  initialOnboarded: boolean;
  displayName: string;
}

export default function OnboardingModal({ initialOnboarded, displayName }: OnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const { lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialOnboarded === false) {
      setIsOpen(true);
    }
  }, [initialOnboarded]);

  if (!isOpen) return null;

  const nextStep = () => setStep(prev => Math.min(4, prev + 1));
  const prevStep = () => setStep(prev => Math.max(1, prev - 1));

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/complete-onboarding', {
        method: 'POST',
      });
      if (res.ok) {
        setIsOpen(false);
        // Refresh page or redirect to Day 1
        window.location.href = '/day/1';
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 relative"
        >
          {/* Top Petal Decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-sakura/5 rounded-full blur-3xl pointer-events-none" />

          {/* Stepper Indicators */}
          <div className="flex gap-2 justify-center select-none">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300
                  ${step === i ? 'w-8 bg-sakura' : 'w-2 bg-border'}`}
              />
            ))}
          </div>

          <div className="min-h-[220px] flex flex-col justify-center">
            {/* Step 1: Welcome */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3 text-center"
              >
                <div className="w-12 h-12 bg-sakura/10 text-sakura rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <h2 className="font-display font-black text-2xl text-ink">
                  Welcome, {displayName}! 🌸
                </h2>
                <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto font-medium">
                  Welcome to Sakura English Journey! Let's tailor your stationery notebook experience before we begin.
                </p>
              </motion.div>
            )}

            {/* Step 2: Language Preference */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-center"
              >
                <h2 className="font-display font-black text-xl text-ink">
                  Choose your language / 言語設定
                </h2>
                <p className="text-xs text-ink-muted font-medium">
                  You can change this setting at any time in your Settings page.
                </p>

                <div className="flex gap-4 justify-center pt-2 max-w-xs mx-auto">
                  <button
                    onClick={() => setLang('en')}
                    className={`flex-1 py-3 px-4 rounded-2xl border text-sm font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5
                      ${lang === 'en' ? 'border-sakura bg-sakura/5 text-sakura-deep shadow-sm' : 'border-border text-ink-muted hover:border-sakura'}`}
                  >
                    <span className="text-2xl">🇬🇧</span>
                    <span>English</span>
                  </button>

                  <button
                    onClick={() => setLang('ja')}
                    className={`flex-1 py-3 px-4 rounded-2xl border text-sm font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5
                      ${lang === 'ja' ? 'border-sakura bg-sakura/5 text-sakura-deep shadow-sm' : 'border-border text-ink-muted hover:border-sakura'}`}
                  >
                    <span className="text-2xl">🇯🇵</span>
                    <span>日本語</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Theme Selector */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-center"
              >
                <h2 className="font-display font-black text-xl text-ink">
                  Select Theme / テーマの選択
                </h2>
                <p className="text-xs text-ink-muted font-medium">
                  Personalize the background look of your stationery journal.
                </p>

                <div className="grid grid-cols-3 gap-3 pt-2 select-none">
                  {[
                    { id: 'light', name: 'Light', icon: Sun },
                    { id: 'dark', name: 'Dark', icon: Moon },
                    { id: 'system', name: 'System', icon: Laptop }
                  ].map((t) => {
                    const Icon = t.icon;
                    const isActive = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`py-3.5 px-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-2
                          ${isActive ? 'border-sakura bg-sakura/5 text-sakura-deep' : 'border-border text-ink-muted hover:border-sakura'}`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 4: Ready to Start */}
            {step === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3 text-center"
              >
                <div className="w-12 h-12 bg-matcha/10 text-matcha rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h2 className="font-display font-black text-2xl text-ink">
                  You are all set! 🎏
                </h2>
                <p className="text-sm text-ink-muted leading-relaxed font-medium">
                  Your 90-day learning curriculum is prepared. Day 1 is waiting for you.
                </p>
              </motion.div>
            )}
          </div>

          {/* Stepper Buttons */}
          <div className="flex justify-between items-center pt-2">
            {step > 1 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                className="border-border text-ink-muted rounded-xl cursor-pointer font-bold"
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                size="sm"
                onClick={nextStep}
                className="bg-sakura hover:bg-sakura-deep/95 text-white dark:text-bg rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFinish}
                disabled={submitting}
                className="bg-matcha hover:bg-matcha/90 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? 'Preparing...' : "Let's Go / はじめよう"}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
