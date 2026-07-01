'use client';

import { Card } from '@/components/ui/card';
import grammarVisuals from '@/data/grammar_visuals.json';

interface GrammarVisualProps {
  topicKey: string;
}

export default function GrammarVisual({ topicKey }: GrammarVisualProps) {
  const normalizedKey = topicKey.toLowerCase().replace(/\s+/g, '_');
  
  // Find match, or fallback to present_perfect / passive_voice
  let data = (grammarVisuals as any)[normalizedKey];
  if (!data) {
    if (normalizedKey.includes('perfect')) {
      data = grammarVisuals.present_perfect;
    } else if (normalizedKey.includes('passive')) {
      data = grammarVisuals.passive_voice;
    } else if (normalizedKey.includes('past')) {
      data = grammarVisuals.past_simple;
    } else if (normalizedKey.includes('continuous')) {
      data = grammarVisuals.present_continuous;
    } else {
      data = grammarVisuals.present_simple; // default fallback
    }
  }

  return (
    <Card className="border border-border/80 bg-[#FAF6F1]/40 dark:bg-card/45 rounded-2xl p-5 select-none space-y-4">
      <div className="space-y-1 text-center">
        <span className="text-[9px] font-bold text-sakura-deep uppercase tracking-widest block">
          Structural Grammar Map
        </span>
        <h4 className="font-display font-extrabold text-sm text-ink">
          {data.title} Pattern
        </h4>
      </div>

      {/* Structural Colored Boxes */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {data.pattern.map((label: string, idx: number) => {
          const color = data.colors[idx] || '#6B7280';
          return (
            <div
              key={idx}
              style={{ borderColor: color, backgroundColor: `${color}0c` }}
              className="px-3.5 py-2.5 rounded-xl border flex flex-col items-center min-w-[75px]"
            >
              <span style={{ color: color }} className="text-[9px] font-extrabold tracking-wider uppercase block">
                {label}
              </span>
              <span className="text-xs font-bold text-ink mt-1 font-mono">
                {data.example[idx] || ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Examples subtext box */}
      <div className="bg-card border border-border/60 rounded-xl p-3 text-xs space-y-1.5 leading-relaxed font-medium">
        <div>
          🟢 <span className="font-bold text-ink-muted mr-1.5">Affirmative:</span>
          <span className="text-ink font-semibold">"{data.example.join(' ')}"</span>
        </div>
        <div>
          🔴 <span className="font-bold text-ink-muted mr-1.5">Negative:</span>
          <span className="text-ink font-semibold">"{data.negative.join(' ')}"</span>
        </div>
        <div>
          🔵 <span className="font-bold text-ink-muted mr-1.5">Question:</span>
          <span className="text-ink font-semibold">"{data.question.join(' ')}"</span>
        </div>
      </div>
    </Card>
  );
}
