'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, CheckCircle2, FileText, Send, AlertCircle, 
  Sparkles, Check, ChevronRight, HelpCircle, Award
} from 'lucide-react';

interface Student {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  start_date: string;
}

interface ReviewStudentClientProps {
  student: Student;
  dayNum: number | null;
  activeDayProgress: any;
  activeDayContent: any;
  submissionsHistory: any[];
}

export default function ReviewStudentClient({
  student,
  dayNum,
  activeDayProgress,
  activeDayContent,
  submissionsHistory,
}: ReviewStudentClientProps) {
  const router = useRouter();
  
  // Feedback states
  const [feedback, setFeedback] = useState(activeDayProgress?.teacher_feedback || '');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Mistake logger states
  const [mistakeText, setMistakeText] = useState('');
  const [correctionText, setCorrectionText] = useState('');
  const [mistakeCategory, setMistakeCategory] = useState('Grammar');
  const [mistakeLoading, setMistakeLoading] = useState(false);
  const [mistakeSuccess, setMistakeSuccess] = useState(false);

  // 1. Submit feedback
  const handleSaveFeedback = async () => {
    if (!dayNum) return;
    setFeedbackLoading(true);
    setFeedbackSuccess(false);

    const supabase = createClient();
    const { error } = await supabase
      .from('user_day_progress')
      .update({
        teacher_reviewed: true,
        teacher_feedback: feedback,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', student.id)
      .eq('day_number', dayNum);

    setFeedbackLoading(false);
    if (!error) {
      setFeedbackSuccess(true);
      setTimeout(() => {
        setFeedbackSuccess(false);
        router.push('/teacher');
        router.refresh();
      }, 1500);
    } else {
      console.error('Error saving feedback:', error.message);
    }
  };

  // 2. Add mistake log
  const handleAddMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mistakeText.trim() || !correctionText.trim() || !dayNum) return;
    setMistakeLoading(true);
    setMistakeSuccess(false);

    const supabase = createClient();
    const { error } = await supabase
      .from('mistake_log')
      .insert({
        user_id: student.id,
        day_number: dayNum,
        mistake: mistakeText.trim(),
        correction: correctionText.trim(),
        category: mistakeCategory
      });

    setMistakeLoading(false);
    if (!error) {
      setMistakeSuccess(true);
      setMistakeText('');
      setCorrectionText('');
      setTimeout(() => {
        setMistakeSuccess(false);
      }, 2000);
    } else {
      console.error('Error adding mistake:', error.message);
    }
  };

  // IF INDIVIDUAL DAY VIEW
  if (dayNum && activeDayProgress) {
    return (
      <div className="space-y-6">
        {/* Back navigation */}
        <div className="flex items-center justify-between">
          <Link href={`/teacher/student/${student.id}`} className="flex items-center gap-1.5 text-sm text-[#73706B] hover:text-[#E8A6B8] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to History
          </Link>
          <Badge className="bg-[#E8A6B8] text-white">
            Day {dayNum} Submission
          </Badge>
        </div>

        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#33312E]">
            Review: {student.display_name}
          </h1>
          <p className="text-sm text-[#73706B]">
            Lesson Topic: <span className="font-semibold text-[#33312E]">{activeDayContent?.grammar_topic}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Main submissions column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Diary Entry */}
            <Card className="border border-[#E8E2D9] bg-white rounded-2xl">
              <CardHeader className="pb-3 border-b border-[#FAF6F1]">
                <CardDescription className="text-[10px] font-bold text-[#E8A6B8] uppercase tracking-wider">
                  Writing Prompt
                </CardDescription>
                <CardTitle className="font-heading text-base font-bold text-[#33312E] mt-1 leading-relaxed">
                  {activeDayContent?.writing_prompt}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-[#FAF6F1]/40 border border-[#E8E2D9]/40 rounded-xl p-4 sm:p-5 text-sm text-[#33312E] leading-relaxed font-sans whitespace-pre-wrap">
                  {activeDayProgress.diary_text || (
                    <span className="text-[#73706B]/50 italic">No diary entry written for this day.</span>
                  )}
                </div>
                <div className="text-xs text-[#73706B] text-right">
                  Word Count: <strong className="text-[#33312E]">{activeDayProgress.diary_word_count || 0}</strong> words
                </div>
              </CardContent>
            </Card>

            {/* Other submissions (Song Words & CaseOh Expressions) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Song words */}
              <Card className="border border-[#E8E2D9] bg-white rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-[#33312E]">Song Submissions</CardTitle>
                  <CardDescription className="text-[10px] text-[#73706B] font-medium">New words found in song</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 text-sm text-[#33312E]">
                  <div className="p-3 bg-[#FAF6F1]/50 rounded-lg min-h-[60px] italic">
                    {activeDayProgress.songs_new_words ? `"${activeDayProgress.songs_new_words}"` : "None submitted."}
                  </div>
                </CardContent>
              </Card>

              {/* CaseOh summary */}
              <Card className="border border-[#E8E2D9] bg-white rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-[#33312E]">Listening Submissions</CardTitle>
                  <CardDescription className="text-[10px] text-[#73706B] font-medium">Expressions heard / Clip summary</CardDescription>
                </CardHeader>
                <CardContent className="pt-2 text-sm text-[#33312E]">
                  <div className="p-3 bg-[#FAF6F1]/50 rounded-lg min-h-[60px] whitespace-pre-wrap">
                    {activeDayProgress.caseoh_expressions || "None submitted."}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right / Teacher feedback and mistake logging panel */}
          <div className="space-y-6">
            {/* Feedback card */}
            <Card className="border border-[#E8E2D9] bg-white rounded-xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg font-bold text-[#33312E]">Feedback & Approve</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  rows={6}
                  placeholder="Leave your comments and helpful edits here..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full text-xs bg-white border border-[#E8E2D9] rounded-xl px-3 py-2 text-[#33312E] placeholder-[#73706B]/40 focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                />

                <Button
                  onClick={handleSaveFeedback}
                  disabled={feedbackLoading || feedbackSuccess}
                  className="w-full bg-[#5B7F6B] hover:bg-[#4E6D5B] text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-sm"
                >
                  {feedbackLoading ? (
                    'Saving...'
                  ) : feedbackSuccess ? (
                    <>
                      <Check className="w-4 h-4" /> Reviewed!
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Mark Reviewed
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Add Mistake */}
            <Card className="border border-[#E8E2D9] bg-white rounded-xl">
              <CardHeader>
                <CardTitle className="font-heading text-lg font-bold text-[#33312E]">Mistake Logger</CardTitle>
                <CardDescription className="text-xs text-[#73706B]">
                  Flag a recurring error to append to their mistake ledger.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMistake} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[#73706B] tracking-wider uppercase block">
                      Student's Phrase (Error)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. He do not like apples"
                      value={mistakeText}
                      onChange={(e) => setMistakeText(e.target.value)}
                      className="w-full text-xs bg-white border border-[#E8E2D9] rounded-lg px-3 py-2 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[#73706B] tracking-wider uppercase block">
                      Correct Phrase
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. He does not like apples"
                      value={correctionText}
                      onChange={(e) => setCorrectionText(e.target.value)}
                      className="w-full text-xs bg-white border border-[#E8E2D9] rounded-lg px-3 py-2 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-green-300 focus:border-green-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[#73706B] tracking-wider uppercase block">
                      Mistake Type Category
                    </label>
                    <select
                      value={mistakeCategory}
                      onChange={(e) => setMistakeCategory(e.target.value)}
                      className="w-full text-xs bg-white border border-[#E8E2D9] rounded-lg px-3 py-2 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-red-300 focus:border-red-400"
                    >
                      <option value="Grammar">Grammar (文法)</option>
                      <option value="Preposition">Preposition (前置詞)</option>
                      <option value="Article">Article (冠詞)</option>
                      <option value="Vocabulary">Vocabulary (単語選定)</option>
                      <option value="Spelling">Spelling (綴り)</option>
                      <option value="Other">Other (その他)</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={mistakeLoading || mistakeSuccess || !mistakeText.trim() || !correctionText.trim()}
                    className="w-full bg-[#E8A6B8] hover:bg-[#E293A7] text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer text-sm"
                  >
                    {mistakeLoading ? (
                      'Logging...'
                    ) : mistakeSuccess ? (
                      <>
                        <Sparkles className="w-4 h-4" /> Added to Ledger!
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4" /> Log Mistake
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // IF LIST VIEW (HISTORY OVERVIEW)
  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link href="/teacher" className="flex items-center gap-1.5 text-sm text-[#73706B] hover:text-[#E8A6B8] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Panel
        </Link>
        <Badge className="bg-[#FAF1F3] hover:bg-[#FAF1F3] text-[#E8A6B8] border-none">
          History Overview
        </Badge>
      </div>

      {/* Profile summary card */}
      <Card className="border border-[#E8E2D9] bg-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 ring-2 ring-[#E8A6B8]/30">
            <AvatarImage src={student.avatar_url || ''} />
            <AvatarFallback className="bg-[#FAF1F3] text-[#E8A6B8] font-bold text-lg">
              {student.display_name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-heading text-2xl font-bold text-[#33312E]">{student.display_name}</h2>
            <p className="text-xs text-[#73706B]">{student.email}</p>
            <span className="text-[10px] text-[#73706B]/50 block mt-1">
              Day 1 Anchor: {new Date(student.start_date).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Link href={`/certificate?preview_student_id=${student.id}`} target="_blank" className="print:hidden">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs gap-1.5 flex items-center shrink-0 cursor-pointer border-none font-bold">
            <Award className="w-4 h-4" /> Preview Certificate
          </Button>
        </Link>
      </Card>

      {/* Submissions Index */}
      <Card className="border border-[#E8E2D9] bg-white rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-[#FAF6F1]">
          <CardTitle className="font-heading text-lg font-bold text-[#33312E]">
            All Submissions & Completion History
          </CardTitle>
          <CardDescription className="text-xs text-[#73706B]">
            Click any active day to review their writing diary, lyrics search, and expressions list.
          </CardDescription>
        </CardHeader>
        
        <div className="divide-y divide-[#FAF6F1]/80">
          {submissionsHistory.length === 0 ? (
            <div className="text-center py-12 text-[#73706B]/50 italic">
              No submissions recorded yet for this student.
            </div>
          ) : (
            submissionsHistory.map((item) => {
              const pending = item.writing_done && !item.teacher_reviewed;
              return (
                <div key={item.day_number} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-[#FAF6F1]/20 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#33312E]">Day {item.day_number} Submission</span>
                      {pending ? (
                        <Badge className="bg-[#E8A6B8] text-white text-[9px] hover:bg-[#E8A6B8] py-0">Pending Review</Badge>
                      ) : item.teacher_reviewed ? (
                        <Badge className="bg-[#5B7F6B] text-white text-[9px] hover:bg-[#5B7F6B] py-0">Reviewed & Checked</Badge>
                      ) : (
                        <Badge variant="outline" className="border-[#E8E2D9] text-[#73706B]/60 text-[9px] py-0">In Progress</Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-[#73706B]/60 block mt-1">
                      Last update: {new Date(item.updated_at).toLocaleString()} · {item.diary_word_count || 0} diary words
                    </span>
                  </div>

                  <Link href={`/teacher/student/${student.id}?day=${item.day_number}`}>
                    <Button size="sm" variant={pending ? 'default' : 'outline'} className={`rounded-lg text-xs cursor-pointer ${pending ? 'bg-[#E8A6B8] hover:bg-[#E293A7] text-white' : 'border-[#E8E2D9] text-[#73706B]'}`}>
                      {pending ? 'Review Submission' : 'View Details'} <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
