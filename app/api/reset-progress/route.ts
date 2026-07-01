import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Delete rows from progress tracking tables
    await supabase.from('user_day_progress').delete().eq('user_id', user.id);
    await supabase.from('user_vocab_progress').delete().eq('user_id', user.id);
    await supabase.from('streak_data').delete().eq('user_id', user.id);
    await supabase.from('reading_progress').delete().eq('user_id', user.id);
    await supabase.from('quiz_results').delete().eq('user_id', user.id);
    await supabase.from('conversation_progress').delete().eq('user_id', user.id);
    await supabase.from('sentence_results').delete().eq('user_id', user.id);
    await supabase.from('achievements').delete().eq('user_id', user.id);

    // 2. Reset profiles.start_date to today and onboarded back to false (so they can go through the tutorial again)
    const todayStr = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('profiles')
      .update({
        start_date: todayStr,
        onboarded: false,
        lang: 'en'
      })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
