// components/ShareCard.tsx
'use client';

import { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check, Share2, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';
import { playSound } from '@/lib/sounds';

interface ShareCardProps {
  title: string;
  subtitle: string;
  badgeName?: string;
  stats: { label: string; value: string | number }[];
  accentColor?: string;
}

export default function ShareCard({
  title,
  subtitle,
  badgeName,
  stats,
  accentColor = '#E8A6B8'
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    playSound('flip');

    try {
      // Small delay to ensure render states settle
      await new Promise((r) => setTimeout(r, 100));
      
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2, // High resolution
        backgroundColor: null
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `sakura-journey-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      playSound('correct');
    } catch (e) {
      console.error('Failed to export image:', e);
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    playSound('flip');

    try {
      await new Promise((r) => setTimeout(r, 100));
      
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: null
      });

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob
            })
          ]);
          setCopied(true);
          playSound('correct');
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Clipboard write failed:', err);
        }
      }, 'image/png');
    } catch (e) {
      console.error('Failed to copy image:', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-sm mx-auto">
      {/* Target element captured by canvas */}
      <div 
        ref={cardRef}
        className="w-[380px] h-[380px] relative overflow-hidden rounded-[32px] p-8 flex flex-col justify-between select-none shadow-xl border border-white/10"
        style={{
          background: 'linear-gradient(135deg, #1e1b1c 0%, #120e10 100%)',
        }}
      >
        {/* Soft glowing radial background decoration */}
        <div 
          className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[100px] opacity-40 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-indigo-500/20 rounded-full blur-[100px] opacity-35 pointer-events-none" />

        {/* Top header */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🌸</span>
            <span className="font-display text-[10px] font-black tracking-widest text-stone-300 uppercase">
              Sakura English Journey
            </span>
          </div>
          <div 
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
        </div>

        {/* Center content badge */}
        <div className="text-center space-y-3 z-10 my-auto">
          {badgeName && (
            <div className="relative inline-block">
              {/* Spinning star light */}
              <div 
                className="absolute inset-0 rounded-full blur-md opacity-30 animate-pulse"
                style={{ backgroundColor: accentColor }}
              />
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center mx-auto text-3xl shadow-lg relative">
                🏆
              </div>
            </div>
          )}

          <div className="space-y-1">
            <span 
              className="text-[9px] font-bold uppercase tracking-wider block"
              style={{ color: accentColor }}
            >
              {subtitle}
            </span>
            <h2 className="font-display font-black text-2xl text-white leading-tight">
              {title}
            </h2>
          </div>
        </div>

        {/* Bottom stats row */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5 z-10">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <span className="text-[8px] font-bold text-stone-500 uppercase block tracking-wider mb-0.5">
                {stat.label}
              </span>
              <span className="text-sm font-black text-white font-mono leading-none">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 justify-center select-none">
        <Button
          onClick={handleCopy}
          disabled={exporting}
          variant="outline"
          className="flex-1 py-2.5 text-xs font-bold border-border bg-card text-ink hover:bg-muted rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-matcha" /> Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy Card
            </>
          )}
        </Button>
        <Button
          onClick={handleDownload}
          disabled={exporting}
          className="flex-1 py-2.5 text-xs font-bold bg-sakura hover:bg-sakura-deep text-white border-none rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5" /> Download
        </Button>
      </div>
    </div>
  );
}
