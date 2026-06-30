import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EditDayClient from './EditDayClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ n: string }>;
}

export default async function EditDayPage({ params }: PageProps) {
  const { n } = await params;
  const dayNum = parseInt(n, 10);

  if (isNaN(dayNum) || dayNum < 1 || dayNum > 90) {
    redirect('/teacher');
  }

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

  // Fetch curriculum day details
  const { data: dayContent } = await supabase
    .from('days')
    .select('*')
    .eq('day_number', dayNum)
    .single();

  if (!dayContent) {
    redirect('/teacher');
  }

  return (
    <EditDayClient dayNum={dayNum} dayContent={dayContent} />
  );
}
