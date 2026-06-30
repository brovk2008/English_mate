'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

interface DailyNudgeProps {
  isCompleted: boolean;
}

export default function DailyNudge({ isCompleted }: DailyNudgeProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show nudge if day is incomplete AND local time is after 6:00 PM (18:00)
    const hour = new Date().getHours();
    if (!isCompleted && hour >= 18) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [isCompleted]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full bg-gold/10 border border-gold/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gold/15 text-gold rounded-full flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-ink tracking-wide">
              がんばって (Ganbatte)! 🌸
            </h4>
            <p className="text-[11px] text-ink-muted leading-normal mt-0.5 font-medium">
              It is past 6:00 PM. Complete today's mission checklist now to protect your learning streak!
            </p>
          </div>
        </div>

        <button
          onClick={() => setShow(false)}
          className="text-ink-muted/50 hover:text-ink p-1 rounded-lg transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
