export interface Badge {
  id: string;
  name: string;
  name_ja: string;
  description: string;
  description_ja: string;
  icon: string;
}

export const BADGES: Badge[] = [
  {
    id: 'first_step',
    name: 'First Step',
    name_ja: '第一歩',
    description: 'Completed your first daily learning mission.',
    description_ja: '最初の毎日の学習ミッションを完了しました。',
    icon: '🌱'
  },
  {
    id: 'streak_3',
    name: 'Streak Builder',
    name_ja: '三日坊主克服',
    description: 'Maintained a 3-day learning streak.',
    description_ja: '3日間の学習継続ストリークを達成しました。',
    icon: '🔥'
  },
  {
    id: 'vocab_master',
    name: 'Vocab Master',
    name_ja: '単語マスター',
    description: 'Mastered 10 or more vocabulary words.',
    description_ja: '10個以上の英単語をマスターしました。',
    icon: '📖'
  },
  {
    id: 'quiz_ace',
    name: 'Quiz Ace',
    name_ja: 'クイズの達人',
    description: 'Scored 10/10 on a vocabulary quiz.',
    description_ja: '単語クイズで10点満点を獲得しました。',
    icon: '🎯'
  },
  {
    id: 'writing_guru',
    name: 'Writing Guru',
    name_ja: '日記の達人',
    description: 'Submitted 5 or more daily English diaries.',
    description_ja: '5回以上英語の日記を提出しました。',
    icon: '✍️'
  },
  {
    id: 'speaking_star',
    name: 'Speaking Star',
    name_ja: 'スピーキングスター',
    description: 'Completed 3 or more roleplay conversations.',
    description_ja: '3回以上の英会話ロールプレイを完了しました。',
    icon: '⭐'
  }
];

export async function checkAchievements(userId: string, supabase: any): Promise<string[]> {
  try {
    const newlyEarned: string[] = [];

    // 1. Fetch already earned badge IDs to prevent duplicates
    const { data: earnedRows } = await supabase
      .from('achievements')
      .select('badge_id')
      .eq('user_id', userId);

    const earnedIds = new Set<string>((earnedRows || []).map((r: any) => r.badge_id));

    // 2. Fetch user data needed for checks
    // Check 1: Completed days count
    const { count: completedDays } = await supabase
      .from('user_day_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('vocab_done', true)
      .eq('grammar_done', true)
      .eq('song_done', true)
      .eq('listening_done', true)
      .eq('writing_done', true)
      .eq('speaking_done', true);

    // Check 2: Streak info
    const { data: streakData } = await supabase
      .from('streak_data')
      .select('current_streak')
      .eq('user_id', userId)
      .maybeSingle();

    // Check 3: Mastered vocabulary words count
    const { count: masteredVocab } = await supabase
      .from('user_vocab_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('learned', true);

    // Check 4: Perfect quiz scores count
    const { count: perfectQuizzes } = await supabase
      .from('quiz_results')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('score', 10);

    // Check 5: Written diaries count (diary_text not empty)
    const { count: writtenDiaries } = await supabase
      .from('user_day_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('diary_text', '');

    // Check 6: Completed conversations count
    const { count: completedConvs } = await supabase
      .from('conversation_progress')
      .select('user_id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 3. Evaluate rules
    // Rule: First Step
    if (!earnedIds.has('first_step') && (completedDays || 0) >= 1) {
      newlyEarned.push('first_step');
    }

    // Rule: Streak 3
    if (!earnedIds.has('streak_3') && (streakData?.current_streak || 0) >= 3) {
      newlyEarned.push('streak_3');
    }

    // Rule: Vocab Master
    if (!earnedIds.has('vocab_master') && (masteredVocab || 0) >= 10) {
      newlyEarned.push('vocab_master');
    }

    // Rule: Quiz Ace
    if (!earnedIds.has('quiz_ace') && (perfectQuizzes || 0) >= 1) {
      newlyEarned.push('quiz_ace');
    }

    // Rule: Writing Guru
    if (!earnedIds.has('writing_guru') && (writtenDiaries || 0) >= 5) {
      newlyEarned.push('writing_guru');
    }

    // Rule: Speaking Star
    if (!earnedIds.has('speaking_star') && (completedConvs || 0) >= 3) {
      newlyEarned.push('speaking_star');
    }

    // 4. Save newly earned achievements to Supabase
    if (newlyEarned.length > 0) {
      const inserts = newlyEarned.map((badgeId) => ({
        user_id: userId,
        badge_id: badgeId
      }));

      const { error: insertError } = await supabase
        .from('achievements')
        .insert(inserts);

      if (insertError) {
        console.error('Error inserting earned achievements:', insertError.message);
        return [];
      }
    }

    return newlyEarned;
  } catch (err) {
    console.error('Error checking achievements:', err);
    return [];
  }
}
