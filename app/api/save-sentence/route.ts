import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { dayNumber, mode, correct, attempts } = await request.json();

    if (dayNumber === undefined || !mode || correct === undefined) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('sentence_results')
      .insert({
        user_id: user.id,
        day_number: dayNumber,
        mode,
        correct,
        attempts: attempts || 1
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
