'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Music, Heart, Play, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import LyricsModal from '@/components/LyricsModal';

interface Song {
  spotify_track_id: string;
  title: string;
  artist: string;
  dayNumber?: number;
  lyrics_lines: {
    line: string;
    highlight_words: string[];
    gap_word: string;
    gap_options: string[];
  }[];
  key_vocabulary: {
    word: string;
    meaning: string;
    meaning_ja: string;
  }[];
}

interface ProgressRow {
  day_number: number;
  song_done: boolean;
  song_favorited: boolean;
}

interface SongsClientProps {
  songsCatalog: Song[];
  initialProgress: ProgressRow[];
}

export default function SongsClient({ songsCatalog, initialProgress }: SongsClientProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressRow[]>(initialProgress);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const handleToggleFavorite = async (spotifyId: string, dayNum: number) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Find current favorited state
    const currentProg = progress.find(p => p.day_number === dayNum);
    const nextFavorited = !currentProg?.song_favorited;

    // Update locally
    setProgress(prev => {
      const filtered = prev.filter(p => p.day_number !== dayNum);
      return [...filtered, {
        day_number: dayNum,
        song_done: currentProg?.song_done || false,
        song_favorited: nextFavorited
      }];
    });

    try {
      await supabase
        .from('user_day_progress')
        .upsert({
          user_id: user.id,
          day_number: dayNum,
          song_favorited: nextFavorited
        }, { onConflict: 'user_id,day_number' });
    } catch (err) {
      console.error('Failed to toggle song favorite:', err);
    }
  };

  const isFavorited = (dayNum: number) => {
    return progress.some(p => p.day_number === dayNum && p.song_favorited);
  };

  const isCompleted = (dayNum: number) => {
    return progress.some(p => p.day_number === dayNum && p.song_done);
  };

  // Map playlist items
  // Since Day 2 has Clairo Sofia (Day 2 progress relates to Sofia, Closer relates to Day 7)
  const mappedSongs = songsCatalog.map((song, idx) => {
    // In our catalog, Sofia is idx 0 (Day 2), Closer is idx 1 (Day 7)
    const dayNumber = idx === 0 ? 2 : 7;
    return {
      ...song,
      dayNumber,
      favorited: isFavorited(dayNumber),
      completed: isCompleted(dayNumber)
    };
  });

  const displayedSongs = activeTab === 'all'
    ? mappedSongs
    : mappedSongs.filter(s => s.favorited);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 select-none animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/home')}
          className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-sakura transition-colors cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs font-bold text-ink-muted font-mono select-none">
          Song History & Lyrics Mode
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink flex items-center gap-2">
            <Music className="w-8 h-8 text-sakura animate-pulse" />
            My English Playlist
          </h1>
          <p className="text-xs text-ink-muted leading-relaxed max-w-md">
            Learn English vocabulary through songs. Complete fill-in-the-gap lyrics tests to memorize terms.
          </p>
        </div>

        {/* Tab filters */}
        <div className="flex bg-card border border-border p-1 rounded-xl shadow-sm self-start sm:self-center select-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer
              ${activeTab === 'all' ? 'bg-sakura text-white' : 'text-ink-muted hover:text-sakura'}`}
          >
            All Songs ({mappedSongs.length})
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1
              ${activeTab === 'favorites' ? 'bg-sakura text-white' : 'text-ink-muted hover:text-sakura'}`}
          >
            <Heart size={12} className="fill-current" /> Favorites ({mappedSongs.filter(s => s.favorited).length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {displayedSongs.length === 0 ? (
          <div className="text-center py-16 text-sm text-ink-muted/50 italic border border-dashed border-border rounded-2xl select-none">
            No favorited songs found. Mark songs as favorite during study to build your custom playlist.
          </div>
        ) : (
          displayedSongs.map((song) => (
            <Card
              key={song.spotify_track_id}
              className={`border border-border bg-card rounded-2xl transition-all shadow-sm
                ${song.completed ? 'bg-matcha/5 border-matcha/20 border-l-4 border-l-matcha' : 'border-l-4 border-l-border/50'}`}
            >
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold text-ink">{song.title}</span>
                    <span className="text-xs text-ink-muted font-medium">by {song.artist}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[9px] border-border text-ink-muted font-bold select-none">
                      Day {song.dayNumber}
                    </Badge>
                    {song.completed ? (
                      <Badge className="bg-matcha/10 text-matcha hover:bg-matcha/10 text-[9px] font-bold select-none flex items-center gap-0.5 border-none">
                        <CheckCircle size={10} /> Lyrics Completed
                      </Badge>
                    ) : (
                      <Badge className="bg-bg text-ink-muted text-[9px] font-semibold select-none border-none">
                        Not Completed
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleFavorite(song.spotify_track_id, song.dayNumber)}
                    className={`p-2 rounded-xl transition-all cursor-pointer border ${
                      song.favorited
                        ? 'border-sakura/20 bg-sakura/5 text-sakura'
                        : 'border-border text-ink-muted hover:text-sakura'
                    }`}
                  >
                    <Heart size={16} className={song.favorited ? 'fill-current' : ''} />
                  </button>

                  <Button
                    onClick={() => setSelectedSong(song)}
                    className="bg-sakura hover:bg-sakura-deep/90 text-white dark:text-bg rounded-xl font-bold text-xs h-9 px-4 cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Play size={12} fill="currentColor" /> Learn Lyrics
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedSong && (
        <LyricsModal
          song={selectedSong}
          onClose={() => setSelectedSong(null)}
          onComplete={async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const songDay = selectedSong.dayNumber || 0;
            // Mark completed in database
            setProgress(prev => {
              const filtered = prev.filter(p => p.day_number !== songDay);
              return [...filtered, {
                day_number: songDay,
                song_done: true,
                song_favorited: isFavorited(songDay)
              }];
            });

            try {
              await supabase
                .from('user_day_progress')
                .upsert({
                  user_id: user.id,
                  day_number: songDay,
                  song_done: true
                }, { onConflict: 'user_id,day_number' });
            } catch (err) {
              console.error('Failed to save song completion:', err);
            }
          }}
        />
      )}
    </div>
  );
}
