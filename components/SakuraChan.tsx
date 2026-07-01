// components/SakuraChan.tsx
'use client';

import { motion } from 'framer-motion';

export interface SakuraChanProps {
  expression?: 'happy' | 'surprised' | 'proud' | 'sleepy';
  size?: number;
  animate?: boolean;
}

export function SakuraChan({ 
  expression = 'happy',
  size = 80,
  animate = true 
}: SakuraChanProps) {
  const containerVariants = {
    idle: {
      y: [0, -4, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut' as const
      }
    },
    static: { y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      animate={animate ? 'idle' : 'static'}
      style={{ width: size, height: size }}
      className="inline-block select-none"
    >
      <svg width="100%" height="100%" viewBox="0 0 100 100" className="drop-shadow-sm">
        {/* 5 petals around center */}
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <ellipse
            key={i}
            cx={50 + 22 * Math.cos((angle * Math.PI) / 180)}
            cy={50 + 22 * Math.sin((angle * Math.PI) / 180)}
            rx="14" ry="10"
            transform={`rotate(${angle}, ${50 + 22 * Math.cos((angle * Math.PI) / 180)}, ${50 + 22 * Math.sin((angle * Math.PI) / 180)})`}
            fill="#F9A8D4"
            opacity="0.9"
          />
        ))}
        {/* Center circle - face */}
        <circle cx="50" cy="50" r="20" fill="#FDE8EE" stroke="#F472B6" strokeWidth="1.5" />
        
        {/* Eyes */}
        {expression === 'sleepy' ? (
          <>
            <path d="M43 48 Q45 46 47 48" stroke="#7C3AED" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M53 48 Q55 46 57 48" stroke="#7C3AED" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="44" cy="48" r="2.5" fill="#4C1D95" />
            <circle cx="56" cy="48" r="2.5" fill="#4C1D95" />
            {(expression === 'happy' || expression === 'proud') && (
              <>
                <circle cx="45" cy="47" r="0.8" fill="white" />
                <circle cx="57" cy="47" r="0.8" fill="white" />
              </>
            )}
          </>
        )}
        
        {/* Mouth */}
        {expression === 'happy' && <path d="M45 54 Q50 58 55 54" stroke="#C4607E" strokeWidth="1.5" fill="none" strokeLinecap="round" />}
        {expression === 'proud' && <path d="M44 53 Q50 58 56 53" stroke="#C4607E" strokeWidth="2" fill="none" strokeLinecap="round" />}
        {expression === 'surprised' && <ellipse cx="50" cy="55" rx="4" ry="5" fill="#C4607E" />}
        {expression === 'sleepy' && <path d="M46 55 Q50 57 54 55" stroke="#C4607E" strokeWidth="1.5" fill="none" strokeLinecap="round" />}
        
        {/* Blush */}
        {(expression === 'happy' || expression === 'proud') && (
          <>
            <ellipse cx="38" cy="54" rx="5" ry="3" fill="#F9A8D4" opacity="0.6" />
            <ellipse cx="62" cy="54" rx="5" ry="3" fill="#F9A8D4" opacity="0.6" />
          </>
        )}
      </svg>
    </motion.div>
  );
}
export default SakuraChan;
