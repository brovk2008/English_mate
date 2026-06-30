/**
 * Spaced Repetition SuperMemo-2 (SM-2) Algorithm Implementation
 * 
 * Review scores:
 * 1 = Forgot (swipe left)
 * 5 = Easy / Got it (swipe right)
 */
export function calculateSM2(
  score: number,
  repetitions: number,
  previousInterval: number,
  easeFactor: number
) {
  let nextRepetitions = repetitions;
  let nextInterval = 1;
  let nextEaseFactor = easeFactor;

  if (score < 3) {
    nextRepetitions = 0;
    nextInterval = 1;
  } else {
    if (repetitions === 0) {
      nextInterval = 1;
      nextRepetitions = 1;
    } else if (repetitions === 1) {
      nextInterval = 3;
      nextRepetitions = 2;
    } else if (repetitions === 2) {
      nextInterval = 6;
      nextRepetitions = 3;
    } else {
      nextInterval = Math.round(previousInterval * easeFactor);
      nextRepetitions = repetitions + 1;
    }

    // ease_factor = ease_factor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02))
    nextEaseFactor = easeFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    if (nextEaseFactor < 1.3) {
      nextEaseFactor = 1.3;
    }
  }

  // Calculate due date (local date plus interval days)
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + nextInterval);
  const formattedDueDate = nextDueDate.toISOString().split('T')[0];

  return {
    repetitions: nextRepetitions,
    interval: nextInterval,
    easeFactor: parseFloat(nextEaseFactor.toFixed(2)),
    dueDate: formattedDueDate,
  };
}
