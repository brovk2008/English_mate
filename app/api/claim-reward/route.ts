import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { awardXP } from '@/lib/award-xp';
import { DAILY_REWARD_CYCLE } from '@/data/daily_rewards';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { localDate } = await request.json();
    if (!localDate) {
      return NextResponse.json({ error: 'Missing local date' }, { status: 400 });
    }

    // Check if a reward row already exists for this user on this localDate
    const { data: existingReward } = await supabase
      .from('daily_rewards')
      .select('*')
      .eq('user_id', user.id)
      .eq('reward_date', localDate)
      .maybeSingle();

    if (existingReward) {
      if (existingReward.claimed) {
        return NextResponse.json({ success: true, reward: existingReward, alreadyClaimed: true });
      }
      
      // If it exists but unclaimed, claim it now
      const result = await claimRewardDetails(supabase, user.id, existingReward);
      return NextResponse.json({ success: true, reward: result, claimedNow: true });
    }

    // Determine cycle day based on total completed cycles
    const { count } = await supabase
      .from('daily_rewards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const totalClaims = count || 0;
    const cycleDay = (totalClaims % 7) + 1;
    const config = DAILY_REWARD_CYCLE.find(item => item.day === cycleDay) || DAILY_REWARD_CYCLE[0];

    // Create reward row
    const newReward = {
      user_id: user.id,
      reward_date: localDate,
      reward_type: config.type,
      reward_value: config.value,
      claimed: false
    };

    const { data: insertedReward, error: insertError } = await supabase
      .from('daily_rewards')
      .insert(newReward)
      .select('*')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Claim reward details
    const result = await claimRewardDetails(supabase, user.id, insertedReward);
    return NextResponse.json({ success: true, reward: result, claimedNow: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function claimRewardDetails(supabase: any, userId: string, reward: any) {
  // Update claimed status
  const { data: updatedReward } = await supabase
    .from('daily_rewards')
    .update({
      claimed: true,
      claimed_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('reward_date', reward.reward_date)
    .select('*')
    .single();

  const type = reward.reward_type;
  const val = reward.reward_value;

  if (type === 'xp') {
    await awardXP(userId, 'bonus_challenge', val); // Award direct XP using general config
  } else if (type === 'streak_freeze') {
    // Increment streak freeze shields in streak_data
    const { data: streak } = await supabase
      .from('streak_data')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (streak) {
      await supabase
        .from('streak_data')
        .update({ freezes_available: (streak.freezes_available || 0) + val })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('streak_data')
        .insert({
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          freezes_available: val,
          last_completed_date: null
        });
    }
  } else if (type === 'card_pack') {
    // Add 5 words from the library/vocabulary not yet learned or reviewable
    const { data: vocabMatch } = await supabase
      .from('vocab_words')
      .select('word_index')
      .order('word_index', { ascending: true });

    const { data: userProgress } = await supabase
      .from('user_vocab_progress')
      .select('word_index')
      .eq('user_id', userId);

    const ownedIndices = new Set((userProgress || []).map((p: any) => p.word_index));
    const unownedWords = (vocabMatch || []).filter((w: any) => !ownedIndices.has(w.word_index));
    
    // Take 5 random words
    const shuffled = unownedWords.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, val);
    
    if (selected.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const batch = selected.map((w: any) => ({
        user_id: userId,
        word_index: w.word_index,
        learned: false,
        due_date: tomorrowStr,
        review_count: 0,
        interval: 1,
        ease_factor: 2.5
      }));

      await supabase.from('user_vocab_progress').insert(batch);
    }
  }

  return updatedReward;
}
