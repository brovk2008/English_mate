// components/LevelUpModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Award, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { playSound } from '@/lib/sounds';
import { getLevelFromXP, LEVELS } from '@/lib/xp';
import SakuraChan from './SakuraChan';
import ConfettiBurst from './ConfettiBurst';

interface LevelUpModalProps {
  userId: string;
  initialLevel: number;
  onClose: () => void;
}

export default function LevelUpModal({ userId, initialLevel, onClose }: LevelUpModalProps) {
  const [isOpen, setIsOpen] = useState(true);
  const currentLevelData = LEVELS.find(l => l.level === initialLevel) || LEVELS[0];
  const oldLevelData = LEVELS.find(l => l.level === initialLevel - 1) || LEVELS[0];

  useEffect(() => {
    playSound('levelup');

    // Clear level up pending state in DB
    const clearPending = async () => {
      const supabase = createClient();
      await supabase
        .from('profiles')
        .update({
          pending_levelup: false,
          pending_levelup_to: null
        })
        .eq('id', userId);
    };

    clearPending().catch(err => console.error('Failed to clear pending levelup:', err));
  }, [userId, initialLevel]);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-md">
          <ConfettiBurst />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="w-full max-w-md bg-card border border-border shadow-2xl rounded-3xl p-6 relative overflow-hidden flex flex-col items-center text-center"
          >
            {/* Background petal accents */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-sakura/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-sakura/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-5 h-5 text-sakura animate-bounce" />
              <span className="text-xs font-black tracking-widest text-sakura-deep uppercase font-mono">
                Level Up Celebration!
              </span>
              <Sparkles className="w-5 h-5 text-sakura animate-bounce" />
            </div>

            <h2 className="font-display font-black text-3xl text-ink leading-tight mb-4">
              ✨ LEVEL UP! ✨
            </h2>

            {/* Mascot */}
            <div className="my-3">
              <SakuraChan expression="surprised" size={100} />
            </div>

            {/* Level badge transition */}
            <div className="flex items-center justify-center gap-4 my-4">
              <div 
                className="px-4 py-2.5 rounded-2xl flex flex-col items-center justify-center font-bold"
                style={{ backgroundColor: `${oldLevelData.color}20`, border: `1px solid ${oldLevelData.color}60` }}
              >
                <span className="text-[10px] text-ink-muted uppercase">Level {oldLevelData.level}</span>
                <span className="text-sm text-ink">{oldLevelData.title}</span>
                <span className="text-xs text-ink-muted font-light">{oldLevelData.title_ja}</span>
              </div>
              
              <ArrowRight className="w-5 h-5 text-sakura animate-pulse" />

              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="px-5 py-3 rounded-2xl flex flex-col items-center justify-center font-bold shadow-md"
                style={{ backgroundColor: `${currentLevelData.color}30`, border: `2px solid ${currentLevelData.color}` }}
              >
                <span className="text-[10px] text-ink-muted uppercase">Level {currentLevelData.level}</span>
                <span className="text-base text-ink font-black">{currentLevelData.title}</span>
                <span className="text-xs text-ink-muted font-bold">{currentLevelData.title_ja}</span>
              </motion.div>
            </div>

            {/* Reward unlocked indicators */}
            <div className="w-full bg-background/50 border border-border/60 rounded-2xl p-4 my-3 text-left space-y-2.5">
              <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider block">
                Rewards Unlocked
              </span>
              <div className="flex items-start gap-2.5 text-xs text-ink">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">New Level Badge: {currentLevelData.title}</p>
                  <p className="text-ink-muted text-[10px]">Show off your new {currentLevelData.title_ja} status on the radar.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-ink">
                <Award className="w-4 h-4 text-sakura shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Unlocked Practice Boosts</p>
                  <p className="text-ink-muted text-[10px]">Your daily activity gains are growing. Keep blooming!</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full mt-4 py-3 bg-sakura hover:bg-sakura-deep text-white font-bold text-sm rounded-xl cursor-pointer shadow-lg hover:shadow-xl transition-all"
            >
              Keep Going! 🌸
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
