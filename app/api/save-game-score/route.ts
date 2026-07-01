import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { awardXP } from '@/lib/award-xp';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameId, score, metadata, xpEarned } = await request.json();

    if (!gameId || score === undefined || xpEarned === undefined) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Insert game score log
    const { error: dbErr } = await supabase
      .from('game_scores')
      .insert({
        user_id: user.id,
        game_id: gameId,
        score: Number(score),
        metadata: metadata || {},
        xp_earned: Number(xpEarned)
      });

    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    // 2. Award XP to profile
    let awardResult = null;
    if (xpEarned > 0) {
      awardResult = await awardXP(user.id, 'bonus_challenge', Number(xpEarned));
    }

    return NextResponse.json({
      success: true,
      score,
      xpEarned,
      awardResult
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
