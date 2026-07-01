'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, BookOpen, Search, Trash, Pencil, Check, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { haptic } from '@/lib/haptics';

interface NoteItem {
  id: string;
  content: string;
  day_number: number | null;
  page_context: string;
  created_at: string;
}

interface NotesSearchClientProps {
  initialNotes: NoteItem[];
}

export default function NotesSearchClient({ initialNotes }: NotesSearchClientProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [search, setSearch] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    haptic.light();

    try {
      await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      setNotes(prev => prev.filter(n => n.id !== id));
      if (editingNoteId === id) {
        setEditingNoteId(null);
        setEditContent('');
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const handleStartEdit = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
    haptic.light();
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;

    const supabase = createClient();
    haptic.success();

    try {
      await supabase
        .from('notes')
        .update({
          content: editContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      setNotes(prev => prev.map(n => n.id === id ? { ...n, content: editContent } : n));
      setEditingNoteId(null);
      setEditContent('');
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.content.toLowerCase().includes(search.toLowerCase());
    const matchesDay = dayFilter === '' || n.day_number?.toString() === dayFilter.trim();
    return matchesSearch && matchesDay;
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6 select-none animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/home')}
          className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-sakura transition-colors cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <span className="text-xs font-bold text-ink-muted font-mono select-none">
          Notebook Search Workspace
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-sakura animate-pulse" />
          My Personal Notebook
        </h1>
        <p className="text-xs text-ink-muted leading-relaxed max-w-md">
          Search and manage all the quick notes you jotted down during vocabulary, grammar, and lesson drills.
        </p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-ink-muted/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by keywords..."
            className="pl-10 h-10 border-border bg-bg/25 hover:border-sakura focus:border-sakura focus:ring-1 focus:ring-sakura rounded-xl text-sm w-full"
          />
        </div>

        <div className="w-full sm:w-44">
          <input
            type="number"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            placeholder="Filter by Day # (e.g. 5)"
            className="h-10 border-border bg-bg/25 hover:border-sakura focus:border-sakura focus:ring-1 focus:ring-sakura rounded-xl text-sm w-full"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-16 text-sm text-ink-muted/50 italic border border-dashed border-border rounded-2xl select-none">
            No notes found matching your filters.
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isEditing = editingNoteId === note.id;

            return (
              <Card
                key={note.id}
                className="border border-border bg-card rounded-2xl transition-all shadow-sm border-l-4 border-l-sakura"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-sakura/10 text-sakura-deep hover:bg-sakura/10 border-none font-bold text-[9px] select-none">
                        {note.day_number ? `Day ${note.day_number}` : 'General Note'}
                      </Badge>
                      <span className="text-[10px] text-ink-muted font-mono">
                        Route: {note.page_context}
                      </span>
                    </div>

                    <span className="text-[10px] text-ink-muted font-semibold">
                      Created: {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onFocus={(e) => {
                          setTimeout(() => {
                            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 300);
                        }}
                        className="w-full text-xs min-h-[90px] border-border bg-bg/20 rounded-xl"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingNoteId(null)}
                          className="text-[10px] h-8 rounded-lg cursor-pointer"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(note.id)}
                          className="bg-sakura hover:bg-sakura-deep text-white dark:text-bg rounded-lg text-[10px] h-8 px-4 cursor-pointer flex items-center gap-1"
                        >
                          <Check size={12} /> Save Update
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-ink leading-relaxed whitespace-pre-wrap select-text selection:bg-sakura/25">
                      {note.content}
                    </p>
                  )}

                  {!isEditing && (
                    <div className="flex justify-end items-center gap-2 border-t border-border/40 pt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(note)}
                        className="text-[10px] h-7 rounded-lg text-ink-muted hover:text-sakura cursor-pointer flex items-center gap-1"
                      >
                        <Pencil size={11} /> Edit Note
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(note.id)}
                        className="text-[10px] h-7 rounded-lg text-ink-muted hover:text-red-500 cursor-pointer flex items-center gap-1"
                      >
                        <Trash size={11} /> Delete
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
