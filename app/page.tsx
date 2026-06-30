'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function LandingPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error logging in:', err);
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col justify-center items-center px-4 relative overflow-hidden bg-gradient-to-tr from-[#FAF6F1] via-[#FDF9F6] to-[#FAF1F3]">
      {/* Decorative background floral circles / sakura shape */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#E8A6B8]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-[#5B7F6B]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md z-10">
        <Card className="border border-[#E8E2D9] bg-white/70 backdrop-blur-md shadow-[0_8px_30px_rgb(232,166,184,0.06)] rounded-2xl overflow-hidden p-6 sm:p-8">
          <CardContent className="flex flex-col items-center text-center p-0">
            {/* Sakura petal SVG brand mark */}
            <div className="w-16 h-16 bg-[#E8A6B8]/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <svg
                viewBox="0 0 24 24"
                className="w-8 h-8 text-[#E8A6B8] fill-current"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12,2A10,10,0,0,0,2,12c0,5.52,6.5,10,10,10s10-4.48,10-10A10,10,0,0,0,12,2Zm0,18c-2.48,0-7.3-3.08-8-7.25a6,6,0,0,1,11.31-3,6,6,0,0,1,4.69,3C19.3,16.92,14.48,20,12,20Z" />
              </svg>
            </div>

            {/* Wordmark and Tagline */}
            <h1 className="font-heading text-4xl sm:text-5xl font-semibold tracking-wide text-[#33312E] mb-3">
              Sakura English
            </h1>
            <p className="font-serif italic text-lg sm:text-xl text-[#73706B] mb-8 max-w-[280px]">
              90 days. One mission a day. Real progress.
            </p>

            {/* Login button */}
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 bg-[#E8A6B8] hover:bg-[#E293A7] active:bg-[#D57F95] text-white font-sans font-medium text-base rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {/* Inline Google Icon */}
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Subtle footer */}
      <footer className="absolute bottom-6 font-sans text-xs text-[#73706B]/50 tracking-wider">
        © 2026 SAKURA ENGLISH JOURNEY
      </footer>
    </main>
  );
}
