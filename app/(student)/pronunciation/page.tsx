'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Check, Sparkles } from 'lucide-react';

interface SoundItem {
  id: number;
  symbol: string;
  type: 'vowel' | 'consonant' | 'diphthong';
  description: string;
  examples: string[];
  youtubeId: string;
}

const SOUNDS: SoundItem[] = [
  {
    id: 1,
    symbol: '/æ/',
    type: 'vowel',
    description: 'Short flat A sound. Keep tongue low and front of mouth wide.',
    examples: ['cat', 'apple', 'family', 'black'],
    youtubeId: 'pP8z76sSgoc',
  },
  {
    id: 2,
    symbol: '/iː/',
    type: 'vowel',
    description: 'Long E sound. Smile slightly, tongue high and forward.',
    examples: ['sheep', 'feel', 'each', 'believe'],
    youtubeId: 'qQJ-GqWwXts',
  },
  {
    id: 3,
    symbol: '/ɪ/',
    type: 'vowel',
    description: 'Short relaxed I sound. Mouth slightly open, relaxed tongue.',
    examples: ['ship', 'if', 'listen', 'build'],
    youtubeId: 'v8JtJ0R2x7k',
  },
  {
    id: 4,
    symbol: '/uː/',
    type: 'vowel',
    description: 'Long OO sound. Round lips tightly, back of tongue high.',
    examples: ['blue', 'food', 'into', 'group'],
    youtubeId: 'sF7LgO3dF7k',
  },
  {
    id: 5,
    symbol: '/ʊ/',
    type: 'vowel',
    description: 'Short relaxed OO sound. Lips loosely rounded, relaxed throat.',
    examples: ['book', 'good', 'should', 'put'],
    youtubeId: 'sK-5vGgC-yA',
  },
  {
    id: 6,
    symbol: '/ʌ/',
    type: 'vowel',
    description: 'Short U sound. Centred relaxed jaw, open throat.',
    examples: ['cup', 'love', 'study', 'enough'],
    youtubeId: 't6l9Cj6HpyY',
  },
  {
    id: 7,
    symbol: '/ɑː/',
    type: 'vowel',
    description: 'Long ah sound. Wide open throat, flat relaxed tongue.',
    examples: ['father', 'smart', 'start', 'car'],
    youtubeId: 'Hj-gEovD-hQ',
  },
  {
    id: 8,
    symbol: '/ɔː/',
    type: 'vowel',
    description: 'Long aw sound. Slightly rounded lips, back tongue low.',
    examples: ['law', 'song', 'before', 'walk'],
    youtubeId: 'a7GleE7BvXk',
  },
  {
    id: 9,
    symbol: '/ə/',
    type: 'vowel',
    description: 'The Schwa. Completely neutral, short relaxed vowel.',
    examples: ['about', 'sofa', 'support', 'mother'],
    youtubeId: '98Kj22n5G6k',
  },
  {
    id: 10,
    symbol: '/ɜː/',
    type: 'vowel',
    description: 'Long er sound. Rounded lips, middle of tongue bunched.',
    examples: ['bird', 'work', 'learn', 'first'],
    youtubeId: 'T85yV5nI6qM',
  },
  {
    id: 11,
    symbol: '/θ/',
    type: 'consonant',
    description: 'Voiceless TH. Tongue tip between teeth, blow air out gently.',
    examples: ['think', 'both', 'thirty', 'growth'],
    youtubeId: 'sX8OOp7Vq2Q',
  },
  {
    id: 12,
    symbol: '/ð/',
    type: 'consonant',
    description: 'Voiced TH. Tongue tip between teeth, vibrate vocal cords.',
    examples: ['mother', 'this', 'brother', 'they'],
    youtubeId: 'sX8OOp7Vq2Q',
  },
  {
    id: 13,
    symbol: '/ʃ/',
    type: 'consonant',
    description: 'SH sound. Lips rounded and flared forward, blow air.',
    examples: ['sheep', 'she', 'wash', 'action'],
    youtubeId: 'Y9jQ_t8oHlo',
  },
  {
    id: 14,
    symbol: '/ʒ/',
    type: 'consonant',
    description: 'Voiced SH sound. Lips rounded, vibrate vocal cords.',
    examples: ['vision', 'measure', 'pleasure', 'garage'],
    youtubeId: 'Y9jQ_t8oHlo',
  },
  {
    id: 15,
    symbol: '/tʃ/',
    type: 'consonant',
    description: 'CH sound. Stop air then release with SH friction.',
    examples: ['chair', 'each', 'check', 'catch'],
    youtubeId: 'U_54Gj3GZgo',
  },
  {
    id: 16,
    symbol: '/dʒ/',
    type: 'consonant',
    description: 'J sound. Stop air then release with voiced SH friction.',
    examples: ['jam', 'judge', 'journey', 'major'],
    youtubeId: 'U_54Gj3GZgo',
  },
  {
    id: 17,
    symbol: '/ŋ/',
    type: 'consonant',
    description: 'Velar nasal NG sound. Back of tongue meets soft palate, air exits nose.',
    examples: ['sing', 'song', 'long', 'think'],
    youtubeId: 'n7qg-f_V_xY',
  },
  {
    id: 18,
    symbol: '/w/',
    type: 'consonant',
    description: 'W sound. Round lips tightly then release into vowel.',
    examples: ['work', 'with', 'walk', 'word'],
    youtubeId: 'WwIeH1fXFjA',
  },
  {
    id: 19,
    symbol: '/j/',
    type: 'consonant',
    description: 'Y sound. Tongue high, release sides of mouth relaxed.',
    examples: ['yes', 'you', 'young', 'year'],
    youtubeId: 'uJjEwWd9t6Q',
  },
  {
    id: 20,
    symbol: '/r/',
    type: 'consonant',
    description: 'R sound. Curl tongue tip back slightly without touching palate.',
    examples: ['run', 'red', 'right', 'write'],
    youtubeId: 'yO7u5-vAypg',
  },
  {
    id: 21,
    symbol: '/eɪ/',
    type: 'diphthong',
    description: 'Starts at /e/ ends at /ɪ/. Long A sound.',
    examples: ['day', 'say', 'make', 'great'],
    youtubeId: 'z1mUvO8L7L8',
  },
  {
    id: 22,
    symbol: '/aɪ/',
    type: 'diphthong',
    description: 'Starts at /a/ ends at /ɪ/. Long I sound.',
    examples: ['my', 'like', 'time', 'write'],
    youtubeId: 'z1mUvO8L7L8',
  },
  {
    id: 23,
    symbol: '/ɔɪ/',
    type: 'diphthong',
    description: 'Starts at /ɔ/ ends at /ɪ/. Oy sound.',
    examples: ['boy', 'oil', 'voice', 'join'],
    youtubeId: 'z1mUvO8L7L8',
  },
  {
    id: 24,
    symbol: '/aʊ/',
    type: 'diphthong',
    description: 'Starts at /a/ ends at /ʊ/. Ow sound.',
    examples: ['now', 'about', 'house', 'out'],
    youtubeId: 'Kz1MhT6Upyc',
  },
  {
    id: 25,
    symbol: '/oʊ/',
    type: 'diphthong',
    description: 'Starts at /o/ ends at /ʊ/. Long O sound.',
    examples: ['go', 'sofa', 'both', 'most'],
    youtubeId: 'Kz1MhT6Upyc',
  },
  {
    id: 26,
    symbol: '/ɪə/',
    type: 'diphthong',
    description: 'Starts at /ɪ/ ends at /ə/. Ear sound.',
    examples: ['hear', 'here', 'year', 'clear'],
    youtubeId: 'GqUjQ30p9S4',
  },
  {
    id: 27,
    symbol: '/eə/',
    type: 'diphthong',
    description: 'Starts at /e/ ends at /ə/. Air sound.',
    examples: ['chair', 'where', 'family', 'care'],
    youtubeId: 'GqUjQ30p9S4',
  },
  {
    id: 28,
    symbol: '/ʊə/',
    type: 'diphthong',
    description: 'Starts at /ʊ/ ends at /ə/. Oor sound.',
    examples: ['tour', 'sure', 'poor', 'pure'],
    youtubeId: 'GqUjQ30p9S4',
  },
  {
    id: 29,
    symbol: '/p/',
    type: 'consonant',
    description: 'Voiceless explosive P. Press lips together, puff air.',
    examples: ['put', 'apple', 'pocket', 'play'],
    youtubeId: 'qQJ-GqWwXts',
  },
  {
    id: 30,
    symbol: '/b/',
    type: 'consonant',
    description: 'Voiced explosive B. Press lips, vibrate vocal cords.',
    examples: ['book', 'before', 'build', 'both'],
    youtubeId: 'qQJ-GqWwXts',
  }
];

export default function PronunciationPage() {
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [filter, setFilter] = useState<'all' | 'vowel' | 'consonant' | 'diphthong'>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from localStorage
    const saved = localStorage.getItem('sakura_pronunciation_drills');
    if (saved) {
      try {
        setCheckedIds(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleToggle = (id: number, checked: boolean) => {
    let next: number[];
    if (checked) {
      next = [...checkedIds, id];
    } else {
      next = checkedIds.filter((item) => item !== id);
    }
    setCheckedIds(next);
    localStorage.setItem('sakura_pronunciation_drills', JSON.stringify(next));
  };

  const filtered = SOUNDS.filter(s => filter === 'all' || s.type === filter);
  const masterPercentage = Math.round((checkedIds.length / SOUNDS.length) * 100);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-sakura" />
          Pronunciation Drill Center
        </h1>
        <p className="text-sm text-ink-muted mt-0.5 font-medium">
          Master the 30 fundamental sounds of the English language with custom audio guides.
        </p>
      </div>

      {/* Progress tracker */}
      <Card className="border border-border bg-card rounded-2xl shadow-sm">
        <CardContent className="p-5 flex items-center justify-between gap-6 flex-wrap sm:flex-nowrap">
          <div className="space-y-1 flex-1 min-w-[200px]">
            <div className="flex justify-between text-xs font-semibold text-ink-muted">
              <span>Drill Mastery Progress</span>
              <span>{checkedIds.length} / {SOUNDS.length} Sounds ({masterPercentage}%)</span>
            </div>
            <Progress value={masterPercentage} className="h-2.5 bg-border" />
          </div>
          {masterPercentage === 100 ? (
            <Badge className="bg-matcha text-white hover:bg-matcha px-3.5 py-1.5 rounded-xl font-semibold text-sm">
              Accent Mastered! 🌟
            </Badge>
          ) : (
            <Badge variant="outline" className="border-border text-ink-muted px-3.5 py-1.5 rounded-xl font-semibold text-sm select-none">
              Keep Practicing 🗣️
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Category selector */}
      <div className="flex bg-card border border-border p-1 rounded-xl shadow-sm self-start select-none max-w-sm">
        {(['all', 'vowel', 'consonant', 'diphthong'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer
              ${filter === type ? 'bg-sakura text-white' : 'text-ink-muted hover:text-sakura'}`}
          >
            {type === 'all' ? 'All' : type + 's'}
          </button>
        ))}
      </div>

      {/* Drill grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((sound) => {
          const isDone = checkedIds.includes(sound.id);
          return (
            <Card 
              key={sound.id}
              className={`border border-border bg-card rounded-2xl transition-all shadow-sm
                ${isDone ? 'bg-matcha/5 border-matcha/20 border-l-4 border-l-matcha' : 'border-l-4 border-l-border/50'}`}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-2xl text-ink">{sound.symbol}</span>
                      <Badge variant="outline" className="text-[9px] border-border text-ink-muted select-none capitalize">
                        {sound.type}
                      </Badge>
                    </div>

                    <Checkbox
                      checked={isDone}
                      onCheckedChange={(checked) => handleToggle(sound.id, !!checked)}
                      className="w-5 h-5 border-border data-[state=checked]:bg-matcha data-[state=checked]:border-matcha rounded-lg cursor-pointer"
                    />
                  </div>

                  <p className="text-xs text-ink leading-relaxed font-medium">
                    {sound.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sound.examples.map((ex) => (
                      <span key={ex} className="px-2 py-0.5 bg-bg/50 rounded-lg text-xs font-bold text-ink-muted font-mono select-none">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-1">
                  <a
                    href={`https://www.youtube.com/watch?v=${sound.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-sakura-deep hover:text-sakura font-bold select-none cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-red-600 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    <span>Watch Rachel's English Video</span>
                  </a>

                  {isDone && (
                    <span className="text-[10px] text-matcha font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Practice Done
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
