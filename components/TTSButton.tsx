'use client';

import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { speak, stopSpeaking } from '@/lib/tts';

interface TTSButtonProps {
  text: string;
  size?: 'sm' | 'md' | 'icon';
  className?: string;
}

export default function TTSButton({ text, size = 'sm', className = '' }: TTSButtonProps) {
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    // Stop speaking if component unmounts
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      speak(
        text,
        () => setSpeaking(true),
        () => setSpeaking(false)
      );
    }
  };

  return (
    <Button
      type="button"
      size={size === 'icon' ? 'icon' : 'sm'}
      variant="outline"
      onClick={handleSpeak}
      className={`border-sakura/30 hover:bg-sakura/10 hover:text-sakura cursor-pointer rounded-xl shrink-0 p-2 ${className}`}
      title={speaking ? "Stop" : "Speak"}
    >
      {speaking ? (
        <VolumeX className="w-4 h-4 text-sakura animate-pulse" />
      ) : (
        <Volume2 className="w-4 h-4 text-sakura" />
      )}
    </Button>
  );
}
