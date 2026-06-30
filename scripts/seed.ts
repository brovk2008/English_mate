import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Parse .env.local manually to get Supabase URL and Service Role Key
const envPath = path.resolve(__dirname, '../.env.local');
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = value.trim();
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseServiceKey = value.trim();
    }
  });
}

// 2. Verified song pool mapping from section 7.2 of the implementation plan
const songs = [
  { title: "summer nights", artist: "The Millennial Club", url: "https://open.spotify.com/track/6tQQYvGkmpjWLVmJKc0Rpr" },
  { title: "Sofia", artist: "Clairo", url: "https://open.spotify.com/track/1zHUEIQ6yzaWBzhNCV1SGW" },
  { title: "Delusional", artist: "John Michael Howell", url: "https://open.spotify.com/track/6As6LBznwCEZPfzUlbRlwq" },
  { title: "Last Leaves of Autumn", artist: "Zleepyfred", url: "https://open.spotify.com/track/7DYjwMLWgZkQzojtg6eBZ2" },
  { title: "Jenny", artist: "Goodmorning Pancake", url: "https://open.spotify.com/track/1HIWAHMEYhdFRiq1kn8QuF" },
  { title: "Missing Piece", artist: "John Michael Howell", url: "https://open.spotify.com/track/25DOfzfpERYnUtEauoZgNA" },
  { title: "Closer", artist: "The Chainsmokers, Halsey", url: "https://open.spotify.com/track/7BKLCZ1jbUBVqRi2FVlTVw" },
  { title: "The Good Times", artist: "Marino", url: "https://open.spotify.com/track/0mHFWWwvg8g4mPtNGy8WYE" },
  { title: "iwbwy", artist: "Hashy", url: "https://open.spotify.com/track/583uuDYBVzaJ7D6mD53gX2" },
  { title: "Keep You Mine", artist: "NOTD, shy martin", url: "https://open.spotify.com/track/0OJN2A3Qyvd7pwSF0AIteC" },
  { title: "Tattoos", artist: "Gun Boi Kaz", url: "https://open.spotify.com/track/2cL5xA2cJkPwlBaxOjuAvc" },
  { title: "Carry You Home", artist: "Alex Warren", url: "https://open.spotify.com/track/1wOp7yTVyH176bW1z9WAiv" },
  { title: "her (feat. Annika Wells)", artist: "JVKE", url: "https://open.spotify.com/track/2Kc8MeW8prVwHEREYM3wCG" },
  { title: "You", artist: "Tom Frane", url: "https://open.spotify.com/track/2YNt5HSUdOiHNpY0Hz44pY" },
  { title: "10:35", artist: "Tiësto, Tate McRae", url: "https://open.spotify.com/track/6BePGk3eCan4FqaW2X8Qy3" },
  { title: "When The Party Ends", artist: "Max Allais", url: "https://open.spotify.com/track/0N254dOqqdCm5hviUV2kR9" },
  { title: "Never Let This Go", artist: "Tom Frane", url: "https://open.spotify.com/track/65V63VSXdLbBlU2v7mF6Wk" },
  { title: "Ordinary", artist: "Alex Warren", url: "https://open.spotify.com/track/6qqrTXSdwiJaq8SO0X2lSe" },
  { title: "My Stupid Heart", artist: "Walk off the Earth", url: "https://open.spotify.com/track/3UZDl7g2r84o1b5marUjfK" },
  { title: "8 Letters", artist: "Why Don't We", url: "https://open.spotify.com/track/4zRZAmBQP8vhNPf9i9opXt" },
  { title: "Payphone", artist: "Maroon 5", url: "https://open.spotify.com/track/1Vixb2G70s0J2Irf6hi8VE" },
  { title: "I Really Want to Stay at Your House", artist: "Rosa Walton, Hallie Coggins", url: "https://open.spotify.com/track/7mykoq6R3BArsSpNDjFQTm" },
  { title: "Good For You", artist: "Selena Gomez, A$AP Rocky", url: "https://open.spotify.com/track/5xdVqHtFS0eLuNp4Z8Wbpa" },
  { title: "Touch", artist: "KATSEYE", url: "https://open.spotify.com/track/6aJn7Cst74cj4lNIiPRgav" },
  { title: "Stereo Love", artist: "Edward Maya, Vika Jigulina", url: "https://open.spotify.com/track/6EqWTM2gxDbhqqXfcxdMv8" },
  { title: "I'll Do It", artist: "Heidi Montag", url: "https://open.spotify.com/track/3RpCFxfsccNPDTWd3ALMaB" },
  { title: "Mad Love", artist: "Mabel", url: "https://open.spotify.com/track/0jJNpY616X5KgEWRLuxLFi" },
  { title: "Attention", artist: "Charlie Puth", url: "https://open.spotify.com/track/5cF0dROlMOK5uNZtivgu50" },
  { title: "I Love You 3000", artist: "Stephanie Poetri", url: "https://open.spotify.com/track/3znQ9i61vfe2E7URHlOiyc" },
  { title: "stupid", artist: "Tate McRae", url: "https://open.spotify.com/track/4k3uABcX9iaGlt5pRJhumi" }
];

// 3. CaseOh YouTube compilation ID mapping from section 7.2 of the implementation plan
const caseohYoutubeIds: Record<string, string> = {
  "Best of CaseOh January 2026": "_QkdMH6gwvs",
  "Best of CaseOh February 2026": "_TDXvn7_xzw",
  "Best of CaseOh March 2026": "GCd0OZqFTsY",
  "Best of CaseOh April 2026": "SbrKH6Qw2lw",
  "Best of CaseOh May 2026": "Lc1zG_zKJ7U",
  "Best of CaseOh 2025 (full year)": "_SzHB6wUZDU",
  "CaseOh's Most Viewed Clips of All Time": "GXpCMR1ipQA",
  "Clips That Made CaseOh Famous": "VTJNtUGw2-U"
};

async function seed() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: Supabase environment variables missing! Please check your .env.local file.");
    process.exit(1);
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false
    }
  });

  // Load static files
  const dataDir = path.resolve(__dirname, '../data');
  const curriculumPath = path.join(dataDir, 'curriculum.json');
  const vocabPath = path.join(dataDir, 'vocab.json');

  if (!fs.existsSync(curriculumPath) || !fs.existsSync(vocabPath)) {
    console.error("Error: Curriculum or Vocab JSON files missing. Run generator scripts first.");
    process.exit(1);
  }

  const rawCurriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'));
  const rawVocab = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));

  console.log("Seeding vocab words...");
  const vocabWordsData = rawVocab.map((w: any) => ({
    word_index: w.word_index,
    word: w.word,
    pronunciation: w.pronunciation,
    meaning: w.meaning,
    example_sentence: w.example_sentence
  }));

  const { error: vocabError } = await supabase
    .from('vocab_words')
    .upsert(vocabWordsData, { onConflict: 'word_index' });

  if (vocabError) {
    console.error("Error seeding vocab words:", vocabError.message);
  } else {
    console.log(`Successfully seeded ${vocabWordsData.length} vocabulary words.`);
  }

  console.log("Seeding curriculum days...");
  const daysData = rawCurriculum.map((day: any) => {
    // Map song index to song details
    const songIdx = (day.song_index - 1) % songs.length;
    const song = songs[songIdx] || songs[0];

    // Find CaseOh YouTube video ID if it exists
    let listeningYoutubeId: string | null = null;
    if (day.listening_type === 'caseoh') {
      listeningYoutubeId = caseohYoutubeIds[day.listening_label] || null;
    }

    return {
      day_number: day.day_number,
      month: day.month,
      week: day.week,
      phase_title: day.phase_title,
      weekday: day.weekday,
      grammar_topic: day.grammar_topic,
      grammar_explainer: day.grammar_explainer,
      grammar_youtube_id: null, // to be populated from admin dashboard or custom search
      vocab_range_start: day.vocab_range_start,
      vocab_range_end: day.vocab_range_end,
      writing_prompt: day.writing_prompt,
      speaking_prompt: day.speaking_prompt,
      song_spotify_url: song.url,
      song_title: song.title,
      song_artist: song.artist,
      song_youtube_id: null, // populated on dashboard if needed
      listening_type: day.listening_type,
      listening_youtube_id: listeningYoutubeId,
      listening_label: day.listening_label,
      listening_mode: day.listening_mode || 'subs_on',
      daily_tip: day.daily_tip,
      is_review_day: !!day.is_review_day
    };
  });

  const { error: daysError } = await supabase
    .from('days')
    .upsert(daysData, { onConflict: 'day_number' });

  if (daysError) {
    console.error("Error seeding days:", daysError.message);
  } else {
    console.log(`Successfully seeded ${daysData.length} curriculum days.`);
  }
}

seed().catch((err) => {
  console.error("Unhandle exception during seed execution:", err);
  process.exit(1);
});
