import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { awardXP } from '@/lib/award-xp';
import { XP_VALUES } from '@/lib/xp';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { source, amount, dayNumber } = await request.json();

    if (!source || !(source in XP_VALUES)) {
      return NextResponse.json({ error: 'Invalid XP source' }, { status: 400 });
    }

    const result = await awardXP(user.id, source, amount, dayNumber);

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
