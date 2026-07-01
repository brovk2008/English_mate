import { createClient } from '@/lib/supabase/server';
import { getLevelFromXP, XP_VALUES } from '@/lib/xp';

export async function awardXP(
  userId: string, 
  source: keyof typeof XP_VALUES, 
  amount?: number,
  dayNumber?: number
): Promise<{ newXP: number; leveledUp: boolean; newLevel?: any }> {
  const supabase = await createClient();
  const xpAmount = amount ?? XP_VALUES[source];
  
  // Log the XP
  await supabase.from('xp_log').insert({
    user_id: userId,
    amount: xpAmount,
    source,
    day_number: dayNumber || null,
  });
  
  // Get current total
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp, level')
    .eq('id', userId)
    .single();
  
  const oldXP = profile?.total_xp ?? 0;
  const oldLevel = profile?.level ?? 1;
  const newXP = oldXP + xpAmount;
  const newLevelData = getLevelFromXP(newXP);
  const leveledUp = newLevelData.level > oldLevel;
  
  // Update profile
  const updatePayload: any = {
    total_xp: newXP,
    level: newLevelData.level,
    level_title: newLevelData.title
  };
  
  if (leveledUp) {
    updatePayload.pending_levelup = true;
    updatePayload.pending_levelup_to = newLevelData.level;
  }
  
  await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId);
  
  return { newXP, leveledUp, newLevel: leveledUp ? newLevelData : undefined };
}
