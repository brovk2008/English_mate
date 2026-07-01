// lib/xp.ts

export const XP_VALUES = {
  // Daily lesson
  vocab_word_learned:    5,    // per word (10 words = 50 XP)
  grammar_section_done:  20,
  song_section_done:     15,
  listening_done:        20,
  diary_written:         25,   // base
  diary_bonus_words:     1,    // per 10 words over target (max +20)
  speaking_done:         20,
  day_complete:          50,   // bonus for completing ALL 6 tasks
  
  // Vocab & study
  flashcard_mastered:    3,
  quiz_correct_answer:   5,
  quiz_perfect_score:    30,   // bonus for 10/10
  reading_complete:      20,
  sentence_correct:      10,
  conversation_done:     25,
  library_word_mastered: 4,
  pronunciation_pass:    8,
  
  // Streaks & milestones  
  streak_7_days:         100,
  streak_30_days:        500,
  streak_60_days:        1000,
  streak_90_days:        2000,
  homework_complete:     40,
  
  // Bonus
  early_bird:            15,   // complete lesson before 9am
  night_owl:             15,   // complete lesson after 10pm
  bonus_challenge:       20,
} as const;

export interface LevelData {
  level: number;
  title: string;
  title_ja: string;
  min_xp: number;
  color: string;
}

export const LEVELS: readonly LevelData[] = [
  { level: 1,  title: 'Seedling',       title_ja: '種',           min_xp: 0,     color: '#86EFAC' },
  { level: 2,  title: 'Sprout',         title_ja: '芽',           min_xp: 200,   color: '#6EE7B7' },
  { level: 3,  title: 'Bud',            title_ja: 'つぼみ',       min_xp: 500,   color: '#5EEAD4' },
  { level: 4,  title: 'Blossom',        title_ja: '花びら',       min_xp: 1000,  color: '#F9A8D4' },
  { level: 5,  title: 'Petal',          title_ja: '花',           min_xp: 2000,  color: '#F472B6' },
  { level: 6,  title: 'Branch',         title_ja: '枝',           min_xp: 3500,  color: '#C084FC' },
  { level: 7,  title: 'Cherry Tree',    title_ja: '桜の木',       min_xp: 5500,  color: '#818CF8' },
  { level: 8,  title: 'Full Bloom',     title_ja: '満開',         min_xp: 8000,  color: '#60A5FA' },
  { level: 9,  title: 'Sakura Storm',   title_ja: '桜吹雪',       min_xp: 11000, color: '#FB923C' },
  { level: 10, title: 'Sakura Master',  title_ja: 'さくらマスター', min_xp: 15000, color: '#FBBF24' },
] as const;

export function getLevelFromXP(xp: number): LevelData {
  return [...LEVELS].reverse().find(l => xp >= l.min_xp) ?? LEVELS[0];
}

export function getProgressToNextLevel(xp: number): number {
  const current = getLevelFromXP(xp);
  const next = LEVELS.find(l => l.level === current.level + 1);
  if (!next) return 100; // already max level
  const range = next.min_xp - current.min_xp;
  const progress = xp - current.min_xp;
  return Math.max(0, Math.min(100, Math.round((progress / range) * 100)));
}
