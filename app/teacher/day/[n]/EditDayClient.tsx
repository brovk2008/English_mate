'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2, Sparkles, Eye, X, BookOpen, Layers, Music, Video, FileText } from 'lucide-react';
import GrammarVisual from '@/components/GrammarVisual';

interface EditDayClientProps {
  dayNum: number;
  dayContent: any;
}

export default function EditDayClient({ dayNum, dayContent }: EditDayClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Form states
  const [grammarTopic, setGrammarTopic] = useState(dayContent.grammar_topic || '');
  const [grammarExplainer, setGrammarExplainer] = useState(dayContent.grammar_explainer || '');
  const [grammarYoutubeId, setGrammarYoutubeId] = useState(dayContent.grammar_youtube_id || '');
  
  const [writingPrompt, setWritingPrompt] = useState(dayContent.writing_prompt || '');
  const [speakingPrompt, setSpeakingPrompt] = useState(dayContent.speaking_prompt || '');
  
  const [songTitle, setSongTitle] = useState(dayContent.song_title || '');
  const [songArtist, setSongArtist] = useState(dayContent.song_artist || '');
  const [songSpotifyUrl, setSongSpotifyUrl] = useState(dayContent.song_spotify_url || '');
  const [songYoutubeId, setSongYoutubeId] = useState(dayContent.song_youtube_id || '');

  const [listeningLabel, setListeningLabel] = useState(dayContent.listening_label || '');
  const [listeningYoutubeId, setListeningYoutubeId] = useState(dayContent.listening_youtube_id || '');
  const [listeningMode, setListeningMode] = useState(dayContent.listening_mode || 'subs_on');
  
  const [dailyTip, setDailyTip] = useState(dayContent.daily_tip || '');
  const [isReviewDay, setIsReviewDay] = useState(!!dayContent.is_review_day);

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const supabase = createClient();
    const { error } = await supabase
      .from('days')
      .update({
        grammar_topic: grammarTopic,
        grammar_explainer: grammarExplainer,
        grammar_youtube_id: grammarYoutubeId || null,
        writing_prompt: writingPrompt,
        speaking_prompt: speakingPrompt,
        song_title: songTitle,
        song_artist: songArtist,
        song_spotify_url: songSpotifyUrl,
        song_youtube_id: songYoutubeId || null,
        listening_label: listeningLabel,
        listening_youtube_id: listeningYoutubeId || null,
        listening_mode: listeningMode,
        daily_tip: dailyTip,
        is_review_day: isReviewDay
      })
      .eq('day_number', dayNum);

    setLoading(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.push('/teacher');
        router.refresh();
      }, 1500);
    } else {
      console.error('Error updating day:', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F1] py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link href="/teacher" className="flex items-center gap-1.5 text-sm text-[#73706B] hover:text-[#E8A6B8] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <Badge variant="outline" className="border-[#E8E2D9] text-[#73706B] font-mono">
            Month {dayContent.month} · Week {dayContent.week}
          </Badge>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-[#33312E]">
              Edit Day {dayNum} Curriculum
            </h1>
            <p className="text-sm text-[#73706B]">
              Modify the grammar, song, listening exercises, and tips for this lesson.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="bg-[#E8A6B8] hover:bg-[#E293A7] text-white rounded-xl font-bold text-xs h-9 px-4 cursor-pointer flex items-center gap-1 self-start sm:self-center shadow-xs"
          >
            <Eye size={14} /> Preview Lesson Layout
          </Button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card className="border border-[#E8E2D9] bg-white rounded-2xl p-6 sm:p-8 space-y-6">
            
            {/* General Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#E8A6B8] tracking-widest uppercase pb-1 border-b border-[#FAF6F1]">
                General Settings
              </h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isReviewDay"
                  checked={isReviewDay}
                  onCheckedChange={(checked) => setIsReviewDay(!!checked)}
                  className="w-4 h-4 border-[#E8E2D9] data-[state=checked]:bg-[#E8A6B8] data-[state=checked]:border-[#E8A6B8] rounded cursor-pointer"
                />
                <label htmlFor="isReviewDay" className="text-sm font-medium text-[#33312E] cursor-pointer">
                  Mark as Review Day
                </label>
              </div>
            </div>

            {/* Grammar explainer */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#E8A6B8] tracking-widest uppercase pb-1 border-b border-[#FAF6F1]">
                Grammar Section
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                  Grammar Topic Title
                </label>
                <input
                  type="text"
                  required
                  value={grammarTopic}
                  onChange={(e) => setGrammarTopic(e.target.value)}
                  className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-2.5 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                  Grammar Explainer Text
                </label>
                <textarea
                  rows={5}
                  required
                  value={grammarExplainer}
                  onChange={(e) => setGrammarExplainer(e.target.value)}
                  className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-3 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                  YouTube Grammar Video ID (e.g. _QkdMH6gwvs)
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={grammarYoutubeId}
                  onChange={(e) => setGrammarYoutubeId(e.target.value)}
                  className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-2.5 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                />
              </div>
            </div>

            {/* Writing & Speaking Prompts */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#E8A6B8] tracking-widest uppercase pb-1 border-b border-[#FAF6F1]">
                Prompts Section
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                  Diary Writing Prompt
                </label>
                <textarea
                  rows={3}
                  required
                  value={writingPrompt}
                  onChange={(e) => setWritingPrompt(e.target.value)}
                  className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-3 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                  Speaking Practice Prompt
                </label>
                <textarea
                  rows={2}
                  required
                  value={speakingPrompt}
                  onChange={(e) => setSpeakingPrompt(e.target.value)}
                  className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-3 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                />
              </div>
            </div>

            {/* Song of the day */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#E8A6B8] tracking-widest uppercase pb-1 border-b border-[#FAF6F1]">
                Song of the Day
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                    Song Title
                  </label>
                  <input
                    type="text"
                    required
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-2.5 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                    Song Artist
                  </label>
                  <input
                    type="text"
                    required
                    value={songArtist}
                    onChange={(e) => setSongArtist(e.target.value)}
                    className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-2.5 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                  Spotify Track URL
                </label>
                <input
                  type="url"
                  required
                  value={songSpotifyUrl}
                  onChange={(e) => setSongSpotifyUrl(e.target.value)}
                  className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-2.5 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                  YouTube Lyric Video ID (Optional)
                </label>
                <input
                  type="text"
                  value={songYoutubeId}
                  onChange={(e) => setSongYoutubeId(e.target.value)}
                  className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-2.5 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                />
              </div>
            </div>

            {/* Listening Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#E8A6B8] tracking-widest uppercase pb-1 border-b border-[#FAF6F1]">
                Listening Practice
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                  Video Label / Title
                </label>
                <input
                  type="text"
                  required
                  value={listeningLabel}
                  onChange={(e) => setListeningLabel(e.target.value)}
                  className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-2.5 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                    YouTube Video ID
                  </label>
                  <input
                    type="text"
                    value={listeningYoutubeId}
                    onChange={(e) => setListeningYoutubeId(e.target.value)}
                    className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-2.5 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                    Subtitles Mode
                  </label>
                  <select
                    value={listeningMode}
                    onChange={(e) => setListeningMode(e.target.value)}
                    className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-2.5 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                  >
                    <option value="subs_on">Subtitles Always On</option>
                    <option value="subs_optional">Subtitles Optional / Try Without</option>
                    <option value="dub_only">Dub Only Challenge</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Daily Tip */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#E8A6B8] tracking-widest uppercase pb-1 border-b border-[#FAF6F1]">
                Extra content
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                  Daily Tip Phrase
                </label>
                <textarea
                  rows={2}
                  required
                  value={dailyTip}
                  onChange={(e) => setDailyTip(e.target.value)}
                  className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-3 text-[#33312E] focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#FAF6F1]">
              <Link href="/teacher">
                <Button type="button" variant="outline" className="border-[#E8E2D9] text-[#73706B] hover:bg-[#FAF6F1] rounded-xl cursor-pointer">
                  Cancel
                </Button>
              </Link>
              
              <Button
                type="submit"
                disabled={loading || success}
                className="bg-[#5B7F6B] hover:bg-[#4E6D5B] text-white rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : success ? (
                  <>
                    <Sparkles className="w-4 h-4" /> Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Curriculum
                  </>
                )}
              </Button>
            </div>
          </Card>
        </form>
      </div>

      {/* Lesson Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl border border-border bg-[#FAF6F1] rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6 select-none">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div>
                <h3 className="font-display font-extrabold text-base text-ink">Lesson Day {dayNum} Live Preview</h3>
                <p className="text-[10px] text-ink-muted">Simulating Student Dashboard View Mode</p>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-ink-muted hover:text-sakura p-1 rounded-full hover:bg-bg/40 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Simulated content scroll */}
            <div className="space-y-6">
              {/* 1. Vocabulary Title Card */}
              <Card className="border border-border bg-card rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sakura/10 text-sakura">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="font-display font-bold text-sm text-ink">1. Vocabulary Oxford List</span>
                </div>
                <Badge className="bg-bg text-ink-muted font-bold text-[9px] border-none select-none">10 Words</Badge>
              </Card>

              {/* 2. Grammar Topic Visual Explainer */}
              <Card className="border border-border bg-card rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border/40 flex items-center gap-3 bg-bg/5">
                  <div className="p-2 rounded-xl bg-matcha/10 text-matcha">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="font-display font-bold text-sm text-ink">2. Grammar: {grammarTopic || 'Untitled Grammar'}</span>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="bg-bg/40 border border-border rounded-xl p-4">
                    <span className="text-[10px] font-bold text-ink-muted uppercase block tracking-wider mb-2">Lesson Sheet</span>
                    <p className="text-xs text-ink leading-relaxed whitespace-pre-wrap">{grammarExplainer || 'No explainer text entered.'}</p>
                  </div>
                  <GrammarVisual topicKey={grammarTopic} />
                </CardContent>
              </Card>

              {/* 3. Song Playlist */}
              <Card className="border border-border bg-card rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sakura/10 text-sakura">
                    <Music className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-display font-bold text-sm text-ink block">3. Song: {songTitle || 'No Song Title'}</span>
                    <span className="text-[10px] text-ink-muted">by {songArtist || 'Unknown Artist'}</span>
                  </div>
                </div>
              </Card>

              {/* 4. Listening Practice */}
              <Card className="border border-border bg-card rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sakura/10 text-sakura">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-display font-bold text-sm text-ink block">4. Listening: {listeningLabel || 'No Listening Title'}</span>
                    <span className="text-[10px] text-ink-muted uppercase font-bold tracking-widest">{listeningMode.replace('_', ' ')}</span>
                  </div>
                </div>
              </Card>

              {/* 5. Writing Prompt */}
              <Card className="border border-border bg-card rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-border/40 flex items-center gap-3 bg-bg/5">
                  <div className="p-2 rounded-xl bg-matcha/10 text-matcha">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-display font-bold text-sm text-ink">5. Writing Diary</span>
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="bg-bg/40 border border-border rounded-xl p-4 border-l-2 border-l-gold">
                    <span className="text-[10px] font-bold text-gold tracking-wider uppercase block mb-1">Diary Prompt</span>
                    <p className="text-xs text-ink leading-relaxed">{writingPrompt || 'No prompt text entered.'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => setIsPreviewOpen(false)}
                className="w-full bg-[#5B7F6B] hover:bg-[#4E6D5B] text-white rounded-2xl font-bold py-3 text-sm cursor-pointer"
              >
                Close Preview
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
