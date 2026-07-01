import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { awardXP } from '@/lib/award-xp';

export async function POST(request: Request) {
  try {
    const { score, total, wrongWords, dayNumber } = await request.json();

    if (score === undefined || total === undefined || !Array.isArray(wrongWords)) {
      return NextResponse.json({ error: 'Missing quiz parameters' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Insert quiz results
    const { error: insertError } = await supabase
      .from('quiz_results')
      .insert({
        user_id: user.id,
        day_number: dayNumber || null,
        score,
        total,
        wrong_words: wrongWords
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 2. For each wrong word, reset its spaced repetition due_date to tomorrow (so they review it immediately)
    if (wrongWords.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Fetch existing SRS states to preserve ease factor but reset due date and intervals
      const { data: existingProgress } = await supabase
        .from('user_vocab_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('word_index', wrongWords);

      const updates = wrongWords.map(wordIndex => {
        const exist = existingProgress?.find(e => e.word_index === wordIndex);
        return {
          user_id: user.id,
          word_index: wordIndex,
          learned: false, // Mark as unlearned so they review again
          due_date: tomorrowStr,
          review_count: 0, // Reset repetition count
          interval: 1, // Reset interval to 1 day
          ease_factor: exist?.ease_factor || 2.5
        };
      });

      const { error: updateError } = await supabase
        .from('user_vocab_progress')
        .upsert(updates, { onConflict: 'user_id,word_index' });

      if (updateError) {
        console.error('Failed to update SRS parameters for wrong words:', updateError.message);
      }
    }

    // 3. Award XP
    const correctXP = score * 5; // 5 XP per correct answer
    let totalXPAwarded = correctXP;

    if (correctXP > 0) {
      await awardXP(user.id, 'quiz_correct_answer', correctXP, dayNumber || null);
    }
    
    if (score === total && total > 0) {
      const perfectXP = 30; // perfect score bonus
      await awardXP(user.id, 'quiz_perfect_score', perfectXP, dayNumber || null);
      totalXPAwarded += perfectXP;
    }

    return NextResponse.json({ success: true, xpEarned: totalXPAwarded });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
