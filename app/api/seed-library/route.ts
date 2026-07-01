import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import wordLibrary from '@/data/word_library.json';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({
      error: "Supabase environment credentials missing."
    }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    const { error } = await supabase
      .from('word_library')
      .upsert(wordLibrary, { onConflict: 'word' });

    if (error) {
      throw new Error(`Word Library seed error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      count: wordLibrary.length
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message
    }, { status: 500 });
  }
}
