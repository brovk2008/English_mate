'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, BarChart2, BookOpen } from 'lucide-react';

interface BottomNavProps {
  currentDay: number;
}

export default function BottomNav({ currentDay }: BottomNavProps) {
  const path = usePathname();

  const links = [
    { href: '/home', label: 'Home', icon: Home },
    { href: `/day/${currentDay}`, label: 'Today', icon: Calendar },
    { href: '/progress', label: 'Progress', icon: BarChart2 },
    { href: '/vocabulary', label: 'Vocab', icon: BookOpen },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border md:hidden shadow-lg">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 text-ink-muted">
        {links.map(({ href, label, icon: Icon }) => {
          // Highlight active tab
          const active = path === href || (href !== '/home' && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors select-none cursor-pointer
                ${active ? 'text-sakura font-medium' : 'text-ink-muted hover:text-ink'}`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
