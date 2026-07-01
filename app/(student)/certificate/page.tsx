// app/(student)/certificate/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Certificate from '@/components/Certificate';
import Link from 'next/link';
import { ArrowLeft, Lock, Award, BookOpen, Clock } from 'lucide-react';
import { getLevelFromXP } from '@/lib/xp';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ preview_student_id?: string }>;
}

export default async function CertificatePage({ searchParams }: PageProps) {
  const { preview_student_id } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const teacherEmail = process.env.NEXT_PUBLIC_TEACHER_EMAIL;
  const isTeacher = user.email === teacherEmail;
  const targetUserId = (isTeacher && preview_student_id) ? preview_student_id : user.id;

  // 1. Get profile stats
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', targetUserId)
    .single();

  if (!profile) {
    redirect('/home');
  }

  // 2. Check if Day 90 is completed
  const { data: day90Progress } = await supabase
    .from('user_day_progress')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('day_number', 90)
    .maybeSingle();

  const isGraduated = day90Progress?.completed_at ? true : false;

  // 3. Gather stats for certificate details
  const { count: wordsLearnedCount } = await supabase
    .from('user_vocab_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', targetUserId)
    .eq('learned', true);

  const { data: completedDays } = await supabase
    .from('user_day_progress')
    .select('completed_at')
    .eq('user_id', targetUserId)
    .not('completed_at', 'is', null);

  const totalDaysCompleted = completedDays?.length || 0;

  // Determine completion date
  let completionDateStr = 'Not Completed Yet';
  if (isGraduated && day90Progress?.completed_at) {
    completionDateStr = new Date(day90Progress.completed_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } else if (completedDays && completedDays.length > 0) {
    const dates = completedDays.map(d => new Date(d.completed_at!).getTime());
    completionDateStr = new Date(Math.max(...dates)).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  const levelInfo = getLevelFromXP(profile.total_xp || 0);

  if (!isGraduated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-6">
        <Link 
          href="/progress" 
          className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-sakura transition-colors select-none self-start"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Lock Graphic */}
        <div className="relative w-24 h-24 flex items-center justify-center bg-sakura/5 text-sakura border border-sakura/20 rounded-full shadow-inner animate-pulse">
          <Lock className="w-10 h-10 text-sakura-deep" />
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-sakura/40 animate-spin" style={{ animationDuration: '15s' }} />
        </div>

        <div className="space-y-2">
          <h1 className="font-display font-black text-3xl text-ink leading-tight">
            Graduate to Unlock Certificate 🎓
          </h1>
          <p className="text-sm text-ink-muted leading-relaxed">
            You've completed <strong className="text-sakura-deep font-bold">{totalDaysCompleted} / 90 days</strong> of your English learning curriculum. Complete Day 90 to unlock your printable, bilingual graduation certificate of completion!
          </p>
        </div>

        {/* Mini stats preview */}
        <div className="grid grid-cols-3 gap-3 w-full bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="flex flex-col items-center p-2 text-center">
            <BookOpen className="w-5 h-5 text-indigo-500 mb-1" />
            <span className="text-base font-black text-ink">{wordsLearnedCount || 0}</span>
            <span className="text-[9px] uppercase tracking-wider text-ink-muted mt-0.5">Vocab Mastered</span>
          </div>
          <div className="flex flex-col items-center p-2 text-center">
            <Clock className="w-5 h-5 text-emerald-500 mb-1" />
            <span className="text-base font-black text-ink">{totalDaysCompleted}</span>
            <span className="text-[9px] uppercase tracking-wider text-ink-muted mt-0.5">Days Active</span>
          </div>
          <div className="flex flex-col items-center p-2 text-center">
            <Award className="w-5 h-5 text-amber-500 mb-1" />
            <span className="text-base font-black text-ink">{profile.level || 1}</span>
            <span className="text-[9px] uppercase tracking-wider text-ink-muted mt-0.5">XP Level</span>
          </div>
        </div>

        {/* Blurry certificate teaser card */}
        <div className="w-full relative border border-border/40 rounded-2xl overflow-hidden shadow-md select-none opacity-40 pointer-events-none">
          <div className="p-8 bg-[#fdfdfc] text-stone-300 font-serif filter blur-[3px] text-center space-y-4">
            <span className="text-lg font-bold">桜英語の旅 Certificate</span>
            <h2 className="text-3xl font-bold">Certificate of Completion</h2>
            <div className="w-2/3 h-1 bg-stone-200 mx-auto rounded-full" />
            <h1 className="text-4xl italic font-light">Student Name</h1>
            <div className="w-1/2 h-1 bg-stone-200 mx-auto rounded-full" />
            <p className="text-xs">has successfully completed the 90-Day Sakura English Journey...</p>
            <div className="flex justify-between mt-8 pt-4 border-t border-stone-100">
              <span className="text-[10px]">Completed: Date</span>
              <span className="text-[10px]">Teacher Signature</span>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent flex items-center justify-center">
            <span className="bg-stone-900/80 text-white font-semibold text-xs py-1.5 px-4 rounded-full flex items-center gap-1.5 shadow-md">
              <Lock className="w-3 h-3 text-sakura" /> Graduates Only
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <Certificate 
        studentName={profile.display_name || user.email || 'Sakura Student'} 
        completionDate={completionDateStr} 
        wordsLearned={wordsLearnedCount || 0} 
        daysCompleted={totalDaysCompleted} 
        cefrLevel={profile.cefr_level || 'A1'} 
        xpLevel={levelInfo.title}
        xpLevelJa={levelInfo.title_ja}
      />
    </div>
  );
}
