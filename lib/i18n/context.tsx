'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '@/data/i18n/en.json';
import ja from '@/data/i18n/ja.json';

export type Lang = 'en' | 'ja';

const translations = { en, ja };

interface I18nContextProps {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextProps>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    // Persist preference in localStorage
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'en' || saved === 'ja') {
      setLangState(saved);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
    // Also save to Supabase profile so it persists across devices
    fetch('/api/set-lang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: l })
    }).catch(err => console.error('Failed to sync language preference', err));
  };

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const parts = key.split('.');
    let val: any = translations[lang];
    for (const p of parts) {
      val = val?.[p];
    }
    // Fallback to English if not found in current language
    if (typeof val !== 'string') {
      let fallbackVal: any = translations['en'];
      for (const p of parts) {
        fallbackVal = fallbackVal?.[p];
      }
      val = typeof fallbackVal === 'string' ? fallbackVal : key;
    }

    let result = val as string;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        result = result.replace(`{{${k}}}`, String(v));
      });
    }
    return result;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
