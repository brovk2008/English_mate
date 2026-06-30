'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

interface YouTubeEmbedProps {
  youtubeId: string;
  title?: string;
}

export default function YouTubeEmbed({ youtubeId, title = 'Video player' }: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Using YouTube's medium quality thumbnail
  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;

  if (isPlaying) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm border border-border">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-none"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsPlaying(true)}
      className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm border border-border group cursor-pointer select-none bg-bg"
    >
      {/* Background Thumbnail */}
      <img
        src={thumbnailUrl}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />

      {/* Dark overlay on hover */}
      <div className="absolute inset-0 bg-ink/20 group-hover:bg-ink/35 transition-colors duration-300 flex items-center justify-center" />

      {/* Pulsing Play Button */}
      <div className="absolute w-14 h-14 bg-sakura text-white rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
        <Play className="w-6 h-6 fill-current translate-x-0.5" />
      </div>
    </div>
  );
}
