// components/Certificate.tsx
'use client';

import { useRef } from 'react';
import { Download, Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CertificateProps {
  studentName: string;
  completionDate: string;
  wordsLearned: number;
  daysCompleted: number;
  cefrLevel: string;
  xpLevel: string;
  xpLevelJa: string;
}

export default function Certificate({
  studentName,
  completionDate,
  wordsLearned,
  daysCompleted,
  cefrLevel,
  xpLevel,
  xpLevelJa
}: CertificateProps) {
  const certRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Action buttons — hidden on print */}
      <div className="flex flex-wrap gap-3 items-center justify-between mb-8 print:hidden">
        <Link 
          href="/progress" 
          className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-sakura transition-colors select-none"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Progress
        </Link>
        <div className="flex gap-3">
          <button 
            onClick={handlePrint} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sakura hover:bg-sakura-deep text-white font-semibold text-xs shadow-md transition-colors cursor-pointer select-none"
          >
            <Printer size={15} /> Print Certificate
          </button>
          <button 
            onClick={handlePrint} 
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-ink font-semibold text-xs transition-colors cursor-pointer select-none"
          >
            <Download size={15} /> Save as PDF
          </button>
        </div>
      </div>
      
      {/* Certificate Frame */}
      <div 
        ref={certRef} 
        className="certificate-wrapper relative w-full border-[12px] border-double border-amber-600/30 p-6 md:p-12 bg-white text-stone-800 rounded-lg shadow-xl overflow-hidden aspect-[1.414/1] flex flex-col justify-between font-serif select-none"
        style={{
          background: 'radial-gradient(circle, #fcfbf7 0%, #f4f0e4 100%)',
          boxShadow: 'inset 0 0 100px rgba(139, 90, 0, 0.05)'
        }}
      >
        {/* Subtle Watermark Sakura */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <svg width="60%" height="60%" viewBox="0 0 100 100" fill="currentColor" className="text-sakura">
            <path d="M50 35 C42 20, 20 20, 25 38 C30 50, 48 48, 50 50 C52 48, 70 50, 75 38 C80 20, 58 20, 50 35 Z" />
            <path d="M50 65 C42 80, 20 80, 25 62 C30 50, 48 52, 50 50 C52 52, 70 50, 75 62 C80 80, 58 80, 50 65 Z" />
            <path d="M35 50 C20 42, 20 20, 38 25 C50 30, 48 48, 50 50 C48 52, 50 70, 38 75 C20 80, 20 58, 35 50 Z" />
            <path d="M65 50 C80 42, 80 20, 62 25 C50 30, 52 48, 50 50 C52 52, 50 70, 62 75 C80 80, 80 58, 65 50 Z" />
          </svg>
        </div>

        {/* Certificate Corner Decorations */}
        <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-600/60" />
        <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-600/60" />
        <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-600/60" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-600/60" />

        {/* Top Header Bilingual Title */}
        <div className="text-center space-y-1">
          <h3 className="text-xl md:text-2xl font-black text-amber-900/80 tracking-widest leading-none font-sans">
            🌸 桜英語の旅 🌸
          </h3>
          <p className="text-[10px] md:text-xs tracking-widest text-stone-500 uppercase font-sans font-bold">
            Sakura English Journey
          </p>
        </div>

        {/* Certificate Body */}
        <div className="text-center space-y-3 md:space-y-4 my-auto">
          <h2 className="text-3xl md:text-5xl font-extrabold text-stone-800 tracking-wide font-serif italic">
            Certificate of Completion
          </h2>
          
          <p className="text-xs md:text-sm text-stone-500 tracking-wide">
            This is proudly presented to certify that
          </p>

          <div className="py-1">
            <h1 className="text-3xl md:text-5xl font-black text-sakura-deep tracking-wider font-serif border-b border-amber-600/20 max-w-lg mx-auto pb-1 italic px-4">
              ❋ {studentName} ❋
            </h1>
          </div>

          <p className="text-[11px] md:text-xs text-stone-600 max-w-xl mx-auto leading-relaxed">
            has successfully completed the intensive 90-Day curriculum of custom vocabulary study, grammar focus, dialogue challenges, and essay tasks, demonstrating master level proficiency.
          </p>
        </div>

        {/* Stat Blocks */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto w-full my-1">
          <div className="border border-amber-600/20 rounded-xl p-2 bg-[#fcfbf9] text-center shadow-xs">
            <span className="text-[18px] md:text-2xl font-black text-amber-900 font-serif">{wordsLearned}</span>
            <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-stone-500 font-sans font-bold mt-0.5">Words Learned</p>
          </div>
          <div className="border border-amber-600/20 rounded-xl p-2 bg-[#fcfbf9] text-center shadow-xs">
            <span className="text-[18px] md:text-2xl font-black text-amber-900 font-serif">{daysCompleted}</span>
            <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-stone-500 font-sans font-bold mt-0.5">Days Completed</p>
          </div>
          <div className="border border-amber-600/20 rounded-xl p-2 bg-[#fcfbf9] text-center shadow-xs">
            <span className="text-[18px] md:text-2xl font-black text-amber-900 font-serif">{xpLevel}</span>
            <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-stone-500 font-sans font-bold mt-0.5">{xpLevelJa}</p>
          </div>
        </div>

        {/* Bottom Footer Section */}
        <div className="flex items-end justify-between border-t border-stone-200/50 pt-4 mt-2">
          <div className="text-left space-y-1">
            <p className="text-[9px] md:text-xs text-stone-600">
              Completed on: <strong className="font-sans font-bold text-stone-700">{completionDate}</strong>
            </p>
            <p className="text-[9px] md:text-xs text-stone-600">
              CEFR Equivalency: <strong className="font-sans font-bold text-stone-700">{cefrLevel}</strong>
            </p>
          </div>

          {/* SVG Gold Seal / Stamp */}
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center shrink-0">
            {/* Red Japanese Hanko style stamp */}
            <svg viewBox="0 0 100 100" className="w-12 h-12 md:w-16 md:h-16 text-rose-600/80 absolute rotate-[-8deg] drop-shadow-sm select-none pointer-events-none">
              <rect x="10" y="10" width="80" height="80" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
              <text x="50" y="44" fontSize="24" fontWeight="bold" fontFamily="serif" textAnchor="middle" fill="currentColor">桜英</text>
              <text x="50" y="74" fontSize="24" fontWeight="bold" fontFamily="serif" textAnchor="middle" fill="currentColor">学印</text>
            </svg>
          </div>

          <div className="text-right space-y-0.5">
            <div className="italic text-base md:text-lg text-amber-950 font-serif tracking-wide border-b border-stone-200 pb-0.5">
              Vaibhav
            </div>
            <p className="text-[8px] md:text-[10px] text-stone-500 uppercase tracking-widest font-sans font-bold">
              English Instructor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
