import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TeacherDashboard from './TeacherDashboard';

export const dynamic = 'force-dynamic';

export default async function TeacherPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Double check teacher email restriction
  const teacherEmail = process.env.NEXT_PUBLIC_TEACHER_EMAIL;
  if (user.email !== teacherEmail) {
    redirect('/home');
  }

  // 1. Fetch all student profiles with their streak and freeze counts joined
  const { data: students } = await supabase
    .from('profiles')
    .select('*, streak_data(*)')
    .eq('role', 'student');

  // 2. Fetch pending student reviews (writing_done = true, teacher_reviewed = false)
  const { data: pendingReviews } = await supabase
    .from('user_day_progress')
    .select('*, profiles(display_name, avatar_url, email)')
    .eq('writing_done', true)
    .eq('teacher_reviewed', false)
    .order('updated_at', { ascending: true });

  // 3. Fetch announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  // 4. Fetch all 90 curriculum days for index
  const { data: daysList } = await supabase
    .from('days')
    .select('day_number, month, week, phase_title, grammar_topic')
    .order('day_number', { ascending: true });

  // 5. Fetch all student day progress records for weekly summaries
  const { data: allProgress } = await supabase
    .from('user_day_progress')
    .select('*, profiles(display_name, email)');

  // 6. Fetch homeworks, homework_items, homework_assignments, homework_completion
  const { data: homeworks } = await supabase
    .from('homework')
    .select('*, homework_items(*), homework_assignments(*), homework_completion(*)')
    .order('created_at', { ascending: false });

  return (
    <TeacherDashboard
      students={students || []}
      pendingReviews={pendingReviews || []}
      announcements={announcements || []}
      daysList={daysList || []}
      allProgress={allProgress || []}
      homeworks={homeworks || []}
    />
  );
}
