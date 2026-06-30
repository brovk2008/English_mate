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
}

export default function TeacherDashboard({
  students,
  pendingReviews,
  announcements: initialAnnouncements,
  daysList,
}: TeacherDashboardProps) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [currSearch, setCurrSearch] = useState('');

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
    <div className="min-h-screen bg-[#FAF6F1] py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-1.5 text-sm text-[#73706B] hover:text-[#E8A6B8] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Student Portal
          </Link>
          <Badge className="bg-[#5B7F6B] hover:bg-[#5B7F6B] text-white py-1 px-3">
            Teacher Panel
          </Badge>
        </div>

        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-[#33312E]">
            Teacher Dashboard
          </h1>
          <p className="text-sm text-[#73706B]">
            Manage announcements, customize curriculum, and review student progress.
          </p>
        </div>

        {/* Tab Layout */}
        <Tabs defaultValue="submissions" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-[#E8E2D9] rounded-xl p-1 h-11">
            <TabsTrigger value="submissions" className="rounded-lg text-xs font-semibold cursor-pointer">
              Reviews ({pendingReviews.length})
            </TabsTrigger>
            <TabsTrigger value="students" className="rounded-lg text-xs font-semibold cursor-pointer">
              Students ({students.length})
            </TabsTrigger>
            <TabsTrigger value="announcements" className="rounded-lg text-xs font-semibold cursor-pointer">
              Announce
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="rounded-lg text-xs font-semibold cursor-pointer">
              Curriculum
            </TabsTrigger>
          </TabsList>

          {/* 1. Submissions pending review */}
          <TabsContent value="submissions" className="mt-4">
            <Card className="border border-[#E8E2D9] bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-[#FAF6F1]">
                <CardTitle className="font-heading text-lg font-bold text-[#33312E]">
                  Pending Diary Submissions
                </CardTitle>
                <CardDescription className="text-xs text-[#73706B]">
                  Diary submissions waiting for your feedback.
                </CardDescription>
              </CardHeader>
              
              <div className="divide-y divide-[#FAF6F1]/80">
                {pendingReviews.length === 0 ? (
                  <div className="text-center py-12 text-[#73706B]/50 italic">
                    No submissions pending review!
                  </div>
                ) : (
                  pendingReviews.map((item) => (
                    <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#FAF6F1]/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 ring-1 ring-[#E8A6B8]/30">
                          <AvatarImage src={item.profiles?.avatar_url || ''} />
                          <AvatarFallback className="bg-[#FAF1F3] text-[#E8A6B8] font-bold text-xs">
                            {item.profiles?.display_name?.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-bold text-sm text-[#33312E]">{item.profiles?.display_name}</span>
                            <Badge variant="outline" className="border-[#E8E2D9] bg-[#FAF6F1]/50 text-[#73706B] font-mono text-[10px]">
                              Day {item.day_number}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#73706B] mt-0.5">
                            Submitted on {new Date(item.updated_at).toLocaleString()} · {item.diary_word_count} words
                          </p>
                        </div>
                      </div>

                      <div>
                        {/* Go to student review page */}
                        <Link href={`/teacher/student/${item.user_id}?day=${item.day_number}`}>
                          <Button size="sm" className="bg-[#E8A6B8] hover:bg-[#E293A7] text-white rounded-lg flex items-center gap-1 cursor-pointer">
                            Review Submission <ExternalLink className="w-3 h-3" />
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
            <Card className="border border-[#E8E2D9] bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-[#FAF6F1]">
                <CardTitle className="font-heading text-lg font-bold text-[#33312E]">
                  Registered Students
                </CardTitle>
                <CardDescription className="text-xs text-[#73706B]">
                  List of student profiles connected to this platform.
                </CardDescription>
              </CardHeader>
              
              <div className="divide-y divide-[#FAF6F1]/80">
                {students.length === 0 ? (
                  <div className="text-center py-12 text-[#73706B]/50 italic">
                    No students registered yet.
                  </div>
                ) : (
                  students.map((student) => {
                    const currentDay = getStudentDay(student.start_date);
                    return (
                      <div key={student.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#FAF6F1]/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 ring-2 ring-[#E8A6B8]/30">
                            <AvatarImage src={student.avatar_url || ''} />
                            <AvatarFallback className="bg-[#FAF1F3] text-[#E8A6B8] font-bold text-xs">
                              {student.display_name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-bold text-sm text-[#33312E] block">{student.display_name}</span>
                            <span className="text-xs text-[#73706B]">{student.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                          <div className="text-right">
                            <span className="text-xs text-[#73706B] block">Current Day</span>
                            <span className="font-heading font-bold text-base text-[#33312E]">Day {currentDay} / 90</span>
                          </div>

                          <Link href={`/teacher/student/${student.id}`}>
                            <Button size="sm" variant="outline" className="border-[#E8E2D9] text-[#73706B] hover:bg-[#FAF6F1] cursor-pointer">
                              View Submissions
                            </Button>
                          </Link>
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
            <Card className="border border-[#E8E2D9] bg-white rounded-2xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg font-bold text-[#33312E]">
                  Create New Message
                </CardTitle>
                <CardDescription className="text-xs text-[#73706B]">
                  This message will appear on the student dashboard home page immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  rows={4}
                  placeholder="Type your message for the student here..."
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-3 text-[#33312E] placeholder-[#73706B]/40 focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                />
                
                <div className="flex justify-end">
                  <Button
                    onClick={handlePostAnnouncement}
                    disabled={announcementLoading || !newAnnouncement.trim()}
                    className="bg-[#E8A6B8] hover:bg-[#E293A7] text-white rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Publish Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#E8E2D9] bg-white rounded-2xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-[#FAF6F1]">
                <CardTitle className="font-heading text-lg font-bold text-[#33312E]">
                  Message History
                </CardTitle>
              </CardHeader>
              
              <div className="divide-y divide-[#FAF6F1]/80">
                {announcements.length === 0 ? (
                  <div className="text-center py-8 text-[#73706B]/50 italic">
                    No messages published yet.
                  </div>
                ) : (
                  announcements.map((item) => (
                    <div key={item.id} className="p-4 flex items-start justify-between gap-4 hover:bg-[#FAF6F1]/20 transition-colors">
                      <div className="space-y-1">
                        <p className="text-sm text-[#33312E] leading-relaxed">
                          {item.message}
                        </p>
                        <span className="text-[10px] text-[#73706B]/50 block">
                          Published on {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteAnnouncement(item.id)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg shrink-0 cursor-pointer"
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
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-[#73706B]/50" />
              <input
                type="text"
                placeholder="Search day number, phase, or topic..."
                value={currSearch}
                onChange={(e) => setCurrSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white border border-[#E8E2D9] rounded-xl text-sm text-[#33312E] placeholder-[#73706B]/40 focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8] shadow-sm"
              />
            </div>

            <Card className="border border-[#E8E2D9] bg-white rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#FAF6F1]/60 text-[#73706B] font-semibold text-xs border-b border-[#E8E2D9] uppercase tracking-wider">
                      <th className="py-3 px-4">Day</th>
                      <th className="py-3 px-4">Phase</th>
                      <th className="py-3 px-4">Week</th>
                      <th className="py-3 px-4">Topic</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FAF6F1]/80">
                    {filteredDays.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-[#73706B]/50 italic">
                          No matching days found.
                        </td>
                      </tr>
                    ) : (
                      filteredDays.map((day) => (
                        <tr key={day.day_number} className="hover:bg-[#FAF6F1]/20 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#33312E]">Day {day.day_number}</td>
                          <td className="py-3 px-4 text-xs text-[#73706B]">{day.phase_title}</td>
                          <td className="py-3 px-4 text-xs text-[#73706B]">Week {day.week}</td>
                          <td className="py-3 px-4 font-medium text-[#33312E]">{day.grammar_topic}</td>
                          <td className="py-3 px-4 text-right">
                            <Link href={`/teacher/day/${day.day_number}`}>
                              <Button size="sm" variant="ghost" className="text-[#E8A6B8] hover:bg-[#FAF1F3] hover:text-[#E8A6B8] rounded-lg cursor-pointer">
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
        </Tabs>
      </div>
    </div>
  );
}
