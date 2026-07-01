// data/daily_rewards.ts

export interface RewardItem {
  day: number;
  type: 'xp' | 'streak_freeze' | 'card_pack' | 'sakura_petal';
  value: number;
  label: string;
}

export const DAILY_REWARD_CYCLE: readonly RewardItem[] = [
  { day: 1, type: 'xp',            value: 50,  label: '+50 XP' },
  { day: 2, type: 'streak_freeze', value: 1,   label: 'Shield' },
  { day: 3, type: 'xp',            value: 20,  label: '+20 XP' },
  { day: 4, type: 'card_pack',     value: 5,   label: '5 Words' },
  { day: 5, type: 'xp',            value: 75,  label: '+75 XP' },
  { day: 6, type: 'sakura_petal',  value: 1,   label: 'Petal' },
  { day: 7, type: 'xp',            value: 150, label: '+150 XP' },
] as const;
