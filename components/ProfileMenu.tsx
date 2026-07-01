'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/lib/auth-actions';
import { useI18n } from '@/lib/i18n/context';
import { LogOut, Settings, User, FileText } from 'lucide-react';

interface ProfileMenuProps {
  profile: {
    avatar_url?: string | null;
    display_name?: string | null;
    email?: string | null;
  };
}

export default function ProfileMenu({ profile }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 focus:outline-none cursor-pointer rounded-full"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Avatar className="w-8 h-8 ring-2 ring-sakura/30 hover:ring-sakura transition-all">
          <AvatarImage src={profile.avatar_url || ''} />
          <AvatarFallback className="bg-sakura/10 text-sakura font-bold text-xs">
            {profile.display_name?.substring(0, 2).toUpperCase() || 'US'}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
          {/* Header */}
          <div className="px-4 py-2 border-b border-border/40 text-left">
            <span className="font-bold text-xs text-ink block truncate">
              {profile.display_name || 'User'}
            </span>
            <span className="text-[10px] text-ink-muted block truncate mt-0.5">
              {profile.email}
            </span>
          </div>

          {/* Links */}
          <div className="p-1 space-y-0.5">
            <Link
              href="/notes"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-ink-muted hover:text-sakura hover:bg-bg/25 rounded-xl transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>My Notebook</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-ink-muted hover:text-sakura hover:bg-bg/25 rounded-xl transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>{t('nav.settings')}</span>
            </Link>

            {/* Sign Out */}
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-500/5 rounded-xl transition-all text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('settings.sign_out')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
