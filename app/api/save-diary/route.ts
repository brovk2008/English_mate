import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { awardXP } from '@/lib/award-xp';

export async function POST(request: Request) {
  try {
    const text = await request.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { dayNumber, userId, diaryText } = body;

    if (!userId || !dayNumber) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Count words
    const words = diaryText ? diaryText.trim().split(/\s+/).filter(Boolean).length : 0;
    
    const { error } = await supabase
      .from('user_day_progress')
      .upsert({
        user_id: userId,
        day_number: Number(dayNumber),
        diary_text: diaryText,
        diary_word_count: words,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,day_number' });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Award XP
    let diaryXP = 25; // base diary_written
    const wordsOver = Math.max(0, words - 80);
    const wordsBonus = Math.min(20, Math.floor(wordsOver / 10)); // 1 per 10 words, max 20

    await awardXP(userId, 'diary_written', diaryXP, Number(dayNumber));
    if (wordsBonus > 0) {
      await awardXP(userId, 'diary_bonus_words', wordsBonus, Number(dayNumber));
    }

    return NextResponse.json({ success: true, words, xpEarned: diaryXP + wordsBonus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
