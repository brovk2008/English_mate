import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ReviewStudentClient from './ReviewStudentClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ day?: string }>;
}

export default async function ReviewStudentPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { day } = await searchParams;
  const dayNum = day ? parseInt(day, 10) : null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Teacher validation
  const teacherEmail = process.env.NEXT_PUBLIC_TEACHER_EMAIL;
  if (user.email !== teacherEmail) {
    redirect('/home');
  }

  // 1. Fetch student profile
  const { data: student } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (!student) {
    redirect('/teacher');
  }

  // 2. If day query param is set, load specific submission review details
  let activeDayProgress = null;
  let activeDayContent = null;

  if (dayNum) {
    const { data: progress } = await supabase
      .from('user_day_progress')
      .select('*')
      .eq('user_id', id)
      .eq('day_number', dayNum)
      .maybeSingle();

    const { data: dayContent } = await supabase
      .from('days')
      .select('*')
      .eq('day_number', dayNum)
      .maybeSingle();

    activeDayProgress = progress;
    activeDayContent = dayContent;
  }

  // 3. Load all submissions list for history view
  const { data: submissionsHistory } = await supabase
    .from('user_day_progress')
    .select('day_number, vocab_done, grammar_done, song_done, listening_done, writing_done, speaking_done, teacher_reviewed, updated_at, diary_word_count')
    .eq('user_id', id)
    .order('day_number', { ascending: false });

  return (
    <ReviewStudentClient
      student={student}
      dayNum={dayNum}
      activeDayProgress={activeDayProgress}
      activeDayContent={activeDayContent}
      submissionsHistory={submissionsHistory || []}
    />
  );
}
