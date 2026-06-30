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
    <main className="flex-1 flex flex-col justify-center items-center px-4 relative overflow-hidden bg-bg text-ink">
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-sakura/10 rounded-full blur-3xl pointer-events-none dark:bg-sakura/5" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-matcha/5 rounded-full blur-3xl pointer-events-none" />

      {/* Landing Card */}
      <div className="w-full max-w-md z-10">
        <Card className="border border-border bg-card/85 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden p-6 sm:p-8">
          <CardContent className="flex flex-col items-center text-center p-0">
            {/* SVG Sakura Logo */}
            <div className="w-14 h-14 bg-sakura/10 rounded-full flex items-center justify-center mb-6">
              <svg
                viewBox="0 0 24 24"
                className="w-8 h-8 text-sakura fill-current animate-pulse"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12.0003 2.0005C12.0003 2.0005 13.9998 7.0002 18.0003 7.0002C22.0008 7.0002 22.0008 12.0001 18.0003 12.0001C13.9998 12.0001 12.0003 17.0008 12.0003 17.0008C12.0003 17.0008 10.0008 12.0001 6.00028 12.0001C1.99978 12.0001 1.99978 7.0002 6.00028 7.0002C10.0008 7.0002 12.0003 2.0005 12.0003 2.0005Z" />
              </svg>
            </div>

            {/* Wordmark and Tagline */}
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-wide text-ink mb-1">
              Sakura English
            </h1>
            <div className="w-24 h-[1px] bg-gold mb-4" />
            <p className="font-body text-base text-ink-muted mb-8 max-w-[280px]">
              90 days. One mission a day.<br />
              <span className="font-medium text-ink">Real progress.</span>
            </p>

            {/* Login button */}
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 bg-sakura hover:bg-sakura-deep/90 text-white dark:text-bg font-body font-medium text-base rounded-xl transition-all duration-200 shadow-sm flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
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
            
            <p className="text-[10px] text-ink-muted mt-3">
              Day 1 starts the moment you sign in.
            </p>

            {/* SVG Petal Divider */}
            <div className="flex items-center gap-2 my-8 text-sakura/30">
              <span className="w-12 h-[1px] bg-border" />
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12,2A10,10,0,0,0,2,12c0,5.52,6.5,10,10,10s10-4.48,10-10A10,10,0,0,0,12,2Z" />
              </svg>
              <span className="w-12 h-[1px] bg-border" />
            </div>

            {/* Japanese Quote Card */}
            <blockquote className="border-l-2 border-sakura pl-4 py-1 text-left">
              <p className="font-display italic text-base text-ink font-semibold">
                「 Learning is a blossom that opens over time. 」
              </p>
            </blockquote>
          </CardContent>
        </Card>
      </div>

      <footer className="absolute bottom-6 font-body text-[10px] text-ink-muted tracking-wider">
        © 2026 SAKURA ENGLISH JOURNEY
      </footer>
    </main>
  );
}
