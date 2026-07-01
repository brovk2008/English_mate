'use client';

import { useI18n } from '@/lib/i18n/context';

export default function LangToggle() {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'ja' : 'en')}
      className="px-3 py-1.5 rounded-xl text-xs font-bold border border-border bg-card
        text-ink-muted hover:text-ink hover:border-sakura transition-all shadow-sm cursor-pointer select-none flex items-center gap-1"
      aria-label="Switch language"
    >
      <span>{lang === 'en' ? '🇯🇵' : '🇬🇧'}</span>
      <span>{lang === 'en' ? '日本語' : 'English'}</span>
    </button>
  );
}
