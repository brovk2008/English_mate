import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/home';

  if (code) {
    try {
      const supabase = await createClient();
      const { error, data } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('OAuth Code Exchange Error:', error.message);
        throw error;
      }

      if (data.user) {
        const { user } = data;
        
        // Check if user profile exists
        const { data: profile, error: profileFetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (profileFetchError) {
          console.error('Error fetching student profile from Supabase:', profileFetchError.message);
          console.error('IMPORTANT: Did you execute the migration SQL from supabase/schema.sql?');
        }

        if (!profile && !profileFetchError) {
          const isTeacher = user.email === process.env.NEXT_PUBLIC_TEACHER_EMAIL;
          
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            email: user.email!,
            display_name: user.user_metadata.full_name || user.user_metadata.name || user.email?.split('@')[0],
            avatar_url: user.user_metadata.avatar_url,
            role: isTeacher ? 'teacher' : 'student',
            start_date: new Date().toISOString().split('T')[0], // Anchor Day 1 to today
          });

          if (insertError) {
            console.error('Error inserting student profile:', insertError.message);
          }
        }
      }
    } catch (err: any) {
      console.error('Unhandled callback error:', err?.message || err);
      // Redirect back to landing page with error parameter so it does not loop
      return NextResponse.redirect(`${origin}/?error=callback_failed`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
