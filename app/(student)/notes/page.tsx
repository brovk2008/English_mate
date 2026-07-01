import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NotesSearchClient from './NotesSearchClient';

export const dynamic = 'force-dynamic';

export default async function NotesSearchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Fetch all user notes
  const { data: notes } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <NotesSearchClient
      initialNotes={notes || []}
    />
  );
}
