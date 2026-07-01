// app/(student)/games/GamesHubClient.tsx
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Zap, Brain, Sparkles, Trophy, Gamepad2 } from 'lucide-react';

interface GamesHubClientProps {
  highScores: {
    word_blitz: number;
    sakura_match: number;
    scramble_sprint: number;
  };
}

export default function GamesHubClient({ highScores }: GamesHubClientProps) {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Back button */}
      <Link 
        href="/home" 
        className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-sakura transition-colors select-none"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="space-y-1.5">
        <h1 className="font-display font-black text-3xl text-ink leading-tight flex items-center gap-2">
          <Gamepad2 className="w-8 h-8 text-sakura animate-pulse" /> Learning Playroom
        </h1>
        <p className="text-sm text-ink-muted leading-relaxed max-w-xl">
          Boost your memory, master sentence syntax, and practice vocabulary through fun interactive games.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Game 1: Word Blitz */}
        <Card className="border border-border bg-card hover:shadow-md transition-all flex flex-col justify-between overflow-hidden rounded-2xl">
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2">
              <Zap size={20} className="animate-bounce" />
            </div>
            <CardTitle className="text-lg font-bold text-ink">Word Blitz</CardTitle>
            <CardDescription className="text-xs text-ink-muted">
              Speed translation challenge. Match falling English words with Japanese meanings before they hit the bottom!
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col gap-4">
            <div className="bg-background/50 border border-border/40 rounded-xl p-3 flex items-center justify-between text-xs font-semibold text-ink">
              <span className="flex items-center gap-1"><Trophy size={14} className="text-amber-500" /> High Score</span>
              <span className="font-mono text-sakura-deep text-sm">{highScores.word_blitz} pts</span>
            </div>
            <Link href="/games/word-blitz" className="w-full">
              <Button className="w-full bg-sakura hover:bg-sakura-deep text-white font-bold text-xs py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 border-none">
                <Play size={13} /> Play Game
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Game 2: Sakura Match */}
        <Card className="border border-border bg-card hover:shadow-md transition-all flex flex-col justify-between overflow-hidden rounded-2xl">
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-xl bg-sakura/10 flex items-center justify-center text-sakura mb-2">
              <Sparkles size={20} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <CardTitle className="text-lg font-bold text-ink">Sakura Match</CardTitle>
            <CardDescription className="text-xs text-ink-muted">
              Card memory flip challenge. Uncover and pair matching vocabulary words and Japanese translations in minimum moves.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col gap-4">
            <div className="bg-background/50 border border-border/40 rounded-xl p-3 flex items-center justify-between text-xs font-semibold text-ink">
              <span className="flex items-center gap-1"><Trophy size={14} className="text-sakura" /> High Score</span>
              <span className="font-mono text-sakura-deep text-sm">{highScores.sakura_match} pts</span>
            </div>
            <Link href="/games/sakura-match" className="w-full">
              <Button className="w-full bg-sakura hover:bg-sakura-deep text-white font-bold text-xs py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 border-none">
                <Play size={13} /> Play Game
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Game 3: Sentence Scramble */}
        <Card className="border border-border bg-card hover:shadow-md transition-all flex flex-col justify-between overflow-hidden rounded-2xl">
          <CardHeader className="pb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-2">
              <Brain size={20} />
            </div>
            <CardTitle className="text-lg font-bold text-ink">Scramble Sprint</CardTitle>
            <CardDescription className="text-xs text-ink-muted">
              Syntax assembly sprint. Tap scrambled grammar tiles in correct sequential order to build logical sentences.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col gap-4">
            <div className="bg-background/50 border border-border/40 rounded-xl p-3 flex items-center justify-between text-xs font-semibold text-ink">
              <span className="flex items-center gap-1"><Trophy size={14} className="text-indigo-500" /> High Score</span>
              <span className="font-mono text-sakura-deep text-sm">{highScores.scramble_sprint} / 10 correct</span>
            </div>
            <Link href="/games/scramble" className="w-full">
              <Button className="w-full bg-sakura hover:bg-sakura-deep text-white font-bold text-xs py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 border-none">
                <Play size={13} /> Play Game
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
