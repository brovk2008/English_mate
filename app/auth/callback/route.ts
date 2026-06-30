import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/home';

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      const { user } = data;
      
      // Lazily check if user profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        const isTeacher = user.email === process.env.NEXT_PUBLIC_TEACHER_EMAIL;
        
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email!,
          display_name: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0],
          avatar_url: user.user_metadata.avatar_url,
          role: isTeacher ? 'teacher' : 'student',
          start_date: new Date().toISOString().split('T')[0], // Anchor Day 1 to today
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
