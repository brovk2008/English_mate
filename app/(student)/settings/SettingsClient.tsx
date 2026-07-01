'use client';

import { useState } from 'react';
import { useI18n, Lang } from '@/lib/i18n/context';
import { useTheme } from 'next-themes';
import { signOut } from '@/lib/auth-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Globe, Sun, Moon, Laptop, Bell, AlertTriangle, ShieldAlert, Award, User, RefreshCw, LogOut } from 'lucide-react';

interface SettingsClientProps {
  profile: {
    id: string;
    display_name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
    reminder_time?: string | null;
    cefr_level?: string | null;
  };
  stats: {
    daysCompleted: number;
    wordsLearned: number;
    totalWordsWritten: number;
    badgesEarned: string[];
    startDate: string;
  };
}

export default function SettingsClient({ profile, stats }: SettingsClientProps) {
  const { lang, setLang, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [reminder, setReminder] = useState(profile.reminder_time || '20:00');
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetInput, setResetInput] = useState('');
  const [resetting, setResetting] = useState(false);

  // Time-picker reminder saver
  const handleSaveReminder = async (time: string) => {
    setReminder(time);
    setReminderStatus('saving');
    try {
      const res = await fetch('/api/save-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminder_time: time }),
      });
      if (res.ok) {
        setReminderStatus('saved');
        setTimeout(() => setReminderStatus('idle'), 2000);
      } else {
        setReminderStatus('error');
      }
    } catch {
      setReminderStatus('error');
    }
  };

  // Reset logic
  const handleResetProgress = async () => {
    if (resetInput !== 'RESET') return;
    setResetting(true);
    try {
      const res = await fetch('/api/reset-progress', {
        method: 'POST',
      });
      if (res.ok) {
        window.location.href = '/home';
      }
    } catch (e) {
      console.error(e);
      setResetting(false);
    }
  };

  // Day calculation
  const getDayNumber = () => {
    const start = new Date(stats.startDate);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(90, diff + 1));
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-ink select-none">
          {t('settings.title')}
        </h1>
        <p className="text-sm text-ink-muted mt-0.5 font-medium">
          Customize your experience, language display, reminders, and progress milestones.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left side card - Account summary */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-4 bg-bg/10 border-b border-border/40 select-none">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                {t('settings.account')}
              </span>
            </CardHeader>
            <CardContent className="p-5 flex flex-col items-center text-center gap-4">
              <Avatar className="w-16 h-16 ring-4 ring-sakura/20">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="bg-sakura/10 text-sakura font-bold text-xl">
                  {profile.display_name?.substring(0, 2).toUpperCase() || 'ST'}
                </AvatarFallback>
              </Avatar>

              <div>
                <h3 className="font-display font-extrabold text-base text-ink">
                  {profile.display_name || 'User'}
                </h3>
                <span className="text-xs text-ink-muted mt-0.5 block">{profile.email}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side form sections */}
        <div className="md:col-span-2 space-y-6">
          {/* 1. Language settings */}
          <Card className="border border-border bg-card rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40 select-none">
              <CardTitle className="font-display text-base font-extrabold text-ink flex items-center gap-2">
                <Globe className="w-4 h-4 text-sakura" />
                {t('settings.language')}
              </CardTitle>
              <CardDescription className="text-xs text-ink-muted">
                Choose the interface translation language.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex gap-3 select-none max-w-xs">
                <button
                  onClick={() => setLang('en')}
                  className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5
                    ${lang === 'en' ? 'border-sakura bg-sakura/5 text-sakura-deep shadow-sm' : 'border-border text-ink-muted hover:border-sakura'}`}
                >
                  <span>🇬🇧</span>
                  <span>{t('settings.language_en')}</span>
                </button>

                <button
                  onClick={() => setLang('ja')}
                  className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5
                    ${lang === 'ja' ? 'border-sakura bg-sakura/5 text-sakura-deep shadow-sm' : 'border-border text-ink-muted hover:border-sakura'}`}
                >
                  <span>🇯🇵</span>
                  <span>{t('settings.language_ja')}</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 2. Theme settings */}
          <Card className="border border-border bg-card rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40 select-none">
              <CardTitle className="font-display text-base font-extrabold text-ink flex items-center gap-2">
                <Sun className="w-4 h-4 text-sakura" />
                {t('settings.theme')}
              </CardTitle>
              <CardDescription className="text-xs text-ink-muted">
                Choose light mode, dark mode, or follow system theme.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-3 gap-3 select-none max-w-sm">
                {[
                  { id: 'light', name: t('settings.theme_light'), icon: Sun },
                  { id: 'dark', name: t('settings.theme_dark'), icon: Moon },
                  { id: 'system', name: t('settings.theme_system'), icon: Laptop }
                ].map((tItem) => {
                  const Icon = tItem.icon;
                  const isActive = theme === tItem.id;
                  return (
                    <button
                      key={tItem.id}
                      onClick={() => setTheme(tItem.id)}
                      className={`py-3 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1.5
                        ${isActive ? 'border-sakura bg-sakura/5 text-sakura-deep' : 'border-border text-ink-muted hover:border-sakura'}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tItem.name}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 3. Daily reminder settings */}
          <Card className="border border-border bg-card rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40 select-none">
              <CardTitle className="font-display text-base font-extrabold text-ink flex items-center gap-2">
                <Bell className="w-4 h-4 text-sakura" />
                {t('settings.notifications')}
              </CardTitle>
              <CardDescription className="text-xs text-ink-muted">
                Save daily reminder schedule times.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-ink-muted whitespace-nowrap">
                  {t('settings.reminder_time')}
                </label>
                <input
                  type="time"
                  value={reminder}
                  onChange={(e) => handleSaveReminder(e.target.value)}
                  className="bg-bg border border-border rounded-xl px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-sakura focus:border-sakura transition-all shadow-sm font-semibold select-none cursor-pointer"
                />
                
                {reminderStatus === 'saving' && (
                  <span className="text-[10px] font-bold text-ink-muted animate-pulse">Saving...</span>
                )}
                {reminderStatus === 'saved' && (
                  <span className="text-[10px] font-bold text-matcha">Saved ✓</span>
                )}
                {reminderStatus === 'error' && (
                  <span className="text-[10px] font-bold text-sakura-deep">Error saving</span>
                )}
              </div>
              <p className="text-[10px] text-ink-muted italic leading-relaxed">
                Note: open this site at that time — we'll highlight your task!
              </p>
            </CardContent>
          </Card>

          {/* 4. Progress summary stats */}
          <Card className="border border-border bg-card rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40 select-none">
              <CardTitle className="font-display text-base font-extrabold text-ink flex items-center gap-2">
                <Award className="w-4 h-4 text-sakura" />
                Learning Progression
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg/40 border border-border rounded-xl p-3">
                  <span className="text-[9px] font-bold text-ink-muted uppercase block">Start Date</span>
                  <span className="text-xs font-bold text-ink">{new Date(stats.startDate).toLocaleDateString()}</span>
                </div>
                <div className="bg-bg/40 border border-border rounded-xl p-3">
                  <span className="text-[9px] font-bold text-ink-muted uppercase block">Current Day</span>
                  <span className="text-xs font-bold text-ink">Day {getDayNumber()} / 90</span>
                </div>
                <div className="bg-bg/40 border border-border rounded-xl p-3">
                  <span className="text-[9px] font-bold text-ink-muted uppercase block">Vocab Learned</span>
                  <span className="text-xs font-bold text-ink">{stats.wordsLearned} Words</span>
                </div>
                <div className="bg-bg/40 border border-border rounded-xl p-3">
                  <span className="text-[9px] font-bold text-ink-muted uppercase block">Words Written</span>
                  <span className="text-xs font-bold text-ink">{stats.totalWordsWritten} Words</span>
                </div>
                <div className="bg-bg/40 border border-border rounded-xl p-3">
                  <span className="text-[9px] font-bold text-ink-muted uppercase block">Badges Earned</span>
                  <span className="text-xs font-bold text-ink">{stats.badgesEarned.length} Badges</span>
                </div>
                <div className="bg-bg/40 border border-border rounded-xl p-3">
                  <span className="text-[9px] font-bold text-ink-muted uppercase block">Placement Level</span>
                  <span className="text-xs font-bold text-sakura-deep">{profile.cefr_level || 'A2'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Danger zone */}
          <Card className="border border-red-500/20 bg-red-500/5 rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-red-500/10 select-none">
              <CardTitle className="font-display text-base font-extrabold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {t('settings.danger_zone')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 flex flex-wrap gap-4 items-center justify-between">
              <Button
                onClick={() => setShowResetModal(true)}
                variant="outline"
                className="border-red-500/30 text-red-600 hover:bg-red-500/10 rounded-xl font-bold text-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                {t('settings.reset_progress')}
              </Button>

              <Button
                onClick={() => signOut()}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                {t('settings.sign_out')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Reset confirmation modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border border-border bg-card rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-display font-extrabold text-lg select-none">
              <ShieldAlert className="w-6 h-6 animate-bounce" />
              <span>{t('settings.reset_progress')}?</span>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed font-semibold">
              {t('settings.reset_warning')}
              <br />
              <span className="font-bold text-red-600">This will wipe out all streaks, card schedules, diary inputs, and metrics.</span>
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                Type RESET to confirm
              </label>
              <input
                type="text"
                placeholder="RESET"
                value={resetInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResetInput(e.target.value)}
                className="w-full h-10 px-3 border border-border rounded-xl bg-bg text-ink focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-semibold transition-all"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 select-none">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetModal(false);
                  setResetInput('');
                }}
                className="border-border text-ink-muted rounded-xl font-bold text-xs cursor-pointer"
              >
                {t('common.cancel')}
              </Button>

              <Button
                disabled={resetInput !== 'RESET' || resetting}
                onClick={handleResetProgress}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                {resetting ? 'Resetting...' : t('settings.reset_confirm')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
