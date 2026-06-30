'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Loader2, Sparkles } from 'lucide-react';

interface EditDayClientProps {
  dayNum: number;
  dayContent: any;
}

export default function EditDayClient({ dayNum, dayContent }: EditDayClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-[#33312E]">
            Edit Day {dayNum} Curriculum
          </h1>
          <p className="text-sm text-[#73706B]">
            Modify the grammar, song, listening exercises, and tips for this lesson.
          </p>
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
    </div>
  );
}
