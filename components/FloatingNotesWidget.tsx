'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, X, Save, Trash, FileText, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { haptic } from '@/lib/haptics';

interface NoteItem {
  id: string;
  content: string;
  day_number: number | null;
  page_context: string;
  created_at: string;
}

export default function FloatingNotesWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [existingNotes, setExistingNotes] = useState<NoteItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Parse day number from pathname: e.g. "/day/2" -> 2
  const dayMatch = pathname?.match(/\/day\/(\d+)/);
  const dayNumber = dayMatch ? parseInt(dayMatch[1], 10) : null;

  const fetchNotes = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id);

    if (dayNumber !== null) {
      query = query.eq('day_number', dayNumber);
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (data) {
      setExistingNotes(data);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotes();
    }
  }, [isOpen, pathname, dayNumber]);

  const handleSaveNote = async () => {
    if (!content.trim()) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaveStatus('saving');
    haptic.light();

    try {
      if (editingId) {
        await supabase
          .from('notes')
          .update({
            content,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        setEditingId(null);
      } else {
        await supabase
          .from('notes')
          .insert({
            user_id: user.id,
            content,
            day_number: dayNumber,
            page_context: pathname
          });
      }

      setContent('');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
      fetchNotes();
    } catch (err) {
      console.error('Failed to save note:', err);
      setSaveStatus('idle');
    }
  };

  const handleEditNote = (note: NoteItem) => {
    setContent(note.content);
    setEditingId(note.id);
    haptic.light();
  };

  const handleDeleteNote = async (id: string) => {
    const supabase = createClient();
    haptic.light();

    try {
      await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      setExistingNotes(prev => prev.filter(n => n.id !== id));
      if (editingId === id) {
        setContent('');
        setEditingId(null);
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Do not show widget on non-student routes or onboarding screens
  const isStudentRoute = pathname?.startsWith('/home') || pathname?.startsWith('/day') || pathname?.startsWith('/vocabulary') || pathname?.startsWith('/grammar') || pathname?.startsWith('/progress') || pathname?.startsWith('/mistakes') || pathname?.startsWith('/reading') || pathname?.startsWith('/conversation') || pathname?.startsWith('/sentence-builder') || pathname?.startsWith('/songs') || pathname?.startsWith('/speaking');

  if (!isStudentRoute) return null;

  return (
    <div className="fixed bottom-20 right-6 sm:bottom-6 sm:right-6 z-40 select-none">
      {!isOpen ? (
        <button
          onClick={() => {
            setIsOpen(true);
            haptic.light();
          }}
          className="w-12 h-12 rounded-full bg-sakura hover:bg-sakura-deep text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer border border-sakura/25 animate-bounce"
        >
          <Pencil size={18} />
        </button>
      ) : (
        <Card className="w-80 border border-border bg-[#FAF6F1]/95 dark:bg-card/95 backdrop-blur-md rounded-2xl p-4 shadow-xl space-y-4 animate-fade-in relative max-h-[380px] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-1.5 text-sakura-deep font-display font-extrabold text-xs">
              <FileText size={14} />
              <span>Notes Room {dayNumber !== null ? `(Day ${dayNumber})` : '(General)'}</span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                haptic.light();
              }}
              className="text-ink-muted hover:text-sakura p-0.5 rounded-full hover:bg-bg/40 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-2">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={(e) => {
                setTimeout(() => {
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
              }}
              placeholder="Jot down a vocabulary word, grammar pattern, or note..."
              className="w-full text-xs min-h-[70px] bg-bg/30 border-border hover:border-sakura focus:border-sakura focus:ring-1 focus:ring-sakura rounded-xl"
            />
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-ink-muted">
                {editingId ? 'Editing existing note' : 'Auto-tagged to active route'}
              </span>
              <Button
                size="sm"
                onClick={handleSaveNote}
                disabled={!content.trim()}
                className="bg-sakura hover:bg-sakura-deep text-white dark:text-bg rounded-lg text-[10px] h-7 px-3.5 cursor-pointer shadow-xs flex items-center gap-1"
              >
                {saveStatus === 'saving' ? (
                  'Saving...'
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check size={10} /> Saved
                  </>
                ) : (
                  <>
                    <Save size={10} /> {editingId ? 'Update' : 'Save'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* List of existing notes */}
          {existingNotes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/40 max-h-[160px] overflow-y-auto pr-1">
              <span className="text-[8px] font-bold text-ink-muted uppercase tracking-wider block">
                Saved Notes:
              </span>
              <div className="space-y-2">
                {existingNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2.5 rounded-xl bg-card border border-border/60 text-[10px] space-y-1.5 relative group"
                  >
                    <p className="text-ink leading-relaxed whitespace-pre-wrap font-medium">
                      {note.content}
                    </p>
                    <div className="flex justify-between items-center text-[8px] text-ink-muted">
                      <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditNote(note)}
                          className="hover:text-sakura cursor-pointer"
                        >
                          Edit
                        </button>
                        <span>·</span>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="hover:text-red-500 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
