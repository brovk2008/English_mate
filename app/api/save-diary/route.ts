import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
