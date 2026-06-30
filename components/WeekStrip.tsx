'use client';

import Link from 'next/link';

interface DayProgress {
  day_number: number;
  vocab_done: boolean;
  grammar_done: boolean;
  song_done: boolean;
  listening_done: boolean;
  writing_done: boolean;
  speaking_done: boolean;
}

interface WeekStripProps {
  currentDay: number;
  weekProgress: DayProgress[];
}

export default function WeekStrip({ currentDay, weekProgress }: WeekStripProps) {
  // Determine current week number (1-based, 7 days per week)
  const currentWeek = Math.ceil(currentDay / 7);
  const startDay = (currentWeek - 1) * 7 + 1;

  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const dayNum = startDay + i;
    const progress = weekProgress.find((p) => p.day_number === dayNum);
    
    const isCompleted =
      progress &&
      progress.vocab_done &&
      progress.grammar_done &&
      progress.song_done &&
      progress.listening_done &&
      progress.writing_done &&
      progress.speaking_done;

    const isCurrent = dayNum === currentDay;
    const isPast = dayNum < currentDay;

    let status: 'completed' | 'current' | 'future' | 'incomplete_past' = 'future';
    if (isCompleted) {
      status = 'completed';
    } else if (isCurrent) {
      status = 'current';
    } else if (isPast) {
      status = 'incomplete_past';
    }

    return {
      dayNum,
      status,
    };
  });

  const getPetalStyles = (status: 'completed' | 'current' | 'future' | 'incomplete_past') => {
    switch (status) {
      case 'completed':
        return {
          fill: 'fill-sakura text-sakura-deep',
          stroke: 'stroke-sakura-deep/40',
          wrapperClass: 'shadow-sm bg-sakura/5 border-sakura/20',
        };
      case 'current':
        return {
          fill: 'fill-none text-sakura',
          stroke: 'stroke-sakura stroke-[2px] animate-pulse',
          wrapperClass: 'ring-2 ring-sakura/30 shadow-[0_0_12px_rgba(232,166,184,0.3)] bg-sakura/5 border-sakura/30',
        };
      case 'incomplete_past':
        return {
          fill: 'fill-none text-ink-muted/30',
          stroke: 'stroke-ink-muted/30 stroke-[1.5px]',
          wrapperClass: 'border-border bg-ink/5',
        };
      case 'future':
      default:
        return {
          fill: 'fill-none text-ink-muted/20',
          stroke: 'stroke-border stroke-[1.5px]',
          wrapperClass: 'border-border bg-card',
        };
    }
  };

  const getWeekdayLabel = (index: number) => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return labels[index];
  };

  return (
    <div className="w-full bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
        <h3 className="font-display font-bold text-lg text-ink">
          Week {currentWeek} Curriculum
        </h3>
        <span className="text-xs text-ink-muted">
          Days {startDay} - {Math.min(90, startDay + 6)}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {daysOfWeek.map(({ dayNum, status }, idx) => {
          const { fill, stroke, wrapperClass } = getPetalStyles(status);
          const isInteractive = dayNum <= Math.min(90, currentDay);

          const petalSVG = (
            <svg
              viewBox="0 0 100 100"
              className={`w-10 h-10 sm:w-12 sm:h-12 ${fill} transition-transform duration-200`}
            >
              {/* Sakura petal custom path with top notch */}
              <path
                d="M50 25 C 55 15, 65 10, 75 25 C 90 45, 80 75, 50 95 C 20 75, 10 45, 25 25 C 35 10, 45 15, 50 25 Z"
                className={stroke}
              />
              
              {/* If incomplete past, draw a subtle cross in the center */}
              {status === 'incomplete_past' && (
                <path
                  d="M42 42 L58 58 M58 42 L42 58"
                  className="stroke-ink-muted/50 stroke-[2px] stroke-linecap-round"
                />
              )}

              {/* If completed, draw a small checkmark in the center */}
              {status === 'completed' && (
                <path
                  d="M40 50 L47 57 L60 43"
                  className="stroke-bg stroke-[2.5px] stroke-linecap-round stroke-linejoin-round fill-none"
                />
              )}

              {/* If current, draw a small pulsing dot in the center */}
              {status === 'current' && (
                <circle cx="50" cy="53" r="4" className="fill-sakura" />
              )}
            </svg>
          );

          return (
            <div key={dayNum} className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-ink-muted font-medium uppercase tracking-wider">
                {getWeekdayLabel(idx)}
              </span>

              {isInteractive ? (
                <Link
                  href={`/day/${dayNum}`}
                  className={`flex items-center justify-center rounded-xl p-1 border transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${wrapperClass}`}
                  title={`View Day ${dayNum}`}
                >
                  {petalSVG}
                </Link>
              ) : (
                <div
                  className={`flex items-center justify-center rounded-xl p-1 border pointer-events-none select-none ${wrapperClass}`}
                  title={`Day ${dayNum} (Locked)`}
                >
                  {petalSVG}
                </div>
              )}

              <span className="text-[10px] text-ink-muted font-bold">
                D{dayNum}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
