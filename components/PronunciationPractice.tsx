'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, RotateCcw, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { startListening, calculateSimilarity } from '@/lib/speech-recognition';

interface PronunciationPracticeProps {
  targetText: string;
  onSuccess?: () => void;
}

export default function PronunciationPractice({ targetText, onSuccess }: PronunciationPracticeProps) {
  const [listening, setListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recognitionObj, setRecognitionObj] = useState<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionObj) {
        try {
          recognitionObj.abort();
        } catch (e) {}
      }
    };
  }, [recognitionObj]);

  const handleStart = () => {
    setSpokenText('');
    setScore(null);
    setError(null);

    const obj = startListening(
      (result) => {
        setSpokenText(result.transcript);
        const similarityScore = calculateSimilarity(targetText, result.transcript);
        setScore(similarityScore);
        
        if (similarityScore >= 80 && onSuccess) {
          onSuccess();
        }
      },
      (err) => {
        if (err === 'no-speech') {
          setError('No speech detected. Please speak closer to the microphone.');
        } else if (err === 'not-allowed') {
          setError('Microphone access denied. Please enable microphone permissions in your browser.');
        } else {
          setError(`Error: ${err}`);
        }
        setListening(false);
      },
      () => {
        setListening(false);
      }
    );

    if (obj) {
      setListening(true);
      setRecognitionObj(obj);
    }
  };

  const handleReset = () => {
    setSpokenText('');
    setScore(null);
    setError(null);
    setListening(false);
  };

  const getScoreColor = () => {
    if (score === null) return 'text-ink-muted';
    if (score >= 80) return 'text-matcha border-matcha bg-matcha/5';
    if (score >= 50) return 'text-gold border-gold bg-gold/5';
    return 'text-destructive border-destructive bg-destructive/5';
  };

  const getScoreLabel = () => {
    if (score === null) return '';
    if (score >= 80) return 'Excellent!';
    if (score >= 50) return 'Good start, try again!';
    return 'Needs practice!';
  };

  return (
    <div className="flex flex-col p-4 border border-border bg-card/60 dark:bg-card/40 rounded-2xl space-y-3.5 w-full select-none">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-sakura-deep uppercase tracking-widest block">
          Speech Pronunciation Drill
        </span>
        {score !== null && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-[10px] font-bold text-ink-muted hover:text-sakura cursor-pointer"
          >
            <RotateCcw size={10} /> Reset
          </button>
        )}
      </div>

      <div className="bg-bg/40 border border-border/40 rounded-xl p-3.5 text-center">
        <div className="text-[10px] text-ink-muted uppercase font-bold tracking-wider mb-1">Target sentence</div>
        <p className="text-sm font-bold text-ink">"{targetText}"</p>
      </div>

      {error && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-xs text-destructive flex items-start gap-2">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {score === null && !listening && (
        <Button
          onClick={handleStart}
          className="w-full bg-sakura hover:bg-sakura-deep text-white rounded-xl font-bold cursor-pointer py-5 flex items-center justify-center gap-2"
        >
          <Mic size={16} /> Tap to Speak
        </Button>
      )}

      {listening && (
        <div className="flex flex-col items-center justify-center py-2 space-y-2">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-sakura/20 opacity-75"></span>
            <Button
              variant="outline"
              className="relative border-sakura text-sakura rounded-full w-12 h-12 flex items-center justify-center p-0 cursor-pointer animate-pulse"
              disabled
            >
              <Mic size={20} />
            </Button>
          </div>
          <span className="text-[10px] text-sakura font-bold uppercase tracking-widest animate-pulse">
            Listening... Speak now
          </span>
        </div>
      )}

      {score !== null && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-ink">
            <span>Your Speech:</span>
            <span className="text-[10px] text-ink-muted font-mono">Confidence rating</span>
          </div>
          
          <p className="text-sm text-ink-muted italic bg-bg/25 border border-border/40 p-3 rounded-xl">
            "{spokenText || "(No transcript)"}"
          </p>

          <div className={`border rounded-xl p-3 flex items-center justify-between gap-3 ${getScoreColor()}`}>
            <div className="flex items-center gap-2">
              {score >= 80 ? (
                <CheckCircle2 size={16} className="text-matcha shrink-0" />
              ) : score >= 50 ? (
                <AlertCircle size={16} className="text-gold shrink-0" />
              ) : (
                <XCircle size={16} className="text-destructive shrink-0" />
              )}
              <span className="text-xs font-bold">{getScoreLabel()}</span>
            </div>
            <span className="font-display font-black text-base">{score}% Score</span>
          </div>

          {score < 80 && (
            <Button
              onClick={handleStart}
              className="w-full bg-sakura hover:bg-sakura-deep text-white rounded-xl font-bold cursor-pointer flex items-center justify-center gap-2"
            >
              <Mic size={14} /> Try Again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
