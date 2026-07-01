'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, CheckCircle, Award, Volume2, Music } from 'lucide-react';
import { haptic } from '@/lib/haptics';

interface SongDetails {
  spotify_track_id: string;
  title: string;
  artist: string;
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

interface LyricsModalProps {
  song: SongDetails;
  onClose: () => void;
  onComplete: () => void;
}

export default function LyricsModal({ song, onClose, onComplete }: LyricsModalProps) {
  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [wrongOption, setWrongOption] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentLine = song.lyrics_lines[activeLineIdx];

  // Synthesize word or line aloud
  const speakLine = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleOptionClick = (option: string) => {
    if (!currentLine || isCompleted) return;

    if (option === currentLine.gap_word) {
      setSelectedOption(option);
      haptic.success();

      setTimeout(() => {
        setSelectedOption(null);
        setWrongOption(null);

        if (activeLineIdx < song.lyrics_lines.length - 1) {
          setActiveLineIdx(prev => prev + 1);
        } else {
          setIsCompleted(true);
          haptic.medium();
          setTimeout(() => haptic.medium(), 150);
          onComplete();
        }
      }, 1000);
    } else {
      setWrongOption(option);
      haptic.error();
      setTimeout(() => setWrongOption(null), 800);
    }
  };

  // Helper to draw the lyrics line with blank gap
  const renderLyricsWithGap = (line: string, gapWord: string) => {
    const parts = line.split(new RegExp(`(${gapWord})`, 'gi'));
    return parts.map((part, idx) => {
      if (part.toLowerCase() === gapWord.toLowerCase()) {
        return (
          <span
            key={idx}
            className="inline-block px-4 py-1 mx-1.5 border-b-2 border-sakura text-sakura-deep bg-sakura/5 rounded font-black font-mono tracking-wide"
          >
            {selectedOption ? gapWord : '______'}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <Card className="w-full max-w-lg border border-border bg-[#FAF6F1]/95 dark:bg-card rounded-3xl p-6 shadow-2xl relative flex flex-col justify-between min-h-[480px]">
        {/* Header close */}
        <div className="flex items-center justify-between border-b border-border/40 pb-3 select-none">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sakura/10 text-sakura flex items-center justify-center">
              <Music className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-sm text-ink">{song.title}</h3>
              <p className="text-[10px] text-ink-muted">Lyrics Mode · by {song.artist}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-sakura p-1 rounded-full hover:bg-bg/40 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 flex flex-col justify-center py-6 space-y-8 select-none">
          {!isCompleted ? (
            <>
              {/* Lyrics card */}
              <div className="space-y-4">
                <span className="text-[9px] font-bold text-sakura-deep uppercase tracking-widest block text-center">
                  Listen & Fill the Gap
                </span>
                
                <div className="bg-bg/50 border border-border/60 rounded-2xl p-6 text-center shadow-inner space-y-4 min-h-[120px] flex flex-col justify-center items-center">
                  <h4 className="font-display text-base sm:text-lg font-bold text-ink leading-relaxed px-2">
                    {renderLyricsWithGap(currentLine.line, currentLine.gap_word)}
                  </h4>

                  <Button
                    onClick={() => speakLine(currentLine.line)}
                    variant="ghost"
                    size="sm"
                    className="text-sakura-deep hover:bg-sakura/5 rounded-xl font-bold text-[10px]"
                  >
                    <Volume2 className="w-3.5 h-3.5 mr-1" /> Pronounce Line
                  </Button>
                </div>
              </div>

              {/* Blank Options Grid */}
              <div className="grid grid-cols-2 gap-3">
                {currentLine.gap_options.map((opt) => {
                  const isCorrect = selectedOption === opt;
                  const isWrong = wrongOption === opt;

                  return (
                    <Button
                      key={opt}
                      onClick={() => handleOptionClick(opt)}
                      variant="outline"
                      className={`h-12 text-xs sm:text-sm font-bold rounded-2xl cursor-pointer transition-all border
                        ${
                          isCorrect
                            ? 'bg-matcha hover:bg-matcha text-white border-none'
                            : isWrong
                            ? 'bg-red-600 hover:bg-red-600 text-white border-none animate-shake'
                            : 'border-border bg-card text-ink hover:border-sakura'
                        }`}
                    >
                      {opt}
                    </Button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Completed view */
            <div className="text-center space-y-5 animate-fade-in py-6">
              <div className="w-16 h-16 bg-matcha/10 text-matcha rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-8 h-8 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-xl text-ink">Sofia Lyrics Mastered!</h3>
                <p className="text-xs text-ink-muted max-w-xs mx-auto leading-relaxed">
                  Excellent work! You filled all gaps correctly. You've earned the completion mark for this song challenge.
                </p>
              </div>

              {/* Vocabulary Summary list */}
              <div className="border border-border/80 rounded-2xl bg-bg/50 p-4 max-w-sm mx-auto space-y-2.5 text-left">
                <span className="text-[9px] font-bold text-ink-muted uppercase tracking-widest block border-b border-border/40 pb-1.5">
                  Key Vocab Learned
                </span>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                  {song.key_vocabulary.map((vocab) => (
                    <div key={vocab.word} className="text-[11px] leading-relaxed">
                      <span className="font-bold text-sakura-deep">{vocab.word}</span>
                      <span className="text-ink-muted mx-1.5">·</span>
                      <span className="text-ink-muted font-medium">{vocab.meaning} ({vocab.meaning_ja})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        {!isCompleted ? (
          <div className="border-t border-border/40 pt-3 select-none flex items-center justify-between text-[9px] font-bold text-ink-muted uppercase">
            <span>Sofia Lyrics Practice</span>
            <span>Line {activeLineIdx + 1} of {song.lyrics_lines.length}</span>
          </div>
        ) : (
          <div className="pt-2">
            <Button
              onClick={onClose}
              className="w-full bg-sakura hover:bg-sakura-deep text-white dark:text-bg rounded-2xl font-bold py-3 text-sm cursor-pointer shadow-sm"
            >
              Continue Study
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
