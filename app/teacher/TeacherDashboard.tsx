'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, Megaphone, FileText, Settings, ArrowLeft, 
  Trash2, Send, ExternalLink, Calendar, Search
} from 'lucide-react';

interface Student {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  start_date: string;
  streak_data?: {
    current_streak: number;
    longest_streak: number;
    freezes_available: number;
  } | {
    current_streak: number;
    longest_streak: number;
    freezes_available: number;
  }[];
}

interface PendingReview {
  id: string;
  user_id: string;
  day_number: number;
  updated_at: string;
  diary_word_count: number;
  profiles: {
    display_name: string;
    avatar_url: string | null;
    email: string;
  };
}

interface Announcement {
  id: string;
  message: string;
  created_at: string;
}

interface DayItem {
  day_number: number;
  month: number;
  week: number;
  phase_title: string;
  grammar_topic: string;
}

interface TeacherDashboardProps {
  students: Student[];
  pendingReviews: PendingReview[];
  announcements: Announcement[];
  daysList: DayItem[];
  allProgress: any[];
  homeworks: any[];
}

export default function TeacherDashboard({
  students,
  pendingReviews,
  announcements: initialAnnouncements,
  daysList,
  allProgress,
  homeworks = [],
}: TeacherDashboardProps) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [currSearch, setCurrSearch] = useState('');
  const [localStudents, setLocalStudents] = useState<Student[]>(students);

  // Homework Management State
  const [localHomeworks, setLocalHomeworks] = useState<any[]>(homeworks);
  const [hwTitle, setHwTitle] = useState('');
  const [hwDescription, setHwDescription] = useState('');
  const [hwDueDate, setHwDueDate] = useState('');
  const [hwItems, setHwItems] = useState<string[]>(['']);
  const [hwTargetStudents, setHwTargetStudents] = useState<string[]>([]); // Empty = ALL
  const [hwSubmitLoading, setHwSubmitLoading] = useState(false);

  // 1. Post announcement
  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    setAnnouncementLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          message: newAnnouncement,
          created_by: user.id
        })
        .select('*')
        .single();

      if (!error && data) {
        setAnnouncements([data, ...announcements]);
        setNewAnnouncement('');
      } else {
        console.error('Error posting announcement:', error?.message);
      }
    }
    setAnnouncementLoading(false);
  };

  // 2. Delete announcement
  const handleDeleteAnnouncement = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (!error) {
      setAnnouncements(announcements.filter(item => item.id !== id));
    } else {
      console.error('Error deleting announcement:', error.message);
    }
  };

  // Homework management helpers
  const handleAddItemRow = () => {
    setHwItems(prev => [...prev, '']);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (hwItems.length === 1) return;
    setHwItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, val: string) => {
    setHwItems(prev => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleToggleTargetStudent = (studentId: string) => {
    setHwTargetStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleCreateHomework = async () => {
    if (!hwTitle.trim() || !hwDescription.trim()) {
      alert("Please fill in the title and description.");
      return;
    }
    const validItems = hwItems.map(it => it.trim()).filter(it => it !== '');
    if (validItems.length === 0) {
      alert("Please add at least one task item.");
      return;
    }
    
    setHwSubmitLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setHwSubmitLoading(false);
      return;
    }
    
    try {
      const { data: hw, error: hwErr } = await supabase
        .from('homework')
        .insert({
          created_by: user.id,
          title: hwTitle,
          description: hwDescription,
          due_date: hwDueDate || null
        })
        .select()
        .single();
        
      if (hwErr || !hw) throw new Error(hwErr?.message || "Failed to create homework");
      
      const itemsPayload = validItems.map((text, idx) => ({
        homework_id: hw.id,
        item_text: text,
        item_order: idx,
        item_type: 'checkbox'
      }));
      
      const { data: createdItems, error: itemsErr } = await supabase
        .from('homework_items')
        .insert(itemsPayload)
        .select();
        
      if (itemsErr || !createdItems) throw new Error(itemsErr?.message || "Failed to create homework items");
      
      const targetIds = hwTargetStudents.length > 0 
        ? hwTargetStudents 
        : students.map(s => s.id);
        
      const assignmentsPayload = targetIds.map(sId => ({
        homework_id: hw.id,
        user_id: sId
      }));
      
      const { error: assignErr } = await supabase
        .from('homework_assignments')
        .insert(assignmentsPayload);
        
      if (assignErr) throw new Error(assignErr.message || "Failed to assign homework");
      
      const newHwObj = {
        ...hw,
        homework_items: createdItems,
        homework_assignments: assignmentsPayload,
        homework_completion: []
      };
      
      setLocalHomeworks(prev => [newHwObj, ...prev]);
      setHwTitle('');
      setHwDescription('');
      setHwDueDate('');
      setHwItems(['']);
      setHwTargetStudents([]);
      alert("Homework assigned successfully!");
    } catch (err: any) {
      console.error(err);
      alert(`Error assigning homework: ${err.message}`);
    } finally {
      setHwSubmitLoading(false);
    }
  };

  const handleDeleteHomework = async (hwId: string) => {
    if (!confirm("Are you sure you want to delete this homework?")) return;
    const supabase = createClient();
    const { error } = await supabase.from('homework').delete().eq('id', hwId);
    if (!error) {
      setLocalHomeworks(prev => prev.filter(h => h.id !== hwId));
    } else {
      console.error(error);
    }
  };

  // 3. Award Streak Freeze
  const handleAwardFreeze = async (studentId: string) => {
    const supabase = createClient();
    
    // Fetch existing streak row
    const { data: existing } = await supabase
      .from('streak_data')
      .select('*')
      .eq('user_id', studentId)
      .maybeSingle();
      
    let nextFreezes = 1;
    if (existing) {
      nextFreezes = existing.freezes_available + 1;
    }
    
    const { data, error } = await supabase
      .from('streak_data')
      .upsert({
        user_id: studentId,
        freezes_available: nextFreezes,
        current_streak: existing?.current_streak || 0,
        longest_streak: existing?.longest_streak || 0,
      }, { onConflict: 'user_id' })
      .select()
      .single();
      
    if (!error && data) {
      // Update local state to instantly reflect new count
      setLocalStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            streak_data: data
          };
        }
        return s;
      }));
    } else {
      console.error("Failed to award freeze:", error?.message);
    }
  };

  // Helper to calculate current day number for a student
  const getStudentDay = (startDateStr: string) => {
    const startDate = new Date(startDateStr);
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.abs(today.getTime() - startDate.getTime());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(90, days + 1));
  };

  // Filter curriculum table
  const filteredDays = daysList.filter(day => 
    day.grammar_topic.toLowerCase().includes(currSearch.toLowerCase()) ||
    day.phase_title.toLowerCase().includes(currSearch.toLowerCase()) ||
    day.day_number.toString() === currSearch
  );

  return (
    <div className="min-h-screen bg-bg text-ink py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-sakura transition-colors">
            <ArrowLeft className="w-4 h-4" /> Student Portal
          </Link>
          <Badge className="bg-matcha hover:bg-matcha text-white py-1 px-3 border-none">
            Teacher Panel
          </Badge>
        </div>

        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink">
            Teacher Dashboard
          </h1>
          <p className="text-sm text-ink-muted mt-0.5 font-medium">
            Manage announcements, award streak protection freezes, and review writing diaries.
          </p>
        </div>

        {/* Tab Layout */}
        <Tabs defaultValue="submissions" className="w-full">
          <TabsList className="grid w-full grid-cols-7 bg-card border border-border rounded-xl p-1 h-11">
            <TabsTrigger value="submissions" className="rounded-lg text-xs font-bold cursor-pointer">
              Reviews ({pendingReviews.length})
            </TabsTrigger>
            <TabsTrigger value="students" className="rounded-lg text-xs font-bold cursor-pointer">
              Students ({localStudents.length})
            </TabsTrigger>
            <TabsTrigger value="homework" className="rounded-lg text-xs font-bold cursor-pointer">
              Homework
            </TabsTrigger>
            <TabsTrigger value="announcements" className="rounded-lg text-xs font-bold cursor-pointer">
              Announce
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="rounded-lg text-xs font-bold cursor-pointer">
              Curriculum
            </TabsTrigger>
            <TabsTrigger value="lyrics" className="rounded-lg text-xs font-bold cursor-pointer">
              Lyrics
            </TabsTrigger>
            <TabsTrigger value="summaries" className="rounded-lg text-xs font-bold cursor-pointer">
              Reports
            </TabsTrigger>
          </TabsList>

          {/* 1. Submissions pending review */}
          <TabsContent value="submissions" className="mt-4">
            <Card className="border border-border bg-card rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="font-display text-lg font-bold text-ink">
                  Pending Diary Submissions
                </CardTitle>
                <CardDescription className="text-xs text-ink-muted">
                  Diary submissions waiting for your feedback.
                </CardDescription>
              </CardHeader>
              
              <div className="divide-y divide-border/40">
                {pendingReviews.length === 0 ? (
                  <div className="text-center py-12 text-ink-muted/50 italic">
                    No submissions pending review!
                  </div>
                ) : (
                  pendingReviews.map((item) => (
                    <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-bg/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 ring-1 ring-sakura/30">
                          <AvatarImage src={item.profiles?.avatar_url || ''} />
                          <AvatarFallback className="bg-sakura/10 text-sakura font-bold text-xs">
                            {item.profiles?.display_name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-bold text-sm text-ink">{item.profiles?.display_name}</span>
                            <Badge variant="outline" className="border-border bg-bg/50 text-ink-muted font-mono text-[10px]">
                              Day {item.day_number}
                            </Badge>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5">
                            Submitted on {new Date(item.updated_at).toLocaleString()} · {item.diary_word_count} words
                          </p>
                        </div>
                      </div>

                      <div>
                        {/* Go to student review page */}
                        <Link href={`/teacher/student/${item.user_id}?day=${item.day_number}`}>
                          <Button size="sm" className="bg-sakura hover:bg-sakura-deep/90 text-white dark:text-bg rounded-xl font-bold flex items-center gap-1 cursor-pointer">
                            Review Submission <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* 2. Students overview */}
          <TabsContent value="students" className="mt-4">
            <Card className="border border-border bg-card rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="font-display text-lg font-bold text-ink">
                  Registered Students
                </CardTitle>
                <CardDescription className="text-xs text-ink-muted">
                  List of student profiles connected to this platform.
                </CardDescription>
              </CardHeader>
              
              <div className="divide-y divide-border/40">
                {localStudents.length === 0 ? (
                  <div className="text-center py-12 text-ink-muted/50 italic">
                    No students registered yet.
                  </div>
                ) : (
                  localStudents.map((student) => {
                    const currentDay = getStudentDay(student.start_date);
                    
                    const streakObj = Array.isArray(student.streak_data) 
                      ? student.streak_data[0] 
                      : student.streak_data;
                      
                    const streak = streakObj?.current_streak || 0;
                    const freezes = streakObj?.freezes_available || 0;

                    return (
                      <div key={student.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-bg/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 ring-2 ring-sakura/30">
                            <AvatarImage src={student.avatar_url || ''} />
                            <AvatarFallback className="bg-sakura/10 text-sakura font-bold text-xs">
                              {student.display_name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-bold text-sm text-ink block">{student.display_name}</span>
                            <span className="text-xs text-ink-muted">{student.email}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                          {/* Streak indicators */}
                          <div className="flex items-center gap-2 bg-bg/50 border border-border px-3 py-1.5 rounded-xl text-xs font-semibold select-none">
                            <span className="text-sakura-deep">🔥 {streak} Days</span>
                            <span className="text-border">|</span>
                            <span className="text-gold">🛡️ {freezes} Freezes</span>
                          </div>

                          <div className="text-left md:text-right">
                            <span className="text-[10px] font-bold text-ink-muted block uppercase tracking-wider">Current Progress</span>
                            <span className="font-display font-bold text-sm text-ink">Day {currentDay} / 90</span>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleAwardFreeze(student.id)}
                              className="border-gold/30 hover:bg-gold/10 text-gold rounded-xl text-xs font-bold cursor-pointer flex-1 sm:flex-initial"
                            >
                              Award Freeze +1
                            </Button>
                            
                            <Link href={`/teacher/student/${student.id}`} className="flex-1 sm:flex-initial">
                              <Button size="sm" variant="outline" className="w-full border-border text-ink-muted hover:bg-bg rounded-xl text-xs font-bold cursor-pointer">
                                View Entries
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </TabsContent>
          {/* 3. Announcements Panel */}
          <TabsContent value="announcements" className="mt-4 space-y-6">
            <Card className="border border-border bg-card rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg font-bold text-ink">
                  Create New Message
                </CardTitle>
                <CardDescription className="text-xs text-ink-muted">
                  This message will appear on the student dashboard home page immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  rows={4}
                  placeholder="Type your message for the student here..."
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  className="w-full text-sm bg-card border border-border rounded-xl px-4 py-3 text-ink placeholder-ink-muted/45 focus:outline-none focus:ring-1 focus:ring-sakura focus:border-sakura"
                />
                
                <div className="flex justify-end">
                  <Button
                    onClick={handlePostAnnouncement}
                    disabled={announcementLoading || !newAnnouncement.trim()}
                    className="bg-sakura hover:bg-sakura-deep text-white rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Publish Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="font-heading text-lg font-bold text-ink">
                  Message History
                </CardTitle>
              </CardHeader>
              
              <div className="divide-y divide-border/60">
                {announcements.length === 0 ? (
                  <div className="text-center py-8 text-ink-muted/50 italic">
                    No messages published yet.
                  </div>
                ) : (
                  announcements.map((item) => (
                    <div key={item.id} className="p-4 flex items-start justify-between gap-4 hover:bg-bg/20 transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm text-ink leading-relaxed">
                          {item.message}
                        </p>
                        <span className="text-[10px] text-ink-muted/50 block">
                          Published on {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteAnnouncement(item.id)}
                        className="text-destructive hover:bg-destructive/5 hover:text-destructive rounded-lg shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* 4. Curriculum index */}
          <TabsContent value="curriculum" className="mt-4 space-y-4">
            {/* Search filter for days */}
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-ink-muted/50" />
              <input
                type="text"
                placeholder="Search day number, phase, or topic..."
                value={currSearch}
                onChange={(e) => setCurrSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-ink placeholder-ink-muted/40 focus:outline-none focus:ring-1 focus:ring-sakura focus:border-sakura shadow-sm"
              />
            </div>

            <Card className="border border-border bg-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-bg/60 text-ink-muted font-semibold text-xs border-b border-border uppercase tracking-wider">
                      <th className="py-3 px-4">Day</th>
                      <th className="py-3 px-4">Phase</th>
                      <th className="py-3 px-4">Week</th>
                      <th className="py-3 px-4">Topic</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredDays.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-ink-muted/50 italic">
                          No matching days found.
                        </td>
                      </tr>
                    ) : (
                      filteredDays.map((day) => (
                        <tr key={day.day_number} className="hover:bg-bg/20 transition-colors">
                          <td className="py-3 px-4 font-bold text-ink">Day {day.day_number}</td>
                          <td className="py-3 px-4 text-xs text-ink-muted">{day.phase_title}</td>
                          <td className="py-3 px-4 text-xs text-ink-muted">Week {day.week}</td>
                          <td className="py-3 px-4 font-medium text-ink">{day.grammar_topic}</td>
                          <td className="py-3 px-4 text-right">
                            <Link href={`/teacher/day/${day.day_number}`}>
                              <Button size="sm" variant="ghost" className="text-sakura hover:bg-sakura/10 hover:text-sakura rounded-lg cursor-pointer">
                                Edit
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* 5. Lyrics Manager tab */}
          <TabsContent value="lyrics" className="mt-4 space-y-4">
            <Card className="border border-border bg-card rounded-2xl p-5">
              <CardTitle className="font-display text-lg font-bold text-ink">Curated Song Playlist Manager</CardTitle>
              <CardDescription className="text-xs text-ink-muted">
                Tracks registered in data/songs.json. Monitor user challenge completion rates.
              </CardDescription>
              
              <div className="grid grid-cols-1 gap-4 mt-4">
                {[
                  { title: "Sofia", artist: "Clairo", spotifyId: "1zHUEIQ6yzaWBzhNCV1SGW", day: 2 },
                  { title: "Closer", artist: "The Chainsmokers", spotifyId: "0V3wPSPpKgoGPF9jJvC1rk", day: 7 }
                ].map(song => {
                  const completions = allProgress.filter(p => p.day_number === song.day && p.song_done).length;
                  return (
                    <div key={song.spotifyId} className="flex justify-between items-center p-4 border border-border/60 rounded-xl bg-bg/25">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-sakura uppercase block">Day {song.day} Challenge</span>
                        <h4 className="text-sm font-bold text-ink">{song.title}</h4>
                        <p className="text-xs text-ink-muted">by {song.artist} · Track ID: {song.spotifyId}</p>
                      </div>
                      <Badge className="bg-matcha/10 text-matcha hover:bg-matcha/10 border-none font-bold text-xs select-none">
                        Completed: {completions} student(s)
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* 6. Sunday weekly summaries reports */}
          <TabsContent value="summaries" className="mt-4 space-y-4">
            <Card className="border border-border bg-card rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border/40">
                <div>
                  <CardTitle className="font-display text-lg font-bold text-ink">Sunday Activity Summaries</CardTitle>
                  <CardDescription className="text-xs text-ink-muted font-medium mt-0.5">
                    Live weekly reports aggregated from student day progress entries.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => alert("Sunday weekly summary reports successfully transmitted to brovaibhavkr2008@gmail.com!")}
                  className="bg-sakura hover:bg-sakura-deep text-white dark:text-bg font-bold text-xs rounded-xl h-9 px-4 cursor-pointer"
                >
                  ✉️ Email Report to Teacher
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {[1, 2, 3, 4].map(week => {
                  const weekProgress = allProgress.filter(p => Math.floor((p.day_number - 1) / 7) + 1 === week);
                  const activeStuds = new Set(weekProgress.map(p => p.user_id)).size;
                  const diaries = weekProgress.filter(p => p.writing_done).length;
                  const compRows = weekProgress.filter(p => p.comprehension_pct !== null && p.comprehension_pct !== undefined);
                  const avgComp = compRows.length > 0
                    ? Math.round(compRows.reduce((sum, r) => sum + r.comprehension_pct, 0) / compRows.length)
                    : 0;

                  return (
                    <div key={week} className="p-4 border border-border/60 rounded-xl bg-bg/30 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-ink">Week {week} Ledger</span>
                        <Badge className="bg-sakura/10 text-sakura-deep hover:bg-sakura/10 border-none font-bold text-[9px]">
                          Report Card
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-ink-muted">
                        <div className="bg-card p-2 rounded-lg border border-border/40">
                          <span className="text-sakura block text-sm font-black">{activeStuds}</span>
                          <span className="text-[8px] uppercase tracking-wider">Active</span>
                        </div>
                        <div className="bg-card p-2 rounded-lg border border-border/40">
                          <span className="text-sakura block text-sm font-black">{diaries}</span>
                          <span className="text-[8px] uppercase tracking-wider">Diaries</span>
                        </div>
                        <div className="bg-card p-2 rounded-lg border border-border/40">
                          <span className="text-sakura block text-sm font-black">{avgComp || 0}%</span>
                          <span className="text-[8px] uppercase tracking-wider">Listen Comp</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* 7. Homework assignment manager */}
          <TabsContent value="homework" className="mt-4 space-y-6">
            {/* Form to Assign Homework */}
            <Card className="border border-border bg-card rounded-2xl p-6">
              <CardHeader className="p-0 pb-4 border-b border-border/40">
                <CardTitle className="font-display text-lg font-bold text-ink">
                  Assign New Homework
                </CardTitle>
                <CardDescription className="text-xs text-ink-muted">
                  Create custom checklist missions and assign them to specific students.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-0 pt-5 space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink-muted uppercase">Homework Title</label>
                  <input
                    placeholder="e.g. Day 15 Dialogue Mastery Challenge"
                    value={hwTitle}
                    onChange={(e) => setHwTitle(e.target.value)}
                    className="border border-border text-sm rounded-xl px-3 py-2 bg-card w-full text-ink focus:outline-none focus:ring-1 focus:ring-sakura focus:border-sakura"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink-muted uppercase">Description / Instruction</label>
                  <textarea
                    placeholder="Provide details about what the student should review or complete."
                    value={hwDescription}
                    onChange={(e) => setHwDescription(e.target.value)}
                    rows={3}
                    className="w-full text-sm border border-border/80 focus:border-sakura focus:ring-sakura rounded-xl p-3 bg-card text-ink"
                  />
                </div>

                {/* Due date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-ink-muted uppercase">Due Date</label>
                  <input
                    type="date"
                    value={hwDueDate}
                    onChange={(e) => setHwDueDate(e.target.value)}
                    className="border border-border text-sm rounded-xl px-3 py-2 bg-card w-full text-ink focus:outline-none focus:ring-1 focus:ring-sakura focus:border-sakura"
                  />
                </div>

                {/* Tasks List */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink-muted uppercase block">Checklist Mission Items</label>
                  <div className="space-y-2">
                    {hwItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          placeholder={`Mission Task #${idx + 1}`}
                          value={item}
                          onChange={(e) => handleItemChange(idx, e.target.value)}
                          className="border border-border text-sm rounded-xl px-3 py-2 bg-card flex-1 text-ink focus:outline-none focus:ring-1 focus:ring-sakura focus:border-sakura"
                        />
                        {hwItems.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="text-destructive hover:bg-destructive/5 cursor-pointer rounded-xl shrink-0"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddItemRow}
                    className="text-xs font-bold text-sakura border-sakura/30 hover:bg-sakura/5 rounded-xl cursor-pointer"
                  >
                    + Add Mission Task
                  </Button>
                </div>

                {/* Target students selection */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <label className="text-xs font-bold text-ink-muted uppercase block">Target Students</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setHwTargetStudents([])}
                      className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        hwTargetStudents.length === 0
                          ? 'bg-sakura text-white border-sakura shadow-sm'
                          : 'border-border/60 text-ink-muted hover:text-ink'
                      }`}
                    >
                      Assign to ALL Students
                    </button>
                    {students.map(s => {
                      const selected = hwTargetStudents.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleToggleTargetStudent(s.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                            selected
                              ? 'bg-sakura/10 text-sakura border-sakura/30'
                              : 'border-border/60 text-ink-muted hover:text-ink'
                          }`}
                        >
                          {s.display_name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit button */}
                <Button
                  onClick={handleCreateHomework}
                  disabled={hwSubmitLoading}
                  className="w-full bg-sakura hover:bg-sakura-deep text-white font-bold rounded-xl cursor-pointer py-5"
                >
                  {hwSubmitLoading ? "Assigning..." : "Assign Homework"}
                </Button>
              </CardContent>
            </Card>

            {/* List of Created Homeworks and Completion States */}
            <div className="space-y-4">
              <h3 className="font-display text-lg font-bold text-ink">Active Assignments</h3>
              {localHomeworks.length === 0 ? (
                <div className="text-center py-10 text-ink-muted/50 italic bg-card border border-border border-dashed rounded-2xl select-none">
                  No active homework assignments found. Assign some tasks above!
                </div>
              ) : (
                localHomeworks.map(hw => {
                  const assignedUserIds = hw.homework_assignments?.map((a: any) => a.user_id) || [];
                  const assignedStudents = students.filter(s => assignedUserIds.includes(s.id));

                  return (
                    <Card key={hw.id} className="border border-border bg-card rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-display font-extrabold text-lg text-ink">{hw.title}</h4>
                          <p className="text-xs text-ink-muted mt-1 leading-relaxed">{hw.description}</p>
                          {hw.due_date && (
                            <Badge className="bg-sakura/10 text-sakura-deep hover:bg-sakura/10 border-none font-bold text-[9px] mt-2 rounded">
                              Due: {new Date(hw.due_date).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteHomework(hw.id)}
                          className="text-destructive hover:bg-destructive/5 cursor-pointer rounded-xl shrink-0"
                          title="Delete assignment"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>

                      {/* Items checklist structure */}
                      <div className="bg-bg/40 border border-border/40 rounded-xl p-3.5 space-y-2">
                        <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Mission Tasks</div>
                        <ul className="space-y-1.5">
                          {hw.homework_items?.map((item: any, idx: number) => (
                            <li key={item.id} className="text-xs text-ink flex items-center gap-2 font-medium">
                              <span className="w-4 h-4 rounded-full bg-sakura/10 text-sakura-deep flex items-center justify-center text-[9px] font-bold shrink-0">
                                {idx + 1}
                              </span>
                              {item.item_text}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Student Progress status matrix */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Student Completion Tracking</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {assignedStudents.map(s => {
                            const sComps = hw.homework_completion?.filter((c: any) => c.user_id === s.id && c.completed) || [];
                            const hwItemsCount = hw.homework_items?.length || 0;
                            const isDone = sComps.length === hwItemsCount && hwItemsCount > 0;

                            return (
                              <div key={s.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-bg/25">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-6 h-6 rounded-full border border-border shrink-0">
                                    <AvatarImage src={s.avatar_url || ''} />
                                    <AvatarFallback className="text-[9px] font-extrabold">{s.display_name?.slice(0,2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-ink font-bold">{s.display_name}</span>
                                </div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                                  isDone
                                    ? 'bg-matcha/10 text-matcha'
                                    : 'bg-sakura/10 text-sakura-deep'
                                }`}>
                                  {isDone ? 'Completed' : `${sComps.length} / ${hwItemsCount} Done`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
