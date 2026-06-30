'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, Layers, Music, Video, FileText, Mic, 
  ArrowLeft, CheckCircle2, AlertCircle, Sparkles, ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface VocabWord {
  word_index: number;
  word: string;
  pronunciation: string;
  meaning: string;
  example_sentence: string;
}

interface VocabProgress {
  word_index: number;
  learned: boolean;
}

interface DayClientProps {
  profile: any;
  dayNum: number;
  dayContent: any;
  vocabWords: VocabWord[];
  initialProgress: any;
  initialVocabProgress: VocabProgress[];
}

export default function DayClient({
  profile,
  dayNum,
  dayContent,
  vocabWords,
  initialProgress,
  initialVocabProgress,
}: DayClientProps) {
  const router = useRouter();
  
  // Progress states
  const [progress, setProgress] = useState(initialProgress);
  const [vocabProgress, setVocabProgress] = useState<VocabProgress[]>(initialVocabProgress);
  
  // Input states
  const [songsNewWords, setSongsNewWords] = useState(progress.songs_new_words || '');
  const [caseohExpressions, setCaseohExpressions] = useState(progress.caseoh_expressions || '');
  const [diaryText, setDiaryText] = useState(progress.diary_text || '');
  const [vocabSentences, setVocabSentences] = useState<Record<number, string>>(() => {
    try {
      return JSON.parse(progress.vocab_sentences || '{}');
    } catch {
      return {};
    }
  });

  // Display subset of vocab words if it's a review day (shuffle once on mount)
  const [displayVocabWords, setDisplayVocabWords] = useState<VocabWord[]>([]);
  
  useEffect(() => {
    if (dayContent.is_review_day) {
      // Pick 10 random words from the range for review
      const shuffled = [...vocabWords].sort(() => 0.5 - Math.random());
      setDisplayVocabWords(shuffled.slice(0, 10));
    } else {
      setDisplayVocabWords(vocabWords);
    }
  }, [vocabWords, dayContent.is_review_day]);

  // Extract Spotify Track ID
  const getSpotifyEmbedUrl = (spotifyUrl: string) => {
    try {
      const parts = spotifyUrl.split('/track/');
      if (parts.length > 1) {
        const trackId = parts[1].split('?')[0];
        return `https://open.spotify.com/embed/track/${trackId}?utm_source=generator`;
      }
    } catch (e) {
      console.error('Error parsing Spotify URL:', e);
    }
    return '';
  };

  const spotifyEmbedUrl = getSpotifyEmbedUrl(dayContent.song_spotify_url);

  // Check overall day complete
  const allTasksDone = 
    progress.vocab_done && 
    progress.grammar_done && 
    progress.song_done && 
    progress.listening_done && 
    progress.writing_done && 
    progress.speaking_done;

  // Auto-save function for text fields on blur
  const handleSaveTextField = async (fieldName: string, value: any) => {
    const supabase = createClient();
    
    // Update local state first
    setProgress((prev: any) => ({ ...prev, [fieldName]: value }));

    const updatePayload: any = {
      user_id: profile.id,
      day_number: dayNum,
      [fieldName]: value,
      updated_at: new Date().toISOString()
    };

    // If writing is saved, update word count
    if (fieldName === 'diary_text') {
      const words = value.trim().split(/\s+/).filter(Boolean).length;
      updatePayload.diary_word_count = words;
    }

    const { error } = await supabase
      .from('user_day_progress')
      .upsert(updatePayload, { onConflict: 'user_id,day_number' });

    if (error) {
      console.error(`Error saving ${fieldName}:`, error.message);
    }
  };

  // Handle vocab sentence blur
  const handleSaveVocabSentence = (wordIndex: number, sentence: string) => {
    const updatedSentences = { ...vocabSentences, [wordIndex]: sentence };
    setVocabSentences(updatedSentences);
    handleSaveTextField('vocab_sentences', JSON.stringify(updatedSentences));
  };

  // Toggle checklist states
  const handleToggleCheck = async (columnName: string, isChecked: boolean) => {
    const supabase = createClient();
    
    setProgress((prev: any) => ({ ...prev, [columnName]: isChecked }));

    const updatePayload: any = {
      user_id: profile.id,
      day_number: dayNum,
      [columnName]: isChecked,
      updated_at: new Date().toISOString()
    };

    // If all tasks are completed, set completed_at
    const mockNextProgress = { ...progress, [columnName]: isChecked };
    const nextComplete = 
      mockNextProgress.vocab_done && 
      mockNextProgress.grammar_done && 
      mockNextProgress.song_done && 
      mockNextProgress.listening_done && 
      mockNextProgress.writing_done && 
      mockNextProgress.speaking_done;

    if (nextComplete) {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('user_day_progress')
      .upsert(updatePayload, { onConflict: 'user_id,day_number' });

    if (error) {
      console.error(`Error toggling ${columnName}:`, error.message);
      // revert UI
      setProgress((prev: any) => ({ ...prev, [columnName]: !isChecked }));
    }
  };

  // Toggle word learned state
  const handleToggleWordLearned = async (wordIndex: number, learned: boolean) => {
    const supabase = createClient();

    if (learned) {
      // Insert
      const { error } = await supabase
        .from('user_vocab_progress')
        .upsert({
          user_id: profile.id,
          word_index: wordIndex,
          learned: true
        }, { onConflict: 'user_id,word_index' });

      if (!error) {
        setVocabProgress(prev => [...prev, { word_index: wordIndex, learned: true }]);
      }
    } else {
      // Delete
      const { error } = await supabase
        .from('user_vocab_progress')
        .delete()
        .eq('user_id', profile.id)
        .eq('word_index', wordIndex);

      if (!error) {
        setVocabProgress(prev => prev.filter(item => item.word_index !== wordIndex));
      }
    }
  };

  const isWordLearned = (wordIndex: number) => {
    return vocabProgress.some(p => p.word_index === wordIndex);
  };

  // Word count for diary entry
  const wordCount = diaryText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-8">
      {/* Header Back Link */}
      <div className="flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-1.5 text-sm text-[#73706B] hover:text-[#E8A6B8] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <Badge variant="outline" className="border-[#E8E2D9] text-[#73706B]">
          Month {dayContent.month} · Week {dayContent.week}
        </Badge>
      </div>

      {/* Main Day Header */}
      <div className="space-y-3">
        <div className="space-y-1">
          <span className="font-serif italic text-sm text-[#E8A6B8] font-semibold tracking-wider">
            Day {dayNum} · {dayContent.phase_title}
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#33312E] tracking-tight">
            {dayContent.grammar_topic}
          </h1>
        </div>

        {/* Daily Tip box */}
        <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 shadow-[0_2px_10px_rgba(232,166,184,0.02)]">
          <span className="text-[10px] font-bold text-[#E8A6B8] tracking-widest uppercase block mb-1">
            🌸 Daily Tip
          </span>
          <p className="font-serif italic text-sm text-[#73706B] leading-relaxed">
            "{dayContent.daily_tip}"
          </p>
        </div>
      </div>

      {/* 1. Vocabulary Section */}
      <section id="vocab" className="space-y-4 scroll-mt-20">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-[#33312E] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#E8A6B8]" />
            1. Vocabulary {dayContent.is_review_day ? '(Review Mode)' : `(Words ${dayContent.vocab_range_start}-${dayContent.vocab_range_end})`}
          </h2>
          <Checkbox
            checked={progress.vocab_done}
            onCheckedChange={(checked) => handleToggleCheck('vocab_done', !!checked)}
            className="w-5 h-5 border-[#E8E2D9] data-[state=checked]:bg-[#5B7F6B] data-[state=checked]:border-[#5B7F6B] rounded cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {displayVocabWords.map((word) => {
            const learned = isWordLearned(word.word_index);
            return (
              <Card key={word.word_index} className={`border border-[#E8E2D9] bg-white rounded-xl transition-all ${learned ? 'bg-[#FAF6F1]/40 border-[#FAF6F1]' : ''}`}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-[#33312E] font-sans">{word.word}</span>
                        <span className="text-xs text-[#73706B] font-mono">[{word.pronunciation}]</span>
                      </div>
                      <p className="text-sm text-[#73706B] font-medium mt-1">
                        {word.meaning}
                      </p>
                    </div>

                    <Checkbox
                      checked={learned}
                      onCheckedChange={(checked) => handleToggleWordLearned(word.word_index, !!checked)}
                      className="w-4 h-4 border-[#E8E2D9] data-[state=checked]:bg-[#E8A6B8] data-[state=checked]:border-[#E8A6B8] rounded cursor-pointer mt-1"
                    />
                  </div>

                  <div className="bg-[#FAF6F1]/50 p-2.5 rounded-lg text-xs italic text-[#73706B] leading-relaxed">
                    <span className="font-semibold not-italic text-[#33312E] mr-1">Example:</span>
                    "{word.example_sentence}"
                  </div>

                  {/* Custom user sentence field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[#73706B] tracking-wider uppercase block">
                      Write your own sentence:
                    </label>
                    <input
                      type="text"
                      placeholder="Type a sentence using this word..."
                      defaultValue={vocabSentences[word.word_index] || ''}
                      onBlur={(e) => handleSaveVocabSentence(word.word_index, e.target.value)}
                      className="w-full text-xs bg-white border border-[#E8E2D9] rounded-lg px-3 py-2 text-[#33312E] placeholder-[#73706B]/40 focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 2. Grammar Section */}
      <section id="grammar" className="space-y-4 scroll-mt-20">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-[#33312E] flex items-center gap-2">
            <PaperIcon icon={Layers} />
            2. Grammar Lesson
          </h2>
          <Checkbox
            checked={progress.grammar_done}
            onCheckedChange={(checked) => handleToggleCheck('grammar_done', !!checked)}
            className="w-5 h-5 border-[#E8E2D9] data-[state=checked]:bg-[#5B7F6B] data-[state=checked]:border-[#5B7F6B] rounded cursor-pointer"
          />
        </div>

        <Card className="border border-[#E8E2D9] bg-white rounded-xl overflow-hidden">
          <CardHeader className="bg-[#FAF6F1]/30 pb-4">
            <CardTitle className="font-heading text-lg font-bold text-[#33312E]">
              {dayContent.grammar_topic}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <p className="text-sm text-[#73706B] leading-relaxed whitespace-pre-wrap">
              {dayContent.grammar_explainer}
            </p>

            {/* Embedded YouTube video frame */}
            {dayContent.grammar_youtube_id ? (
              <div className="aspect-video w-full rounded-xl overflow-hidden border border-[#E8E2D9]">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${dayContent.grammar_youtube_id}`}
                  title="YouTube grammar explainer video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="p-6 bg-[#FAF6F1]/30 rounded-xl text-center space-y-2 border border-[#E8E2D9]/40">
                <p className="text-xs text-[#73706B]/70">No embedded video ID for this topic yet.</p>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(dayContent.grammar_topic + ' English lesson')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#E8A6B8] hover:underline"
                >
                  Search on YouTube <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 3. Song Section */}
      <section id="song" className="space-y-4 scroll-mt-20">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-[#33312E] flex items-center gap-2">
            <PaperIcon icon={Music} />
            3. Song of the Day
          </h2>
          <Checkbox
            checked={progress.song_done}
            onCheckedChange={(checked) => handleToggleCheck('song_done', !!checked)}
            className="w-5 h-5 border-[#E8E2D9] data-[state=checked]:bg-[#5B7F6B] data-[state=checked]:border-[#5B7F6B] rounded cursor-pointer"
          />
        </div>

        <Card className="border border-[#E8E2D9] bg-white rounded-xl">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="font-sans font-bold text-base text-[#33312E]">{dayContent.song_title}</h3>
              <p className="text-xs text-[#73706B] font-medium">{dayContent.song_artist}</p>
            </div>

            {/* Embedded Spotify player */}
            {spotifyEmbedUrl ? (
              <div className="w-full rounded-xl overflow-hidden bg-transparent border border-[#E8E2D9]">
                <iframe
                  style={{ borderRadius: '12px' }}
                  src={spotifyEmbedUrl}
                  width="100%"
                  height="152"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
              </div>
            ) : (
              <p className="text-xs text-red-500">Invalid Spotify URL.</p>
            )}

            {/* Song prompt input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                Write 2 new words or expressions you learned from this song:
              </label>
              <input
                type="text"
                placeholder="e.g. Delusional, Autumn leaves..."
                value={songsNewWords}
                onChange={(e) => setSongsNewWords(e.target.value)}
                onBlur={() => handleSaveTextField('songs_new_words', songsNewWords)}
                className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-2.5 text-[#33312E] placeholder-[#73706B]/40 focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 4. Listening Section */}
      <section id="listening" className="space-y-4 scroll-mt-20">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-[#33312E] flex items-center gap-2">
            <PaperIcon icon={Video} />
            4. Listening Practice
          </h2>
          <Checkbox
            checked={progress.listening_done}
            onCheckedChange={(checked) => handleToggleCheck('listening_done', !!checked)}
            className="w-5 h-5 border-[#E8E2D9] data-[state=checked]:bg-[#5B7F6B] data-[state=checked]:border-[#5B7F6B] rounded cursor-pointer"
          />
        </div>

        <Card className="border border-[#E8E2D9] bg-white rounded-xl">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="font-sans font-bold text-base text-[#33312E]">{dayContent.listening_label}</h3>
                <span className="text-[10px] text-[#73706B] uppercase font-bold tracking-wider">
                  Mode: {dayContent.listening_mode?.replace('_', ' ')}
                </span>
              </div>
              <Badge className="bg-[#FAF1F3] hover:bg-[#FAF1F3] text-[#E8A6B8] border-none font-semibold">
                Type: {dayContent.listening_type.toUpperCase()}
              </Badge>
            </div>

            {/* Embedded Listening Video */}
            {dayContent.listening_youtube_id ? (
              <div className="aspect-video w-full rounded-xl overflow-hidden border border-[#E8E2D9]">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${dayContent.listening_youtube_id}`}
                  title="Listening video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="p-6 bg-[#FAF6F1]/30 rounded-xl text-center space-y-3 border border-[#E8E2D9]/40">
                <p className="text-xs text-[#73706B]/70">No embedded video ID. Please check the official channel.</p>
                {dayContent.listening_type === 'anime' ? (
                  <a
                    href="https://www.youtube.com/@MuseAsia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#E8A6B8] hover:underline font-semibold"
                  >
                    Go to Muse Asia Channel <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <a
                    href="https://www.youtube.com/@CaseOh_Games"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#E8A6B8] hover:underline font-semibold"
                  >
                    Go to CaseOh Games Channel <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* Listening prompt input based on type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#73706B] tracking-wider uppercase block">
                {dayContent.listening_type === 'caseoh' 
                  ? 'Write 5 words or expressions you heard CaseOh say:' 
                  : 'Write a short summary of what happened in this scene:'}
              </label>
              <textarea
                rows={3}
                placeholder={dayContent.listening_type === 'caseoh' 
                  ? 'e.g. bro is massive, built like a, what do you mean...' 
                  : 'Summarize the scene...'}
                value={caseohExpressions}
                onChange={(e) => setCaseohExpressions(e.target.value)}
                onBlur={() => handleSaveTextField('caseoh_expressions', caseohExpressions)}
                className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-2.5 text-[#33312E] placeholder-[#73706B]/40 focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 5. Writing Section */}
      <section id="writing" className="space-y-4 scroll-mt-20">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-[#33312E] flex items-center gap-2">
            <PaperIcon icon={FileText} />
            5. Writing Prompt (Diary Entry)
          </h2>
          <Checkbox
            checked={progress.writing_done}
            onCheckedChange={(checked) => handleToggleCheck('writing_done', !!checked)}
            className="w-5 h-5 border-[#E8E2D9] data-[state=checked]:bg-[#5B7F6B] data-[state=checked]:border-[#5B7F6B] rounded cursor-pointer"
          />
        </div>

        <Card className="border border-[#E8E2D9] bg-white rounded-xl">
          <CardHeader className="bg-[#FAF6F1]/30 pb-4">
            <CardDescription className="text-xs font-semibold text-[#73706B] uppercase tracking-wider">
              Today's Writing Prompt
            </CardDescription>
            <CardTitle className="font-heading text-base font-bold text-[#33312E] mt-1 leading-relaxed">
              {dayContent.writing_prompt}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Textarea
              rows={8}
              placeholder="Write your diary entry here. It will automatically save when you tap away (autosave on blur)..."
              value={diaryText}
              onChange={(e) => setDiaryText(e.target.value)}
              onBlur={() => handleSaveTextField('diary_text', diaryText)}
              className="w-full text-sm bg-white border border-[#E8E2D9] rounded-xl px-4 py-3 text-[#33312E] placeholder-[#73706B]/40 focus:outline-none focus:ring-1 focus:ring-[#E8A6B8] focus:border-[#E8A6B8]"
            />
            
            <div className="flex justify-between items-center text-xs text-[#73706B]">
              <span>Word Count: <strong className="text-[#33312E]">{wordCount}</strong> words</span>
              <span className="italic text-[#73706B]/50">Autosaves on blur</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 6. Speaking Section */}
      <section id="speaking" className="space-y-4 scroll-mt-20">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-[#33312E] flex items-center gap-2">
            <PaperIcon icon={Mic} />
            6. Speaking Practice
          </h2>
          <Checkbox
            checked={progress.speaking_done}
            onCheckedChange={(checked) => handleToggleCheck('speaking_done', !!checked)}
            className="w-5 h-5 border-[#E8E2D9] data-[state=checked]:bg-[#5B7F6B] data-[state=checked]:border-[#5B7F6B] rounded cursor-pointer"
          />
        </div>

        <Card className="border border-[#E8E2D9] bg-white rounded-xl">
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#E8A6B8] uppercase tracking-wider block">
                Speaking Prompt
              </span>
              <p className="font-heading text-base font-bold text-[#33312E] leading-relaxed">
                {dayContent.speaking_prompt}
              </p>
            </div>

            <div className="bg-[#FAF6F1]/60 p-4 rounded-xl space-y-2 border border-[#E8E2D9]/40 text-sm text-[#73706B] leading-relaxed">
              <p className="font-semibold text-[#33312E]">Submission Instructions:</p>
              <p>1. Record yourself speaking for 2-5 minutes on your phone's voice recorder.</p>
              <p>2. Send the audio file or link directly to Vaibhav on your preferred messenger.</p>
              <p>3. Check the box above once you have submitted your voice recording.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Celebratory bottom state */}
      {allTasksDone && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center p-8 bg-[#5B7F6B]/5 border border-[#5B7F6B]/20 rounded-2xl text-center space-y-4"
        >
          <div className="w-14 h-14 bg-[#5B7F6B]/10 rounded-full flex items-center justify-center text-[#5B7F6B]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold text-[#5B7F6B]">Day {dayNum} Mission Complete!</h3>
            <p className="text-sm text-[#73706B] mt-1">Excellent work. Your entries have been sent for review. Tomorrow awaits!</p>
          </div>
          <Link href="/home">
            <Button className="bg-[#5B7F6B] hover:bg-[#4E6D5B] text-white rounded-xl flex items-center gap-1.5 cursor-pointer">
              <Sparkles className="w-4 h-4" /> Return Home
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}

// Small helper component for styled section icons
function PaperIcon({ icon: Icon }: { icon: any }) {
  return (
    <div className="p-1.5 bg-[#E8A6B8]/10 text-[#E8A6B8] rounded-lg">
      <Icon className="w-4 h-4" />
    </div>
  );
}
