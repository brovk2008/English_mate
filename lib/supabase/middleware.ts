import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT remove this. This refreshes the session if expired.
  const { data: { user } } = await supabase.auth.getUser();

  // Handle route protection and email checks for the teacher role
  const url = request.nextUrl.clone();
  
  if (url.pathname === '/') {
    // If logged in, redirect '/' (landing page) to '/home'
    if (user) {
      url.pathname = '/home';
      return NextResponse.redirect(url);
    }
  } else {
    // If not logged in and accessing protected pages, redirect to '/'
    if (!user) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Teacher check
    if (url.pathname.startsWith('/teacher')) {
      const teacherEmail = process.env.NEXT_PUBLIC_TEACHER_EMAIL;
      if (user.email !== teacherEmail) {
        url.pathname = '/home';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
