'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg text-ink">
      <div className="relative flex flex-col items-center gap-4">
        {/* Spinning Sakura flower */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="w-16 h-16 text-sakura fill-current"
        >
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path d="M12 2C12 2 13.5 7 17.5 7C21.5 7 21.5 11 17.5 11C13.5 11 12 16 12 16C12 16 10.5 11 6.5 11C2.5 11 2.5 7 6.5 7C10.5 7 12 2 12 2Z" />
          </svg>
        </motion.div>
        
        {/* Pulsing loading subtitle */}
        <motion.span
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="font-display font-bold text-xs tracking-widest text-ink-muted uppercase select-none"
        >
          Loading Journey...
        </motion.span>
      </div>
    </div>
  );
}
