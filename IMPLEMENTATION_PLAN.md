# Sakura English Journey — Implementation Plan

A 90-day, personalized English learning platform. One student (Google login), one teacher (you, via a hidden dashboard). Built to feel like a small premium language app, not a spreadsheet with extra steps.

This document is the full spec. Hand it to your coding agent as-is. It contains architecture, data model, page-by-page UI spec, design direction, and the **complete 90-day curriculum content** ready to seed into the database.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14+ (App Router, TypeScript) | Best Vercel integration, file-based routing fits day-pages well |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, easy to theme |
| Animation | Framer Motion | Used sparingly — page transitions, progress bar fill, checkmark pop |
| Auth + DB | Supabase (Postgres + Auth) | Free tier, Google OAuth built-in, generous limits |
| Hosting | Vercel | Native Next.js support, auto-deploy from GitHub |
| Icons | lucide-react | Clean, consistent line icons |

No AI/LLM calls anywhere in this app. All content is pre-written and stored as structured data (seeded into Supabase via a migration/seed script). The teacher dashboard edits rows in a database table — it does not generate anything.

---

## 2. Project Setup Steps (in order)

1. `npx create-next-app@latest sakura-english-journey --typescript --tailwind --app`
2. Install deps: `npm install @supabase/supabase-js @supabase/ssr framer-motion lucide-react`
3. Init shadcn/ui: `npx shadcn@latest init`, add components: `button`, `card`, `progress`, `checkbox`, `dialog`, `textarea`, `tabs`, `badge`, `avatar`
4. Create Supabase project at supabase.com. Enable **Google** provider under Authentication → Providers (needs a Google Cloud OAuth client ID/secret — standard Supabase Google OAuth setup, documented on their site).
5. Add environment variables to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=   # server-side only, used for teacher dashboard writes
   NEXT_PUBLIC_TEACHER_EMAIL=   # your gmail — the one email allowed into /teacher
   ```
6. Push schema (SQL below) via Supabase SQL editor or a migration file in `supabase/migrations/`.
7. Run a seed script (`scripts/seed.ts`, detailed in section 6) to populate the `days` table from the curriculum JSON in section 7.
8. Connect repo to Vercel, set the same env vars there, deploy.
9. Push to GitHub: `git init`, commit, create repo, push. Add a `.env.local` line to `.gitignore` (should be there by default from create-next-app).

---

## 3. Database Schema (Supabase / Postgres)

```sql
-- Profiles (auto-created on first login via trigger, or lazily on first app load)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  role text not null default 'student' check (role in ('student','teacher')),
  start_date date not null default current_date, -- day 1 anchor, set on first login
  created_at timestamptz not null default now()
);

-- Static curriculum content — one row per day, 1 to 90
create table days (
  day_number int primary key check (day_number between 1 and 90),
  month int not null check (month between 1 and 3),
  week int not null,
  phase_title text not null,           -- "Foundation", "Expansion", "Fluency & Confidence"
  weekday text not null,               -- "Monday".."Sunday"
  grammar_topic text not null,
  grammar_explainer text not null,     -- short teaching text
  grammar_youtube_id text,             -- YouTube video id for grammar lesson
  vocab_range_start int not null,
  vocab_range_end int not null,
  writing_prompt text not null,
  speaking_prompt text not null,
  song_spotify_url text not null,
  song_title text not null,
  song_artist text not null,
  song_youtube_id text,                -- official audio/lyric video if available
  listening_type text not null check (listening_type in ('caseoh','anime','review','movie')),
  listening_youtube_id text,           -- CaseOh compilation video id, or empty for anime (channel link used instead)
  listening_label text not null,       -- e.g. "Best of CaseOh May 2026"
  listening_mode text,                 -- 'subs_on' | 'subs_optional' | 'dub_only' (ramps over 90 days)
  daily_tip text not null,
  is_review_day boolean not null default false
);

-- Oxford word list (300 words, 10 per day across 30 unique vocab days repeated/extended per month)
create table vocab_words (
  id serial primary key,
  word_index int not null unique,      -- 1 to 300
  word text not null,
  pronunciation text,                   -- simple IPA-lite or phonetic spelling
  meaning text not null,
  example_sentence text not null
);

-- Per-user progress per day
create table user_day_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  day_number int not null references days(day_number),
  vocab_done boolean not null default false,
  grammar_done boolean not null default false,
  song_done boolean not null default false,
  listening_done boolean not null default false,
  writing_done boolean not null default false,
  speaking_done boolean not null default false,
  diary_text text,
  diary_word_count int default 0,
  voice_note_url text,                 -- optional, if she uploads an audio file (Supabase Storage)
  songs_new_words text,                -- her submitted words from the song
  caseoh_expressions text,             -- her submitted expressions
  teacher_reviewed boolean not null default false,
  teacher_feedback text,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, day_number)
);

-- Per-user vocab mastery checkboxes
create table user_vocab_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  word_index int not null references vocab_words(word_index),
  learned boolean not null default false,
  primary key (user_id, word_index)
);

-- Teacher announcements (shown on student home page)
create table announcements (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_at timestamptz not null default now(),
  created_by uuid references profiles(id)
);

-- Mistake log (teacher adds recurring mistakes; student sees a running list)
create table mistake_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  mistake text not null,
  correction text not null,
  day_number int references days(day_number),
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table user_day_progress enable row level security;
alter table user_vocab_progress enable row level security;
alter table mistake_log enable row level security;

-- Students can only read/write their own rows. Teacher (matched by email) can read/write all.
create policy "own profile" on profiles for select using (auth.uid() = id);
create policy "own progress read" on user_day_progress for select using (auth.uid() = user_id);
create policy "own progress write" on user_day_progress for insert with check (auth.uid() = user_id);
create policy "own progress update" on user_day_progress for update using (auth.uid() = user_id);
create policy "own vocab" on user_vocab_progress for all using (auth.uid() = user_id);
create policy "own mistakes read" on mistake_log for select using (auth.uid() = user_id);

-- Teacher access is handled server-side via the Supabase service role key in API routes
-- gated by checking the logged-in user's email against NEXT_PUBLIC_TEACHER_EMAIL.
-- days, vocab_words, announcements are public-read, teacher-write-only (via service role).
alter table days enable row level security;
alter table vocab_words enable row level security;
alter table announcements enable row level security;
create policy "public read days" on days for select using (true);
create policy "public read vocab" on vocab_words for select using (true);
create policy "public read announcements" on announcements for select using (true);
```

**Day 1 anchoring:** `start_date` is set to the date of first login. "Day N" for the student is computed as `current_date - start_date + 1`, clamped between 1 and 90. This means the roadmap starts whenever she actually logs in for the first time, not a fixed calendar date — important since you don't know the exact day she'll start.

---

## 4. App Structure / Routes

```
/                         → marketing-ish landing/login screen (Google sign-in button)
/home                     → student dashboard (today's mission, streak, progress)
/day/[n]                  → full lesson page for day n (locked if n > current unlocked day)
/vocabulary                → full 300-word tracker, filterable, mark-as-learned
/grammar                   → list of all grammar topics covered so far, revisit any
/progress                  → stats: streak, words learned, days completed, songs done, charts
/mistakes                  → her personal mistake log (read-only to her)
/teacher                   → gated by email check, full admin dashboard (see section 5)
/teacher/day/[n]           → edit any day's content
/teacher/student/[id]      → view a specific student's diary entries, mark reviewed, leave feedback
```

Middleware (`middleware.ts`) protects `/teacher/*` — redirect to `/home` if `session.user.email !== process.env.NEXT_PUBLIC_TEACHER_EMAIL`.

---

## 5. Page-by-Page Spec

### `/` — Landing
- Full-bleed soft gradient background (see design direction, section 8)
- Centered card: "Sakura English Journey" wordmark, one-line tagline ("90 days. One mission a day. Real progress."), single "Continue with Google" button
- No marketing fluff beyond that — she'll only see this once

### `/home` — Student Dashboard
- Header: greeting using her display name, current streak (flame icon + number)
- Big "Day N / 90" card with animated progress bar (Framer Motion fill on load)
- "Today's Mission" card: checklist preview of today's 6 tasks (Vocabulary, Grammar, Song, Listening, Writing, Speaking) each as a tappable row with a checkbox reflecting `user_day_progress`. Tapping a row's label navigates to `/day/[current]` scrolled to that section; tapping the checkbox itself toggles completion inline without navigating.
- "This Week" mini calendar strip — 7 day-circles, filled/checked for done days, current day highlighted, future days greyed and locked
- Announcements feed (from teacher, if any)
- Latest mistake-log entry teaser, linking to `/mistakes`
- If all 6 tasks for today are done: a small celebratory state (confetti-lite via Framer Motion, not over the top) and a "Mission Complete" badge

### `/day/[n]` — Daily Lesson Page
Locked state: if `n` is beyond the student's current unlocked day, show a "Not unlocked yet" card with the unlock date estimate, no content.

Unlocked state, sections in order (each section has its own checkbox that writes to `user_day_progress`):

1. **Header** — "Day N · Week W · Month M: [Phase Title]", weekday, daily tip quote
2. **Vocabulary** (10 words) — cards showing word, pronunciation, meaning, example sentence, and an input for "your sentence". Each word has its own learned-checkbox synced to `user_vocab_progress`.
3. **Grammar** — topic title, the explainer text, embedded YouTube grammar video (iframe, lazy-loaded), then the writing prompt tied to that grammar point
4. **Song of the Day** — track title/artist, embedded Spotify player (`<iframe>` using the track's embed URL, format: `https://open.spotify.com/embed/track/{id}`), plus a YouTube lyric video if available, and an input box "Write 2 new words from this song"
5. **Listening Practice** (CaseOh / Anime / Movie / Review, rotates per the schedule) — embedded YouTube video (`https://www.youtube.com/embed/{id}`), a "Mark as watched" button (manual tick, per your earlier answer) that logs to `listening_done`, and a text input for "5 expressions you heard" (CaseOh days) or "What happened in this scene?" (anime days)
6. **Writing** — the day's writing prompt, large textarea for her 2-page diary entry, live word counter, autosave on blur (debounced `upsert` to Supabase)
7. **Speaking** — the day's speaking prompt as text reminder ("Record yourself for 2-5 minutes saying...") — no in-browser recording required (keeps scope sane); just a checkbox "I recorded my voice message" plus a note: "Send your voice message to [Vaibhav] directly."
8. **Day complete** — once all 6 are checked, `completed_at` is set and the day's "Mark Complete 🎉" state shows, unlocking `n+1` in the calendar strip.

### `/vocabulary`
Grid/list of all 300 words, filter by Learned / Not Learned / by month. Search box. Each word togglable.

### `/grammar`
List of every grammar topic from day 1 up to her current day, each expandable to show the explainer + video again. Good for review.

### `/progress`
- Streak (current + longest)
- Days completed / 90
- Words learned / 300
- Songs completed
- Videos watched
- A simple bar or line chart (Recharts) of diary word-count over time — visually shows her writing growing, which is motivating

### `/mistakes`
Read-only list of mistake_log entries for her, newest first, each showing the mistake → correction pair and which day it came from.

### `/teacher` — Dashboard (your eyes only)
- Student overview card: her name, current day, streak, last active
- "Pending Review" list: days where she's marked `writing_done = true` but `teacher_reviewed = false`, sorted oldest first
- Click into a day → see her diary text, writing word count, song words, CaseOh expressions → a feedback textarea + "Mark Reviewed" button → optionally "Add to Mistake Log" quick-add (mistake + correction text fields) which inserts into `mistake_log`
- "Announcements" tab — post new announcement, see history, delete
- "Edit Curriculum" tab — table of all 90 days, click any row to edit any field from the `days` schema (grammar topic, prompts, video IDs, etc.) without redeploying

### `middleware.ts`
Redirect unauthenticated users hitting any route except `/` to `/`. Redirect authenticated non-teacher users hitting `/teacher/*` to `/home`.

---

## 6. Seed Script

`scripts/seed.ts` — a one-time Node script run with `npx tsx scripts/seed.ts` that:
1. Reads `data/curriculum.json` (the 90-day structure) and `data/vocab.json` (300 words)
2. Connects to Supabase using the service role key
3. Upserts all rows into `days` and `vocab_words`

This keeps content editable as JSON pre-launch, and editable via the teacher dashboard post-launch, without ever touching component code.

---

## 7. Curriculum Content

### 7.1 Structure Overview

| Month | Days | Phase | Focus |
|---|---|---|---|
| 1 | 1–30 | Foundation | Core tenses, 300→ first 100 Oxford words, daily confidence building, subtitles always on |
| 2 | 31–60 | Expansion | Complex grammar, idioms from songs/CaseOh, words 101–200, subtitles on but faster content |
| 3 | 61–90 | Fluency & Confidence | Advanced grammar, opinion/debate writing, words 201–300, anime sub→dub ramp, final project |

Every day follows the same 6-part shape (Vocabulary → Grammar → Song → Listening → Writing → Speaking). What changes day to day: the grammar topic, the 10 vocab words, the writing/speaking prompt, which song plays, and which listening clip plays.

**Listening rotation logic:**
- Days 1–20: CaseOh, subtitles on, "Best of CaseOh" compilations rotate every ~3 days
- Days 21–30: Mix of CaseOh and first anime intro days (Kaguya-sama, Muse Asia channel, full subs)
- Days 31–60: CaseOh + anime alternate every other day, subs on, content gets longer (full compilations instead of short clips)
- Days 61–75: anime weighted higher, subtitles optional (encourage trying without)
- Days 76–90: dub-focus days mixed in, final week is dub-only challenge

**Song rotation:** all 27 confirmed tracks below cycle in order, repeating from the top once exhausted (happens roughly every 27 days, so each song is heard ~3 times across 90 days — by design, repetition aids retention).

### 7.2 Confirmed Real Content Pool

**Songs (from Vaibhav's Spotify "Romance songs" playlist)** — use Spotify embed via track URL; YouTube lyric video IDs should be searched/added by whoever has YouTube Data API access (script can auto-search "{title} {artist} lyrics" — see note in section 9). Spotify embed alone is sufficient if YouTube search isn't wired up.

```
1. summer nights — The Millennial Club — https://open.spotify.com/track/6tQQYvGkmpjWLVmJKc0Rpr
2. Sofia — Clairo — https://open.spotify.com/track/1zHUEIQ6yzaWBzhNCV1SGW
3. Delusional — John Michael Howell — https://open.spotify.com/track/6As6LBznwCEZPfzUlbRlwq
4. Last Leaves of Autumn — Zleepyfred — https://open.spotify.com/track/7DYjwMLWgZkQzojtg6eBZ2
5. Jenny — Goodmorning Pancake — https://open.spotify.com/track/1HIWAHMEYhdFRiq1kn8QuF
6. Missing Piece — John Michael Howell — https://open.spotify.com/track/25DOfzfpERYnUtEauoZgNA
7. Closer — The Chainsmokers, Halsey — https://open.spotify.com/track/7BKLCZ1jbUBVqRi2FVlTVw
8. The Good Times — Marino — https://open.spotify.com/track/0mHFWWwvg8g4mPtNGy8WYE
9. iwbwy — Hashy — https://open.spotify.com/track/583uuDYBVzaJ7D6mD53gX2
10. Keep You Mine — NOTD, shy martin — https://open.spotify.com/track/0OJN2A3Qyvd7pwSF0AIteC
11. Tattoos — Gun Boi Kaz — https://open.spotify.com/track/2cL5xA2cJkPwlBaxOjuAvc
12. Carry You Home — Alex Warren — https://open.spotify.com/track/1wOp7yTVyH176bW1z9WAiv
13. her (feat. Annika Wells) — JVKE — https://open.spotify.com/track/2Kc8MeW8prVwHEREYM3wCG
14. You — Tom Frane — https://open.spotify.com/track/2YNt5HSUdOiHNpY0Hz44pY
15. 10:35 — Tiësto, Tate McRae — https://open.spotify.com/track/6BePGk3eCan4FqaW2X8Qy3
16. When The Party Ends — Max Allais — https://open.spotify.com/track/0N254dOqqdCm5hviUV2kR9
17. Never Let This Go — Tom Frane — https://open.spotify.com/track/65V63VSXdLbBlU2v7mF6Wk
18. Ordinary — Alex Warren — https://open.spotify.com/track/6qqrTXSdwiJaq8SO0X2lSe
19. My Stupid Heart — Walk off the Earth — https://open.spotify.com/track/3UZDl7g2r84o1b5marUjfK
20. 8 Letters — Why Don't We — https://open.spotify.com/track/4zRZAmBQP8vhNPf9i9opXt
21. Payphone — Maroon 5 — https://open.spotify.com/track/1Vixb2G70s0J2Irf6hi8VE
22. I Really Want to Stay at Your House — Rosa Walton, Hallie Coggins — https://open.spotify.com/track/7mykoq6R3BArsSpNDjFQTm
23. Good For You — Selena Gomez, A$AP Rocky — https://open.spotify.com/track/5xdVqHtFS0eLuNp4Z8Wbpa
24. Touch — KATSEYE — https://open.spotify.com/track/6aJn7Cst74cj4lNIiPRgav
25. Stereo Love — Edward Maya, Vika Jigulina — https://open.spotify.com/track/6EqWTM2gxDbhqqXfcxdMv8
26. I'll Do It — Heidi Montag — https://open.spotify.com/track/3RpCFxfsccNPDTWd3ALMaB
27. Mad Love — Mabel — https://open.spotify.com/track/0jJNpY616X5KgEWRLuxLFi
28. Attention — Charlie Puth — https://open.spotify.com/track/5cF0dROlMOK5uNZtivgu50
29. I Love You 3000 — Stephanie Poetri — https://open.spotify.com/track/3znQ9i61vfe2E7URHlOiyc
30. stupid — Tate McRae — https://open.spotify.com/track/4k3uABcX9iaGlt5pRJhumi
```
Spotify embed URL pattern: `https://open.spotify.com/embed/track/{id}?utm_source=generator`

**CaseOh compilations (real, verified YouTube videos, rotate every ~3-4 days):**
```
- Best of CaseOh January 2026 — youtube.com/watch?v=_QkdMH6gwvs
- Best of CaseOh February 2026 — youtube.com/watch?v=_TDXvn7_xzw
- Best of CaseOh March 2026 — youtube.com/watch?v=GCd0OZqFTsY
- Best of CaseOh April 2026 — youtube.com/watch?v=SbrKH6Qw2lw
- Best of CaseOh May 2026 — youtube.com/watch?v=Lc1zG_zKJ7U
- Best of CaseOh 2025 (full year) — youtube.com/watch?v=_SzHB6wUZDU
- CaseOh's Most Viewed Clips of All Time — youtube.com/watch?v=GXpCMR1ipQA
- Clips That Made CaseOh Famous — youtube.com/watch?v=VTJNtUGw2-U
```
(YouTube embed ID = the part after `v=`. Note: by the time this is built, newer monthly compilations will likely exist — worth a quick search to swap in "Best of CaseOh [current month] 2026" for variety. CaseOh's official channel: youtube.com/channel/UC63anZxfVGHUEmfBAf5w7pw)

**Anime (Muse Asia — licensed, free, legal full episodes on YouTube):**
- Primary pick: **Kaguya-sama: Love is War** — pure romance/comedy, extremely popular, perfect difficulty for a learner already at ~60% subtitle comprehension. Muse Asia's full episode playlist: search "Kaguya-sama Love is War Muse Asia playlist" on YouTube, or channel: youtube.com/c/MuseAsia/videos
- Backup options on the same channel if she finishes Kaguya-sama or wants variety: *Tonikaku Kawaii*, *Horimiya*, *Toradora* (check current Muse Asia catalog — it changes; the teacher dashboard's video-ID fields make swapping trivial)
- **Important implementation note:** rather than hardcoding guessed episode-specific video IDs (risk of being wrong/outdated), the anime listening days should default to embedding the **Muse Asia channel/playlist link** and instruct her "watch the next unwatched episode of Kaguya-sama." The teacher dashboard lets you paste the exact episode video ID once you've confirmed it, day by day, which takes 30 seconds and guarantees accuracy over guessing IDs now.

### 7.3 Grammar Topic Sequence (90 days)

**Month 1 — Foundation (Days 1-30):** Present Simple, Present Continuous, Past Simple, Future (will/going to), Question forms, Negatives, [review], Present Perfect, Present Perfect vs Past Simple, Comparatives, Superlatives, Modal verbs (can/could/should/must), Prepositions of place/time, [review], Adjectives, Adverbs, Conjunctions (and/but/or/so), Because/Although/However, Gerunds, Infinitives, [review], Conditionals (Zero & First), Passive Voice (intro), Relative Clauses (who/which/that), Reported Speech (intro), Mixed practice, Conversation expressions, [Month 1 review + test], Articles (a/an/the), Countable/Uncountable nouns, [Month 1 final project day]

**Month 2 — Expansion (Days 31-60):** Second Conditional, Third Conditional, Passive Voice (deep dive, all tenses), Relative Clauses (advanced, whose/where), Reported Speech (questions & commands), Phrasal Verbs Set 1 (get up, look for, etc.), Phrasal Verbs Set 2, [review], Used to / Would (past habits), Quantifiers (some/any/much/many/few/little), Idioms from songs (collected from weeks 1-4), Linking words (furthermore/however/in addition), Question tags, Indirect questions, [review], Future Continuous, Future Perfect, Mixed conditionals, Causative (have/get something done), Emphasis structures (it is...that), Ellipsis & Substitution, [review], Idioms from CaseOh clips, Common slang vs formal English, Opinion language (I believe/in my view), Agreeing & disagreeing politely, Debate structures, [review], [Month 2 review + test], [Month 2 final project: persuasive essay]

**Month 3 — Fluency & Confidence (Days 61-90):** Advanced Modals (might have, should have, must have), Subjunctive mood, Inversion for emphasis, Cleft sentences, Advanced linking (despite/in spite of/whereas), Narrative tenses combined, Hedging language (it seems/tends to), [review], Academic/formal vocabulary, Presentation language (firstly/to summarize), Storytelling techniques, Humor & sarcasm in English, Anime-specific vocabulary (tropes, genres, character archetypes in English), [review], Business/professional English basics, Email & message etiquette, Phone call English, Small talk mastery, Cultural idioms & expressions, [review], Listening without subtitles strategies, Note-taking while listening, Shadowing technique practice, Accent awareness (American vs British), Fast speech & connected speech, [review], Mock interview practice, Confidence & filler phrases, Final review — all 240+ grammar points, [Month 3 final test], [Graduation Day: 90-day reflection + certificate]

*(Full day-by-day breakdown with specific vocab ranges, writing prompts, and listening assignments for all 90 days is provided as structured JSON in section 7.4 — this is the data that gets seeded directly into the database, so the agent building this should treat section 7.4 as the literal source of truth and the table above as a human-readable summary of the same thing.)*

### 7.4 Full 90-Day JSON (seed data)

This is the actual content. Save as `data/curriculum.json`. Each entry maps directly to a row in the `days` table.

```json
[
  {
    "day_number": 1, "month": 1, "week": 1, "phase_title": "Foundation", "weekday": "Monday",
    "grammar_topic": "Present Simple", "grammar_explainer": "Use Present Simple for facts, habits, and routines. Structure: Subject + Verb (add -s/-es for he/she/it). Example: I study English. She studies English.",
    "vocab_range_start": 1, "vocab_range_end": 10,
    "writing_prompt": "Introduce yourself in 100 words: your name, age, where you're from, your hobbies, and why you're learning English.",
    "speaking_prompt": "Record a 2-minute self introduction in English.",
    "song_index": 1, "listening_type": "caseoh", "listening_label": "Best of CaseOh January 2026", "listening_mode": "subs_on",
    "daily_tip": "Don't translate in your head. If you don't know a word, describe it in simple English instead."
  },
  {
    "day_number": 2, "month": 1, "week": 1, "phase_title": "Foundation", "weekday": "Tuesday",
    "grammar_topic": "Present Continuous", "grammar_explainer": "Use Present Continuous for actions happening right now. Structure: Subject + am/is/are + verb-ing. Example: I am learning English right now.",
    "vocab_range_start": 11, "vocab_range_end": 20,
    "writing_prompt": "Describe your morning routine — what you usually do from waking up to leaving the house.",
    "speaking_prompt": "Tell me what you did today, step by step.",
    "song_index": 2, "listening_type": "caseoh", "listening_label": "Best of CaseOh January 2026", "listening_mode": "subs_on",
    "daily_tip": "Reading lyrics while listening trains your ear to connect sounds to words faster."
  },
  {
    "day_number": 3, "month": 1, "week": 1, "phase_title": "Foundation", "weekday": "Wednesday",
    "grammar_topic": "Past Simple", "grammar_explainer": "Use Past Simple for completed actions in the past. Regular verbs add -ed (walked, talked). Many common verbs are irregular (went, ate, saw) and must be memorized.",
    "vocab_range_start": 21, "vocab_range_end": 30,
    "writing_prompt": "What happened yesterday? Write about your full day from morning to night.",
    "speaking_prompt": "Tell a short story about something that happened to you yesterday.",
    "song_index": 3, "listening_type": "caseoh", "listening_label": "Best of CaseOh January 2026", "listening_mode": "subs_on",
    "daily_tip": "Mistakes are part of learning. Finish your sentence first, fix it after."
  },
  {
    "day_number": 4, "month": 1, "week": 1, "phase_title": "Foundation", "weekday": "Thursday",
    "grammar_topic": "Future (will / going to)", "grammar_explainer": "Use 'will' for spontaneous decisions and predictions. Use 'going to' for plans already decided. Example: I will help you (deciding now). I am going to study tonight (already planned).",
    "vocab_range_start": 31, "vocab_range_end": 40,
    "writing_prompt": "Write about your future dreams — what do you want to achieve in the next 5 years?",
    "speaking_prompt": "Talk about your plans for next year.",
    "song_index": 4, "listening_type": "caseoh", "listening_label": "Best of CaseOh February 2026", "listening_mode": "subs_on",
    "daily_tip": "Say your sentences out loud even when you're alone. Your mouth needs practice, not just your brain."
  },
  {
    "day_number": 5, "month": 1, "week": 1, "phase_title": "Foundation", "weekday": "Friday",
    "grammar_topic": "Questions", "grammar_explainer": "Question word order: Question word + auxiliary verb + subject + main verb. Example: Where do you live? What did you eat?",
    "vocab_range_start": 41, "vocab_range_end": 50,
    "writing_prompt": "Write 20 interview questions you'd ask yourself, then answer all of them.",
    "speaking_prompt": "Answer your own interview questions out loud.",
    "song_index": 5, "listening_type": "caseoh", "listening_label": "Best of CaseOh February 2026", "listening_mode": "subs_on",
    "daily_tip": "Questions are the fastest way to keep a real conversation going. Practice asking, not just answering."
  },
  {
    "day_number": 6, "month": 1, "week": 1, "phase_title": "Foundation", "weekday": "Saturday",
    "grammar_topic": "Negatives", "grammar_explainer": "Use don't/doesn't (present) or didn't (past) + base verb to make negative sentences. Example: I don't like horror movies. She didn't call me.",
    "vocab_range_start": 51, "vocab_range_end": 60,
    "writing_prompt": "Write about things you don't like — foods, habits, weather, anything.",
    "speaking_prompt": "Describe three things you dislike and why.",
    "song_index": 6, "listening_type": "caseoh", "listening_label": "Best of CaseOh February 2026", "listening_mode": "subs_on",
    "daily_tip": "Strong opinions (likes/dislikes) are easier to talk about than neutral facts — use that to practice speaking longer."
  },
  {
    "day_number": 7, "month": 1, "week": 1, "phase_title": "Foundation", "weekday": "Sunday",
    "grammar_topic": "Week 1 Review", "grammar_explainer": "No new grammar today. Review all 5 topics from this week: Present Simple, Present Continuous, Past Simple, Future, Questions, Negatives.",
    "vocab_range_start": 1, "vocab_range_end": 60,
    "writing_prompt": "Write a 200-word diary entry about your whole first week of learning English. What was hard? What was fun?",
    "speaking_prompt": "Speak for 5 minutes about your first week without stopping.",
    "song_index": 7, "listening_type": "review", "listening_label": "Rewatch your favorite clip from this week", "listening_mode": "subs_on",
    "daily_tip": "Review days aren't a break — they're when your brain actually locks in what you learned this week.",
    "is_review_day": true
  },
  {
    "day_number": 8, "month": 1, "week": 2, "phase_title": "Foundation", "weekday": "Monday",
    "grammar_topic": "Present Perfect", "grammar_explainer": "Use Present Perfect (have/has + past participle) for experiences without a specific time, or actions that started in the past and continue now. Example: I have visited Japan. She has lived here for 3 years.",
    "vocab_range_start": 61, "vocab_range_end": 70,
    "writing_prompt": "Write about your life experiences — places you've been, things you've tried, things you've achieved.",
    "speaking_prompt": "Talk about three experiences in your life.",
    "song_index": 8, "listening_type": "caseoh", "listening_label": "Best of CaseOh March 2026", "listening_mode": "subs_on",
    "daily_tip": "Present Perfect is one of the hardest tenses for new learners — it's okay if it takes a few days to feel natural."
  },
  {
    "day_number": 9, "month": 1, "week": 2, "phase_title": "Foundation", "weekday": "Tuesday",
    "grammar_topic": "Present Perfect vs Past Simple", "grammar_explainer": "Past Simple = specific time (yesterday, in 2020). Present Perfect = no specific time, or 'ever/never'. Example: I visited Tokyo last year (Past Simple). I have visited Tokyo twice (Present Perfect).",
    "vocab_range_start": 71, "vocab_range_end": 80,
    "writing_prompt": "Write about your best memory — when did it happen and why was it special?",
    "speaking_prompt": "Tell the story of your best memory.",
    "song_index": 9, "listening_type": "caseoh", "listening_label": "Best of CaseOh March 2026", "listening_mode": "subs_on",
    "daily_tip": "If you can say exactly when something happened, use Past Simple. If not, use Present Perfect."
  },
  {
    "day_number": 10, "month": 1, "week": 2, "phase_title": "Foundation", "weekday": "Wednesday",
    "grammar_topic": "Comparatives", "grammar_explainer": "Short adjectives: add -er (faster, bigger). Long adjectives: use 'more' (more interesting). Example: Anime is more interesting than regular cartoons to me.",
    "vocab_range_start": 81, "vocab_range_end": 90,
    "writing_prompt": "Compare two anime you've watched — which is better and why?",
    "speaking_prompt": "Compare two of your friends — their personalities, habits, or styles.",
    "song_index": 10, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 1", "listening_mode": "subs_on",
    "daily_tip": "Today's listening switches to anime for the first time — watch with subtitles fully on and just enjoy it."
  },
  {
    "day_number": 11, "month": 1, "week": 2, "phase_title": "Foundation", "weekday": "Thursday",
    "grammar_topic": "Superlatives", "grammar_explainer": "Short adjectives: add -est (the fastest, the biggest). Long adjectives: use 'the most' (the most beautiful). Example: This is the best place I've ever visited.",
    "vocab_range_start": 91, "vocab_range_end": 100,
    "writing_prompt": "Describe the best place you've ever been — what made it special?",
    "speaking_prompt": "Talk about your favorite place in the world.",
    "song_index": 11, "listening_type": "caseoh", "listening_label": "Best of CaseOh March 2026", "listening_mode": "subs_on",
    "daily_tip": "You've now learned 100 words. That's enough vocabulary for basic daily conversation — notice how much easier sentences feel."
  },
  {
    "day_number": 12, "month": 1, "week": 2, "phase_title": "Foundation", "weekday": "Friday",
    "grammar_topic": "Modal Verbs (can, could, should, must)", "grammar_explainer": "can = ability, could = past ability/polite request, should = advice, must = obligation. Example: You should sleep early. You must finish your homework.",
    "vocab_range_start": 101, "vocab_range_end": 110,
    "writing_prompt": "Write 5 rules for students learning English — what should they do? What must they avoid?",
    "speaking_prompt": "Give advice to someone who just started learning English.",
    "song_index": 12, "listening_type": "caseoh", "listening_label": "Best of CaseOh April 2026", "listening_mode": "subs_on",
    "daily_tip": "Modal verbs change the whole feeling of a sentence — 'you should' sounds like advice, 'you must' sounds like a rule."
  },
  {
    "day_number": 13, "month": 1, "week": 2, "phase_title": "Foundation", "weekday": "Saturday",
    "grammar_topic": "Prepositions of Place & Time", "grammar_explainer": "in (months, years, rooms), on (days, dates, streets), at (exact times, specific points). Example: I wake up at 7am. I study on Mondays. I was born in 2003.",
    "vocab_range_start": 111, "vocab_range_end": 120,
    "writing_prompt": "Describe your room in detail — where everything is located.",
    "speaking_prompt": "Give directions from your house to your favorite place nearby.",
    "song_index": 13, "listening_type": "caseoh", "listening_label": "Best of CaseOh April 2026", "listening_mode": "subs_on",
    "daily_tip": "Prepositions don't always translate directly between languages — the best way to learn them is through example sentences, not rules."
  },
  {
    "day_number": 14, "month": 1, "week": 2, "phase_title": "Foundation", "weekday": "Sunday",
    "grammar_topic": "Week 2 Review", "grammar_explainer": "Review: Present Perfect, Present Perfect vs Past Simple, Comparatives, Superlatives, Modals, Prepositions.",
    "vocab_range_start": 61, "vocab_range_end": 120,
    "writing_prompt": "Write a 250-word reflection on Week 2 — what grammar topic was hardest? What are you proud of?",
    "speaking_prompt": "Speak for 10 minutes about anything — practice without a script.",
    "song_index": 14, "listening_type": "review", "listening_label": "Rewatch your favorite clip from this week", "listening_mode": "subs_on",
    "daily_tip": "120 words and 12 grammar topics in 2 weeks — that's real progress. Keep going.",
    "is_review_day": true
  },
  {
    "day_number": 15, "month": 1, "week": 3, "phase_title": "Foundation", "weekday": "Monday",
    "grammar_topic": "Adjectives", "grammar_explainer": "Adjectives describe nouns and come before them in English. Example: a beautiful song, a funny video. Order matters with multiple adjectives: opinion before size before age before color (a nice big old red car).",
    "vocab_range_start": 121, "vocab_range_end": 130,
    "writing_prompt": "Describe yourself using at least 10 different adjectives.",
    "speaking_prompt": "Describe your personality in 2 minutes.",
    "song_index": 15, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 2", "listening_mode": "subs_on",
    "daily_tip": "Try describing the same thing three different ways. It builds flexibility, not just memorization."
  },
  {
    "day_number": 16, "month": 1, "week": 3, "phase_title": "Foundation", "weekday": "Tuesday",
    "grammar_topic": "Adverbs", "grammar_explainer": "Adverbs describe verbs, usually formed by adding -ly to an adjective. Example: She speaks quickly. He sings beautifully.",
    "vocab_range_start": 131, "vocab_range_end": 140,
    "writing_prompt": "Describe your daily habits using adverbs (quickly, often, always, rarely, etc.)",
    "speaking_prompt": "Talk about how you do things — fast or slow, often or rarely.",
    "song_index": 16, "listening_type": "caseoh", "listening_label": "Best of CaseOh April 2026", "listening_mode": "subs_on",
    "daily_tip": "Adverbs of frequency (always, usually, often, sometimes, rarely, never) are some of the most useful words in daily conversation."
  },
  {
    "day_number": 17, "month": 1, "week": 3, "phase_title": "Foundation", "weekday": "Wednesday",
    "grammar_topic": "Conjunctions (and, but, or, so)", "grammar_explainer": "Conjunctions connect ideas. and = addition, but = contrast, or = choice, so = result. Example: I like anime, but I don't have much time to watch it.",
    "vocab_range_start": 141, "vocab_range_end": 150,
    "writing_prompt": "Write about your favorite anime — what is it about and why do you love it?",
    "speaking_prompt": "Recommend an anime to a friend and explain why they should watch it.",
    "song_index": 17, "listening_type": "caseoh", "listening_label": "Best of CaseOh May 2026", "listening_mode": "subs_on",
    "daily_tip": "Connecting two short sentences into one longer sentence with 'but' or 'so' instantly makes your English sound more natural."
  },
  {
    "day_number": 18, "month": 1, "week": 3, "phase_title": "Foundation", "weekday": "Thursday",
    "grammar_topic": "Because / Although / However", "grammar_explainer": "because = gives a reason, although = shows contrast within one sentence, however = shows contrast between two sentences (starts a new sentence). Example: I love this song because the lyrics are beautiful. Although it's slow, I still enjoy it.",
    "vocab_range_start": 151, "vocab_range_end": 160,
    "writing_prompt": "Write an opinion paragraph about something you feel strongly about, using because, although, and however at least once each.",
    "speaking_prompt": "Explain your opinion on a topic and give reasons.",
    "song_index": 18, "listening_type": "caseoh", "listening_label": "Best of CaseOh May 2026", "listening_mode": "subs_on",
    "daily_tip": "Giving reasons (because) makes your opinions sound more confident and harder to argue against."
  },
  {
    "day_number": 19, "month": 1, "week": 3, "phase_title": "Foundation", "weekday": "Friday",
    "grammar_topic": "Gerunds", "grammar_explainer": "A gerund is a verb + -ing used as a noun. Example: Swimming is fun. I enjoy reading. Some verbs (enjoy, finish, avoid) are always followed by a gerund, never an infinitive.",
    "vocab_range_start": 161, "vocab_range_end": 170,
    "writing_prompt": "Write about your hobbies using gerunds (Reading is..., I enjoy..., I love...).",
    "speaking_prompt": "Talk about what you enjoy doing in your free time.",
    "song_index": 19, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 3", "listening_mode": "subs_on",
    "daily_tip": "Gerunds feel tricky in any new language because the rule of 'which verbs use -ing vs to + verb' has to be memorized case by case."
  },
  {
    "day_number": 20, "month": 1, "week": 3, "phase_title": "Foundation", "weekday": "Saturday",
    "grammar_topic": "Infinitives", "grammar_explainer": "An infinitive is 'to' + base verb, used to express purpose or after certain verbs. Example: I want to learn English. She came here to study.",
    "vocab_range_start": 171, "vocab_range_end": 180,
    "writing_prompt": "Write about your goals — what do you want to achieve and why?",
    "speaking_prompt": "Talk about your biggest goal for this year.",
    "song_index": 20, "listening_type": "caseoh", "listening_label": "Best of CaseOh 2025 (full year)", "listening_mode": "subs_on",
    "daily_tip": "You're 20 days in — that's two-thirds of Month 1 done. Notice how much faster you read these instructions now compared to Day 1."
  },
  {
    "day_number": 21, "month": 1, "week": 3, "phase_title": "Foundation", "weekday": "Sunday",
    "grammar_topic": "Week 3 Review", "grammar_explainer": "Review: Adjectives, Adverbs, Conjunctions, Because/Although/However, Gerunds, Infinitives.",
    "vocab_range_start": 121, "vocab_range_end": 180,
    "writing_prompt": "Write a 250-word movie or anime review using comparatives, adjectives, and conjunctions.",
    "speaking_prompt": "Give a 7-minute spoken review of a movie or anime you recently watched.",
    "song_index": 21, "listening_type": "movie", "listening_label": "Watch a 30-minute English-language video of your choice with subtitles", "listening_mode": "subs_on",
    "daily_tip": "180 words learned. You can now build fairly complex sentences — try combining 2-3 grammar points in one sentence today.",
    "is_review_day": true
  },
  {
    "day_number": 22, "month": 1, "week": 4, "phase_title": "Foundation", "weekday": "Monday",
    "grammar_topic": "Conditionals (Zero & First)", "grammar_explainer": "Zero conditional = general truths (If you heat water, it boils). First conditional = real future possibility (If I study hard, I will pass). Structure: If + present simple, will + base verb.",
    "vocab_range_start": 181, "vocab_range_end": 190,
    "writing_prompt": "Write about 'If I had...' — imagine different possibilities for your life.",
    "speaking_prompt": "Talk about what you would do if you had a free day with no responsibilities.",
    "song_index": 22, "listening_type": "caseoh", "listening_label": "Best of CaseOh 2025 (full year)", "listening_mode": "subs_on",
    "daily_tip": "Conditionals let you talk about hypothetical situations — a skill that makes conversation much richer."
  },
  {
    "day_number": 23, "month": 1, "week": 4, "phase_title": "Foundation", "weekday": "Tuesday",
    "grammar_topic": "Passive Voice (Introduction)", "grammar_explainer": "Passive voice focuses on the action, not who did it. Structure: Subject + be + past participle. Example: The song was written by a famous artist. (Active: A famous artist wrote the song.)",
    "vocab_range_start": 191, "vocab_range_end": 200,
    "writing_prompt": "Describe a process step by step (how to cook your favorite food, how to learn a song) using passive voice where natural.",
    "speaking_prompt": "Explain how something is made or done.",
    "song_index": 23, "listening_type": "caseoh", "listening_label": "CaseOh's Most Viewed Clips of All Time", "listening_mode": "subs_on",
    "daily_tip": "Passive voice is common in news, instructions, and formal writing — but don't overuse it in everyday speech, which prefers active voice."
  },
  {
    "day_number": 24, "month": 1, "week": 4, "phase_title": "Foundation", "weekday": "Wednesday",
    "grammar_topic": "Relative Clauses (who, which, that)", "grammar_explainer": "Relative clauses add extra information about a noun. who = people, which = things, that = either. Example: The friend who taught me this song is from Japan.",
    "vocab_range_start": 201, "vocab_range_end": 210,
    "writing_prompt": "Describe a friend using relative clauses (a person who..., a friend that...).",
    "speaking_prompt": "Describe someone important in your life.",
    "song_index": 24, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 4", "listening_mode": "subs_on",
    "daily_tip": "Relative clauses let you describe people and things in more detail without starting a new sentence every time."
  },
  {
    "day_number": 25, "month": 1, "week": 4, "phase_title": "Foundation", "weekday": "Thursday",
    "grammar_topic": "Reported Speech (Introduction)", "grammar_explainer": "Reported speech repeats what someone said, often shifting the tense back. Example: Direct: 'I am tired.' Reported: She said she was tired.",
    "vocab_range_start": 211, "vocab_range_end": 220,
    "writing_prompt": "Retell a conversation you had recently, using reported speech (he said that..., she told me that...).",
    "speaking_prompt": "Tell me about a conversation you had this week.",
    "song_index": 25, "listening_type": "caseoh", "listening_label": "Clips That Made CaseOh Famous", "listening_mode": "subs_on",
    "daily_tip": "Reported speech is genuinely one of the harder structures in English — don't worry if it takes practice over several days to feel natural."
  },
  {
    "day_number": 26, "month": 1, "week": 4, "phase_title": "Foundation", "weekday": "Friday",
    "grammar_topic": "Mixed Practice", "grammar_explainer": "Today combines everything from this month: tenses, conditionals, relative clauses, passive voice. No new topic — just practice mixing them in your writing and speaking.",
    "vocab_range_start": 221, "vocab_range_end": 230,
    "writing_prompt": "Write about your country — its culture, food, and what you love about it. Try to use at least 3 different grammar structures from this month.",
    "speaking_prompt": "Give a 5-minute talk about your country to someone who has never been there.",
    "song_index": 26, "listening_type": "caseoh", "listening_label": "Best of CaseOh January 2026", "listening_mode": "subs_on",
    "daily_tip": "Mixing grammar structures naturally in conversation is the real goal — textbook-perfect single-topic sentences are just the first step."
  },
  {
    "day_number": 27, "month": 1, "week": 4, "phase_title": "Foundation", "weekday": "Saturday",
    "grammar_topic": "Conversation Expressions", "grammar_explainer": "Useful phrases for natural conversation: 'By the way...', 'Speaking of which...', 'That reminds me...', 'Anyway...', 'I see what you mean.' These connect ideas the way native speakers actually talk.",
    "vocab_range_start": 231, "vocab_range_end": 240,
    "writing_prompt": "Write a travel dialogue between two people planning a trip, using at least 5 conversation expressions.",
    "speaking_prompt": "Have an imaginary conversation out loud, using natural connector phrases.",
    "song_index": 27, "listening_type": "caseoh", "listening_label": "Best of CaseOh February 2026", "listening_mode": "subs_on",
    "daily_tip": "These small connector phrases are what make English sound natural instead of textbook-stiff. Start sneaking them into your diary entries."
  },
  {
    "day_number": 28, "month": 1, "week": 4, "phase_title": "Foundation", "weekday": "Sunday",
    "grammar_topic": "Week 4 Review", "grammar_explainer": "Review: Conditionals, Passive Voice, Relative Clauses, Reported Speech, Conversation Expressions.",
    "vocab_range_start": 181, "vocab_range_end": 240,
    "writing_prompt": "Write a 250-word diary entry about your full month of learning English so far.",
    "speaking_prompt": "Speak for 10 minutes summarizing everything you've learned this month.",
    "song_index": 1, "listening_type": "review", "listening_label": "Rewatch your favorite clip from this week", "listening_mode": "subs_on",
    "daily_tip": "240 words and a full grammar foundation in 4 weeks. The hardest part — starting — is already behind you.",
    "is_review_day": true
  },
  {
    "day_number": 29, "month": 1, "week": 5, "phase_title": "Foundation", "weekday": "Monday",
    "grammar_topic": "Articles (a / an / the)", "grammar_explainer": "Use 'a/an' for something unspecific or mentioned for the first time. Use 'the' for something specific or already mentioned. Example: I watched a movie. The movie was amazing.",
    "vocab_range_start": 241, "vocab_range_end": 250,
    "writing_prompt": "Write about a recent purchase or gift — what was it, the story behind it, why it matters to you.",
    "speaking_prompt": "Talk about something you recently bought or received.",
    "song_index": 2, "listening_type": "caseoh", "listening_label": "Best of CaseOh March 2026", "listening_mode": "subs_on",
    "daily_tip": "Articles (a/an/the) don't exist in every language, including Japanese — so this naturally takes more conscious practice."
  },
  {
    "day_number": 30, "month": 1, "week": 5, "phase_title": "Foundation", "weekday": "Tuesday",
    "grammar_topic": "Countable & Uncountable Nouns", "grammar_explainer": "Countable nouns can be counted (one song, two songs). Uncountable nouns can't (music, water, advice). Use 'much' with uncountable, 'many' with countable. Example: I don't have much time. I have many songs.",
    "vocab_range_start": 251, "vocab_range_end": 260,
    "writing_prompt": "MONTH 1 FINAL PROJECT: Write a 300-word essay titled 'My First Month Learning English' — what you learned, your biggest challenge, and what you're proud of.",
    "speaking_prompt": "Record a 10-minute final video: introduce yourself, talk about your month, and use as much vocabulary and grammar as you can.",
    "song_index": 3, "listening_type": "movie", "listening_label": "Watch a 20-minute English video of your choice and summarize it afterward", "listening_mode": "subs_on",
    "daily_tip": "Month 1 complete. Take a moment to reread your Day 1 diary entry and compare it to today's — that's real, measurable progress.",
    "is_review_day": true
  },
  {
    "day_number": 31, "month": 2, "week": 5, "phase_title": "Expansion", "weekday": "Wednesday",
    "grammar_topic": "Second Conditional", "grammar_explainer": "Used for unreal/imaginary present or future situations. Structure: If + past simple, would + base verb. Example: If I won the lottery, I would travel the world.",
    "vocab_range_start": 261, "vocab_range_end": 270,
    "writing_prompt": "Write about 'If I became rich' — describe your imaginary life in detail.",
    "speaking_prompt": "Talk about a hypothetical scenario — what would you do if you could live anywhere?",
    "song_index": 4, "listening_type": "caseoh", "listening_label": "Best of CaseOh April 2026", "listening_mode": "subs_on",
    "daily_tip": "Welcome to Month 2. The grammar gets harder from here, but your foundation is solid enough to handle it."
  },
  {
    "day_number": 32, "month": 2, "week": 5, "phase_title": "Expansion", "weekday": "Thursday",
    "grammar_topic": "Third Conditional", "grammar_explainer": "Used for imaginary past situations — things that didn't happen. Structure: If + past perfect, would have + past participle. Example: If I had studied harder, I would have passed the test.",
    "vocab_range_start": 271, "vocab_range_end": 280,
    "writing_prompt": "Write about a regret or a moment you'd change, using third conditional sentences.",
    "speaking_prompt": "Talk about a decision in your past you would make differently.",
    "song_index": 5, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 5", "listening_mode": "subs_on",
    "daily_tip": "Third conditional is one of the most complex structures in English — even advanced learners mix it up sometimes."
  },
  {
    "day_number": 33, "month": 2, "week": 5, "phase_title": "Expansion", "weekday": "Friday",
    "grammar_topic": "Passive Voice (All Tenses)", "grammar_explainer": "Passive voice can be used in any tense: is made, was made, has been made, will be made. Example: This song was written in 2020. It has been streamed millions of times.",
    "vocab_range_start": 281, "vocab_range_end": 290,
    "writing_prompt": "Write a short news-style report about something happening in your life, using passive voice in different tenses.",
    "speaking_prompt": "Report on a recent event like a news anchor.",
    "song_index": 6, "listening_type": "caseoh", "listening_label": "Best of CaseOh May 2026", "listening_mode": "subs_on",
    "daily_tip": "News reports and formal writing use passive voice constantly — listen for it next time you watch or read English news."
  },
  {
    "day_number": 34, "month": 2, "week": 5, "phase_title": "Expansion", "weekday": "Saturday",
    "grammar_topic": "Relative Clauses (Advanced: whose, where)", "grammar_explainer": "whose = possession (the singer whose voice I love), where = place (the cafe where I study). These add detail without starting new sentences.",
    "vocab_range_start": 291, "vocab_range_end": 300,
    "writing_prompt": "Describe your hometown — the places where you grew up and the people whose influence shaped you.",
    "speaking_prompt": "Describe your hometown in detail using whose and where.",
    "song_index": 7, "listening_type": "caseoh", "listening_label": "Best of CaseOh 2025 (full year)", "listening_mode": "subs_on",
    "daily_tip": "You've now learned all 300 Oxford 3000 words. From here, vocabulary days will introduce idioms and expressions instead of single words.",
    "is_review_day": true
  },
  {
    "day_number": 35, "month": 2, "week": 6, "phase_title": "Expansion", "weekday": "Sunday",
    "grammar_topic": "Reported Speech (Questions & Commands)", "grammar_explainer": "Reported questions drop the question word order: He asked where I lived (not 'where did I live'). Reported commands use 'to': She told me to wait.",
    "vocab_range_start": 1, "vocab_range_end": 300,
    "writing_prompt": "Write a 250-word reflection on Week 5 — what was different about Month 2 so far compared to Month 1?",
    "speaking_prompt": "Retell a recent conversation, reporting both questions and commands someone gave you.",
    "song_index": 8, "listening_type": "review", "listening_label": "Rewatch your favorite clip from this week", "listening_mode": "subs_on",
    "daily_tip": "From here, vocabulary review mixes old and new words on purpose — repetition across the full 300 keeps everything sharp.",
    "is_review_day": true
  },
  {
    "day_number": 36, "month": 2, "week": 6, "phase_title": "Expansion", "weekday": "Monday",
    "grammar_topic": "Phrasal Verbs — Set 1 (daily life)", "grammar_explainer": "Phrasal verbs = verb + preposition with a meaning different from the individual words. get up (rise from bed), look for (search), turn off (stop a device), give up (quit).",
    "vocab_range_start": 1, "vocab_range_end": 15,
    "writing_prompt": "Write about your daily routine using at least 5 phrasal verbs (get up, turn on, look for, etc.).",
    "speaking_prompt": "Describe your morning routine using phrasal verbs.",
    "song_index": 9, "listening_type": "caseoh", "listening_label": "Best of CaseOh January 2026", "listening_mode": "subs_on",
    "daily_tip": "Phrasal verbs are everywhere in casual native speech — this is exactly the kind of thing you'll start noticing in CaseOh clips."
  },
  {
    "day_number": 37, "month": 2, "week": 6, "phase_title": "Expansion", "weekday": "Tuesday",
    "grammar_topic": "Phrasal Verbs — Set 2 (relationships & emotions)", "grammar_explainer": "get along with (have a good relationship), fall for (start liking someone), break up (end a relationship), cheer up (become happier), figure out (understand).",
    "vocab_range_start": 16, "vocab_range_end": 30,
    "writing_prompt": "Write about a relationship in your life — a friend, family member, or someone you admire — using phrasal verbs.",
    "speaking_prompt": "Talk about how you get along with the people close to you.",
    "song_index": 10, "listening_type": "caseoh", "listening_label": "Best of CaseOh February 2026", "listening_mode": "subs_on",
    "daily_tip": "These relationship phrasal verbs show up constantly in romance songs and anime — perfect timing for today's listening."
  },
  {
    "day_number": 38, "month": 2, "week": 6, "phase_title": "Expansion", "weekday": "Wednesday",
    "grammar_topic": "Week 6 Catch-up & Mixed Practice", "grammar_explainer": "No new topic today — practice combining phrasal verbs with conditionals and passive voice from earlier this month.",
    "vocab_range_start": 31, "vocab_range_end": 45,
    "writing_prompt": "Free write: anything on your mind today, in English, for 2 pages.",
    "speaking_prompt": "Speak freely for 5 minutes about whatever you want.",
    "song_index": 11, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 6", "listening_mode": "subs_on",
    "daily_tip": "Free-writing days build fluency differently than prompted days — there's no 'wrong' direction, just keep the pen (or keyboard) moving."
  },
  {
    "day_number": 39, "month": 2, "week": 6, "phase_title": "Expansion", "weekday": "Thursday",
    "grammar_topic": "Used to / Would (past habits)", "grammar_explainer": "'Used to' describes past habits or states that are no longer true. 'Would' describes repeated past actions (not states). Example: I used to live in a small town. We would watch anime together every weekend.",
    "vocab_range_start": 46, "vocab_range_end": 60,
    "writing_prompt": "Write about how your life used to be different — habits, places, people from your past.",
    "speaking_prompt": "Talk about something you used to do but don't do anymore.",
    "song_index": 12, "listening_type": "caseoh", "listening_label": "Best of CaseOh March 2026", "listening_mode": "subs_on",
    "daily_tip": "'Used to' is one of the easiest ways to sound more fluent instantly — it's a small structure with a big effect."
  },
  {
    "day_number": 40, "month": 2, "week": 6, "phase_title": "Expansion", "weekday": "Friday",
    "grammar_topic": "Quantifiers (some, any, much, many, few, little)", "grammar_explainer": "some/any = unspecified amount, much/little = uncountable nouns, many/few = countable nouns. Example: I have many songs but little time. I don't have any plans today.",
    "vocab_range_start": 61, "vocab_range_end": 75,
    "writing_prompt": "Describe your week — how much free time you had, how many tasks you finished, how few mistakes you made.",
    "speaking_prompt": "Talk about how much progress you've made and how many things you still want to learn.",
    "song_index": 13, "listening_type": "caseoh", "listening_label": "Best of CaseOh April 2026", "listening_mode": "subs_on",
    "daily_tip": "Quantifiers are small words that native speakers use constantly without thinking — practice them until they feel automatic."
  },
  {
    "day_number": 41, "month": 2, "week": 6, "phase_title": "Expansion", "weekday": "Saturday",
    "grammar_topic": "Idioms From Songs (collected review)", "grammar_explainer": "Today, review the idioms and unusual phrases you've collected from songs over the past 5 weeks. Pick your top 5 favorite phrases and explain what they really mean.",
    "vocab_range_start": 76, "vocab_range_end": 90,
    "writing_prompt": "Pick 5 idioms or phrases from songs you've learned and explain their meaning, then use each one in your own sentence.",
    "speaking_prompt": "Explain your 5 favorite song lyrics/idioms out loud as if teaching someone else.",
    "song_index": 14, "listening_type": "caseoh", "listening_label": "Best of CaseOh May 2026", "listening_mode": "subs_on",
    "daily_tip": "Idioms from songs stick in memory far better than idioms from a textbook list — that's the whole reason music was part of this plan from Day 1."
  },
  {
    "day_number": 42, "month": 2, "week": 6, "phase_title": "Expansion", "weekday": "Sunday",
    "grammar_topic": "Week 6 Review", "grammar_explainer": "Review: Phrasal Verbs, Used to/Would, Quantifiers, Song Idioms.",
    "vocab_range_start": 1, "vocab_range_end": 90,
    "writing_prompt": "Write a 250-word diary about your second week of Month 2.",
    "speaking_prompt": "Speak for 10 minutes summarizing this week's grammar and using at least 3 phrasal verbs.",
    "song_index": 15, "listening_type": "review", "listening_label": "Rewatch your favorite clip from this week", "listening_mode": "subs_on",
    "daily_tip": "You're now using grammar from both Month 1 and Month 2 together in single conversations — that's true integration, not just memorization.",
    "is_review_day": true
  },
  {
    "day_number": 43, "month": 2, "week": 7, "phase_title": "Expansion", "weekday": "Monday",
    "grammar_topic": "Linking Words (furthermore, however, in addition)", "grammar_explainer": "Formal linking words connect ideas in writing. furthermore/in addition = adding a point, however = contrast, therefore = result. Example: I love this song. Furthermore, the music video tells a beautiful story.",
    "vocab_range_start": 91, "vocab_range_end": 105,
    "writing_prompt": "Write a structured opinion essay about your favorite music genre using formal linking words.",
    "speaking_prompt": "Give a structured, formal-sounding opinion on a topic you care about.",
    "song_index": 16, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 7", "listening_mode": "subs_on",
    "daily_tip": "Formal linking words sound stiff in casual chat but are extremely useful for essays, emails, and presentations."
  },
  {
    "day_number": 44, "month": 2, "week": 7, "phase_title": "Expansion", "weekday": "Tuesday",
    "grammar_topic": "Question Tags", "grammar_explainer": "Short questions added to the end of a statement to confirm or check. Example: You like this song, don't you? She isn't coming, is she? (positive statement → negative tag, and vice versa)",
    "vocab_range_start": 106, "vocab_range_end": 120,
    "writing_prompt": "Write a dialogue between two friends using question tags naturally throughout.",
    "speaking_prompt": "Practice using question tags in casual conversation out loud.",
    "song_index": 17, "listening_type": "caseoh", "listening_label": "Best of CaseOh January 2026", "listening_mode": "subs_on",
    "daily_tip": "Question tags are one of the clearest signals of natural, confident spoken English — listen for them in CaseOh's casual speech."
  },
  {
    "day_number": 45, "month": 2, "week": 7, "phase_title": "Expansion", "weekday": "Wednesday",
    "grammar_topic": "Indirect Questions", "grammar_explainer": "A more polite way to ask questions. Example: Direct: 'Where is the station?' Indirect: 'Could you tell me where the station is?' Word order stays normal (no inversion) in the embedded question.",
    "vocab_range_start": 121, "vocab_range_end": 135,
    "writing_prompt": "Write a polite email or message asking someone for help, using indirect questions.",
    "speaking_prompt": "Practice asking for help politely using indirect questions.",
    "song_index": 18, "listening_type": "caseoh", "listening_label": "Best of CaseOh February 2026", "listening_mode": "subs_on",
    "daily_tip": "Indirect questions instantly make your English sound more polite and mature — useful in any formal situation."
  },
  {
    "day_number": 46, "month": 2, "week": 7, "phase_title": "Expansion", "weekday": "Thursday",
    "grammar_topic": "Week 7 Catch-up & Mixed Practice", "grammar_explainer": "No new topic — combine linking words, question tags, and indirect questions in a single piece of writing today.",
    "vocab_range_start": 136, "vocab_range_end": 150,
    "writing_prompt": "Free write: describe your ideal weekend in detail.",
    "speaking_prompt": "Describe your ideal weekend out loud, naturally.",
    "song_index": 19, "listening_type": "caseoh", "listening_label": "Best of CaseOh March 2026", "listening_mode": "subs_on",
    "daily_tip": "Notice today how naturally question tags and linking words are starting to appear in your own writing without forcing them."
  },
  {
    "day_number": 47, "month": 2, "week": 7, "phase_title": "Expansion", "weekday": "Friday",
    "grammar_topic": "Future Continuous", "grammar_explainer": "Used for actions that will be in progress at a specific future time. Structure: will be + verb-ing. Example: This time next week, I will be studying for my test.",
    "vocab_range_start": 151, "vocab_range_end": 165,
    "writing_prompt": "Write about what you imagine you'll be doing this time next year.",
    "speaking_prompt": "Describe what you think you'll be doing at this exact time tomorrow.",
    "song_index": 20, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 8", "listening_mode": "subs_on",
    "daily_tip": "Future Continuous paints a picture of a moment in progress, which makes your writing feel more vivid and specific."
  },
  {
    "day_number": 48, "month": 2, "week": 7, "phase_title": "Expansion", "weekday": "Saturday",
    "grammar_topic": "Future Perfect", "grammar_explainer": "Used for actions that will be completed before a specific future time. Structure: will have + past participle. Example: By next year, I will have finished this course.",
    "vocab_range_start": 166, "vocab_range_end": 180,
    "writing_prompt": "Write about your goals using Future Perfect — what will you have achieved by the end of this year?",
    "speaking_prompt": "Talk about what you will have accomplished by a specific future date.",
    "song_index": 21, "listening_type": "caseoh", "listening_label": "Best of CaseOh April 2026", "listening_mode": "subs_on",
    "daily_tip": "Future Perfect is rare in casual conversation but powerful in goal-setting language — useful for interviews and self-reflection."
  },
  {
    "day_number": 49, "month": 2, "week": 7, "phase_title": "Expansion", "weekday": "Sunday",
    "grammar_topic": "Week 7 Review", "grammar_explainer": "Review: Linking words, Question tags, Indirect questions, Future Continuous, Future Perfect.",
    "vocab_range_start": 1, "vocab_range_end": 180,
    "writing_prompt": "Write a 250-word reflection on Week 7.",
    "speaking_prompt": "Speak for 10 minutes using at least one example of every grammar topic from this week.",
    "song_index": 22, "listening_type": "review", "listening_label": "Rewatch your favorite clip from this week", "listening_mode": "subs_on",
    "daily_tip": "Halfway through Month 2 — the grammar from here gets more nuanced, but you've already handled the hardest conceptual jump (conditionals and passive voice).",
    "is_review_day": true
  },
  {
    "day_number": 50, "month": 2, "week": 8, "phase_title": "Expansion", "weekday": "Monday",
    "grammar_topic": "Mixed Conditionals", "grammar_explainer": "Combines past and present in one conditional sentence. Example: If I had studied English earlier (past), I would be fluent now (present result).",
    "vocab_range_start": 181, "vocab_range_end": 195,
    "writing_prompt": "Write about how a past decision affects your present life, using mixed conditionals.",
    "speaking_prompt": "Talk about how something from your past has shaped who you are today.",
    "song_index": 23, "listening_type": "caseoh", "listening_label": "Best of CaseOh May 2026", "listening_mode": "subs_on",
    "daily_tip": "Mixed conditionals are an advanced structure — even native speakers don't always use them perfectly. You're doing genuinely advanced work now."
  },
  {
    "day_number": 51, "month": 2, "week": 8, "phase_title": "Expansion", "weekday": "Tuesday",
    "grammar_topic": "Causative (have/get something done)", "grammar_explainer": "Used when someone else does an action for you. Structure: have/get + object + past participle. Example: I had my hair cut. I'm going to get my essay checked.",
    "vocab_range_start": 196, "vocab_range_end": 210,
    "writing_prompt": "Write about services or help you've received recently, using causative structures.",
    "speaking_prompt": "Talk about something you need to have done or get fixed.",
    "song_index": 24, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 9", "listening_mode": "subs_on",
    "daily_tip": "Causative structures are practical, everyday English — useful the moment you travel or deal with services in English."
  },
  {
    "day_number": 52, "month": 2, "week": 8, "phase_title": "Expansion", "weekday": "Wednesday",
    "grammar_topic": "Emphasis Structures (it is...that / what I really mean is)", "grammar_explainer": "Used to highlight a specific part of a sentence. Example: It was the lyrics that made me cry. What I really love is the chorus.",
    "vocab_range_start": 211, "vocab_range_end": 225,
    "writing_prompt": "Write about something you feel strongly about, using emphasis structures to highlight your main point.",
    "speaking_prompt": "Give a passionate, emphasized opinion about a song or anime you love.",
    "song_index": 25, "listening_type": "caseoh", "listening_label": "CaseOh's Most Viewed Clips of All Time", "listening_mode": "subs_on",
    "daily_tip": "Emphasis structures are how native speakers add drama and feeling to a sentence without raising their voice."
  },
  {
    "day_number": 53, "month": 2, "week": 8, "phase_title": "Expansion", "weekday": "Thursday",
    "grammar_topic": "Ellipsis & Substitution", "grammar_explainer": "Native speakers often drop repeated words (ellipsis) or replace them with 'one/do/so' (substitution) to avoid repetition. Example: 'Do you like it?' 'I do.' (instead of 'I like it.')",
    "vocab_range_start": 226, "vocab_range_end": 240,
    "writing_prompt": "Write a natural dialogue between two friends, paying attention to how repeated words get dropped or replaced.",
    "speaking_prompt": "Have a quick back-and-forth conversation with short, natural answers (not full repeated sentences).",
    "song_index": 26, "listening_type": "caseoh", "listening_label": "Clips That Made CaseOh Famous", "listening_mode": "subs_on",
    "daily_tip": "This is one of the biggest gaps between textbook English and real spoken English — native speakers almost never repeat full sentences."
  },
  {
    "day_number": 54, "month": 2, "week": 8, "phase_title": "Expansion", "weekday": "Friday",
    "grammar_topic": "Week 8 Catch-up & Mixed Practice", "grammar_explainer": "No new topic — combine mixed conditionals, causative, and emphasis structures in today's writing.",
    "vocab_range_start": 241, "vocab_range_end": 255,
    "writing_prompt": "Free write: describe a recent challenge and how you overcame it.",
    "speaking_prompt": "Talk about a challenge you've faced and how you dealt with it.",
    "song_index": 27, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 10", "listening_mode": "subs_on",
    "daily_tip": "Talking through a real challenge is some of the best speaking practice — emotional honesty makes you reach for vocabulary you wouldn't normally use."
  },
  {
    "day_number": 55, "month": 2, "week": 8, "phase_title": "Expansion", "weekday": "Saturday",
    "grammar_topic": "Idioms From CaseOh Clips (collected review)", "grammar_explainer": "Review the slang, idioms, and casual expressions you've collected from CaseOh over the past 8 weeks. Today, organize and explain your top 10 favorites.",
    "vocab_range_start": 1, "vocab_range_end": 15,
    "writing_prompt": "List your 10 favorite expressions from CaseOh's videos and explain what each one means and when to use it.",
    "speaking_prompt": "Explain 5 CaseOh expressions out loud, as if teaching them to someone else.",
    "song_index": 1, "listening_type": "caseoh", "listening_label": "Best of CaseOh January 2026", "listening_mode": "subs_on",
    "daily_tip": "Casual internet/streaming slang isn't 'incorrect' English — it's a real register, and knowing when to use it (and when not to) is an advanced skill."
  },
  {
    "day_number": 56, "month": 2, "week": 8, "phase_title": "Expansion", "weekday": "Sunday",
    "grammar_topic": "Common Slang vs Formal English", "grammar_explainer": "English has registers: slang/casual (gonna, wanna, that's lit) vs formal (going to, want to, that's excellent). Knowing both — and when to switch — is a sign of real fluency.",
    "vocab_range_start": 16, "vocab_range_end": 30,
    "writing_prompt": "Write the same short paragraph twice: once in casual/slang English, once in formal English.",
    "speaking_prompt": "Say the same sentence in both casual and formal English, back to back.",
    "song_index": 2, "listening_type": "review", "listening_label": "Rewatch your favorite clip from this week", "listening_mode": "subs_on",
    "daily_tip": "Knowing when to be casual versus formal is a skill many advanced non-native speakers never fully develop — you're building it deliberately.",
    "is_review_day": true
  },
  {
    "day_number": 57, "month": 2, "week": 9, "phase_title": "Expansion", "weekday": "Monday",
    "grammar_topic": "Opinion Language (I believe, in my view, from my perspective)", "grammar_explainer": "Formal ways to express opinions beyond 'I think'. Example: In my view, this song is the best on the album. From my perspective, the chorus could be stronger.",
    "vocab_range_start": 31, "vocab_range_end": 45,
    "writing_prompt": "Write a structured opinion piece on a topic you care about using varied opinion phrases (not just 'I think' every time).",
    "speaking_prompt": "Give your opinion on a topic, varying your opening phrase each time.",
    "song_index": 3, "listening_type": "caseoh", "listening_label": "Best of CaseOh February 2026", "listening_mode": "subs_on",
    "daily_tip": "Repeating 'I think' constantly is one of the clearest signs of a beginner — today's phrases are an easy upgrade."
  },
  {
    "day_number": 58, "month": 2, "week": 9, "phase_title": "Expansion", "weekday": "Tuesday",
    "grammar_topic": "Agreeing & Disagreeing Politely", "grammar_explainer": "Agree: 'That's a good point.' 'I couldn't agree more.' Disagree politely: 'I see what you mean, but...' 'I'm not so sure about that.' Avoid blunt 'No, you're wrong.'",
    "vocab_range_start": 46, "vocab_range_end": 60,
    "writing_prompt": "Write a dialogue where two people disagree about something (favorite anime, favorite song) but stay polite throughout.",
    "speaking_prompt": "Practice disagreeing politely with an opinion you don't actually agree with.",
    "song_index": 4, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 11", "listening_mode": "subs_on",
    "daily_tip": "Polite disagreement is a genuinely advanced social-language skill — many native speakers struggle with this too."
  },
  {
    "day_number": 59, "month": 2, "week": 9, "phase_title": "Expansion", "weekday": "Wednesday",
    "grammar_topic": "Debate Structures", "grammar_explainer": "Structuring an argument: state your position, give 2-3 reasons, address a counterpoint, conclude. Example phrases: 'Firstly... Secondly... Some might argue... However... In conclusion...'",
    "vocab_range_start": 61, "vocab_range_end": 75,
    "writing_prompt": "Write a structured 250-word argument for or against a topic of your choice, following the debate structure.",
    "speaking_prompt": "Give a 5-minute structured argument for your position on any topic.",
    "song_index": 5, "listening_type": "caseoh", "listening_label": "Best of CaseOh March 2026", "listening_mode": "subs_on",
    "daily_tip": "This structure (position → reasons → counterpoint → conclusion) works for essays, interviews, and real arguments alike."
  },
  {
    "day_number": 60, "month": 2, "week": 9, "phase_title": "Expansion", "weekday": "Thursday",
    "grammar_topic": "Month 2 Review & Test", "grammar_explainer": "Comprehensive review of all Month 2 grammar: conditionals (2nd/3rd/mixed), passive voice, relative clauses, reported speech, phrasal verbs, quantifiers, linking words, question tags, future tenses, causative, emphasis, ellipsis, debate language.",
    "vocab_range_start": 1, "vocab_range_end": 300,
    "writing_prompt": "MONTH 2 FINAL PROJECT: Write a 350-word persuasive essay on any topic you care about, using as many of this month's grammar structures as you naturally can.",
    "speaking_prompt": "Record a 10-minute persuasive speech defending your position on the same topic as your essay.",
    "song_index": 6, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 12 (or your favorite episode so far)", "listening_mode": "subs_on",
    "daily_tip": "Month 2 complete. The leap from Month 1 to Month 2 was the hardest grammar jump in the whole course — Month 3 builds fluency on top of what you already have.",
    "is_review_day": true
  },
  {
    "day_number": 61, "month": 3, "week": 9, "phase_title": "Fluency & Confidence", "weekday": "Friday",
    "grammar_topic": "Advanced Modals (might have, should have, must have)", "grammar_explainer": "Used to speculate about the past. might have = possibility, should have = regret/criticism, must have = strong certainty. Example: She must have forgotten. I should have called earlier.",
    "vocab_range_start": 1, "vocab_range_end": 20,
    "writing_prompt": "Write about a mystery or misunderstanding, speculating about what might have happened using advanced modals.",
    "speaking_prompt": "Speculate out loud about something uncertain in your life using might have/should have/must have.",
    "song_index": 7, "listening_type": "caseoh", "listening_label": "Best of CaseOh April 2026", "listening_mode": "subs_optional",
    "daily_tip": "Welcome to Month 3. From today, try watching the first few minutes of your listening practice without subtitles before turning them on."
  },
  {
    "day_number": 62, "month": 3, "week": 9, "phase_title": "Fluency & Confidence", "weekday": "Saturday",
    "grammar_topic": "Subjunctive Mood", "grammar_explainer": "Used in formal English for wishes, suggestions, and hypotheticals. Example: I suggest that she be on time. If I were you, I would apologize. (note: 'were' not 'was', even for I/he/she)",
    "vocab_range_start": 21, "vocab_range_end": 40,
    "writing_prompt": "Write formal advice to a friend using subjunctive structures (I suggest that..., if I were you...).",
    "speaking_prompt": "Give formal advice to an imaginary friend using subjunctive mood.",
    "song_index": 8, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 13", "listening_mode": "subs_optional",
    "daily_tip": "Subjunctive mood is rare in casual speech but signals strong formal fluency when used correctly."
  },
  {
    "day_number": 63, "month": 3, "week": 9, "phase_title": "Fluency & Confidence", "weekday": "Sunday",
    "grammar_topic": "Week 9 Review", "grammar_explainer": "Review: Advanced Modals, Subjunctive Mood.",
    "vocab_range_start": 1, "vocab_range_end": 40,
    "writing_prompt": "Write a 250-word reflection on starting Month 3 — how does it feel different from Month 1?",
    "speaking_prompt": "Speak for 10 minutes without subtitles support beforehand — just speak from memory and feeling.",
    "song_index": 9, "listening_type": "review", "listening_label": "Rewatch your favorite clip from this week, try without subtitles first", "listening_mode": "subs_optional",
    "daily_tip": "Month 3 is about confidence as much as grammar. Trust what you've already built over the last 60 days.",
    "is_review_day": true
  },
  {
    "day_number": 64, "month": 3, "week": 10, "phase_title": "Fluency & Confidence", "weekday": "Monday",
    "grammar_topic": "Inversion for Emphasis", "grammar_explainer": "Reversing normal word order for dramatic emphasis, common in formal/literary English. Example: Never have I felt so proud. Not only did she finish the course, but she also helped others.",
    "vocab_range_start": 41, "vocab_range_end": 60,
    "writing_prompt": "Write a dramatic, emotional paragraph about a proud moment in your life using inversion for emphasis.",
    "speaking_prompt": "Say one proud, dramatic sentence about yourself using inversion (Never have I..., Not only did I...).",
    "song_index": 10, "listening_type": "caseoh", "listening_label": "Best of CaseOh May 2026", "listening_mode": "subs_optional",
    "daily_tip": "Inversion is a literary/dramatic device — you won't use it daily, but recognizing it in songs and speeches is valuable."
  },
  {
    "day_number": 65, "month": 3, "week": 10, "phase_title": "Fluency & Confidence", "weekday": "Tuesday",
    "grammar_topic": "Cleft Sentences", "grammar_explainer": "Restructuring a sentence to emphasize a specific part. Example: What I love most is the chorus. It's the melody that gets stuck in my head.",
    "vocab_range_start": 61, "vocab_range_end": 80,
    "writing_prompt": "Rewrite 5 simple sentences as cleft sentences to add emphasis, then write a paragraph using the technique naturally.",
    "speaking_prompt": "Practice 5 cleft sentences out loud, emphasizing the most important word each time.",
    "song_index": 11, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 14", "listening_mode": "subs_optional",
    "daily_tip": "Cleft sentences are a small trick that instantly makes spoken English sound more expressive and intentional."
  },
  {
    "day_number": 66, "month": 3, "week": 10, "phase_title": "Fluency & Confidence", "weekday": "Wednesday",
    "grammar_topic": "Advanced Linking (despite, in spite of, whereas)", "grammar_explainer": "despite/in spite of + noun/gerund = contrast (Despite the rain, we went out). whereas = comparing two contrasting facts (I love pop music, whereas my friend prefers rock).",
    "vocab_range_start": 81, "vocab_range_end": 100,
    "writing_prompt": "Write a comparison piece (two countries, two anime genres, two music styles) using despite, in spite of, and whereas.",
    "speaking_prompt": "Compare two things you have strong opinions about using advanced linking words.",
    "song_index": 12, "listening_type": "caseoh", "listening_label": "Best of CaseOh 2025 (full year)", "listening_mode": "subs_optional",
    "daily_tip": "These advanced linkers are common in essays, debates, and news commentary — exactly the register a confident English speaker can shift into."
  },
  {
    "day_number": 67, "month": 3, "week": 10, "phase_title": "Fluency & Confidence", "weekday": "Thursday",
    "grammar_topic": "Narrative Tenses Combined", "grammar_explainer": "Real stories mix tenses: Past Simple (main events), Past Continuous (background action), Past Perfect (earlier events). Example: I was walking home (continuous) when I realized I had forgotten (perfect) my phone, so I went back (simple).",
    "vocab_range_start": 101, "vocab_range_end": 120,
    "writing_prompt": "Write a short story (any genre) using all three past tenses naturally mixed together.",
    "speaking_prompt": "Tell a story out loud, mixing past tenses the way a native storyteller would.",
    "song_index": 13, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 15", "listening_mode": "subs_optional",
    "daily_tip": "This is exactly how anime narration and CaseOh's storytelling clips naturally mix tenses — listen for it today."
  },
  {
    "day_number": 68, "month": 3, "week": 10, "phase_title": "Fluency & Confidence", "weekday": "Friday",
    "grammar_topic": "Hedging Language (it seems, tends to, sort of, kind of)", "grammar_explainer": "Used to soften statements and sound less direct/more natural. Example: It seems like the weather is changing. She tends to be late. It's sort of complicated.",
    "vocab_range_start": 121, "vocab_range_end": 140,
    "writing_prompt": "Write about an uncertain or complicated situation using hedging language throughout.",
    "speaking_prompt": "Describe something uncertain using hedging phrases (it seems, kind of, sort of) instead of direct statements.",
    "song_index": 14, "listening_type": "caseoh", "listening_label": "Best of CaseOh January 2026", "listening_mode": "subs_optional",
    "daily_tip": "Hedging language is everywhere in casual native speech — it makes statements sound natural instead of overly blunt or robotic."
  },
  {
    "day_number": 69, "month": 3, "week": 10, "phase_title": "Fluency & Confidence", "weekday": "Saturday",
    "grammar_topic": "Week 10 Catch-up & Mixed Practice", "grammar_explainer": "No new topic — combine inversion, cleft sentences, advanced linking, and hedging language today.",
    "vocab_range_start": 141, "vocab_range_end": 160,
    "writing_prompt": "Free write: anything on your mind, aiming for natural, expressive English using this week's structures where they fit.",
    "speaking_prompt": "Speak freely for 7 minutes, consciously trying to use at least 3 structures from this week.",
    "song_index": 15, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 16", "listening_mode": "subs_optional",
    "daily_tip": "By now, complex grammar should be starting to appear in your free writing without you forcing it — that's the real sign of internalization."
  },
  {
    "day_number": 70, "month": 3, "week": 10, "phase_title": "Fluency & Confidence", "weekday": "Sunday",
    "grammar_topic": "Week 10 Review", "grammar_explainer": "Review: Inversion, Cleft sentences, Advanced linking, Narrative tenses, Hedging language.",
    "vocab_range_start": 1, "vocab_range_end": 160,
    "writing_prompt": "Write a 250-word reflection on Week 10.",
    "speaking_prompt": "Speak for 10 minutes summarizing this week, trying to avoid subtitles entirely for today's listening.",
    "song_index": 16, "listening_type": "review", "listening_label": "Rewatch your favorite clip from this week, no subtitles", "listening_mode": "subs_optional",
    "daily_tip": "10 weeks down, 3 to go. You're now deep into genuinely advanced English structures most learners never reach.",
    "is_review_day": true
  },
  {
    "day_number": 71, "month": 3, "week": 11, "phase_title": "Fluency & Confidence", "weekday": "Monday",
    "grammar_topic": "Academic / Formal Vocabulary", "grammar_explainer": "Upgrading casual words to formal equivalents: get → obtain, find out → discover, a lot of → numerous, big → significant. Useful for essays, presentations, and professional contexts.",
    "vocab_range_start": 161, "vocab_range_end": 180,
    "writing_prompt": "Rewrite a casual paragraph from earlier in your diary using formal/academic vocabulary instead.",
    "speaking_prompt": "Give a short, formal-sounding talk on any topic, deliberately using upgraded vocabulary.",
    "song_index": 17, "listening_type": "caseoh", "listening_label": "Best of CaseOh February 2026", "listening_mode": "subs_optional",
    "daily_tip": "Being able to switch between casual and formal vocabulary on demand is one of the clearest markers of advanced fluency."
  },
  {
    "day_number": 72, "month": 3, "week": 11, "phase_title": "Fluency & Confidence", "weekday": "Tuesday",
    "grammar_topic": "Presentation Language (firstly, to summarize, moving on)", "grammar_explainer": "Phrases that structure a spoken presentation: 'Firstly... Moving on to my next point... To summarize...' These give listeners a clear roadmap of your talk.",
    "vocab_range_start": 181, "vocab_range_end": 200,
    "writing_prompt": "Write the outline/script for a 5-point presentation on a topic of your choice using presentation language.",
    "speaking_prompt": "Deliver your presentation out loud as if speaking to an audience.",
    "song_index": 18, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 17", "listening_mode": "subs_optional",
    "daily_tip": "Presentation structure works for job interviews, school presentations, and even organizing your own thoughts out loud."
  },
  {
    "day_number": 73, "month": 3, "week": 11, "phase_title": "Fluency & Confidence", "weekday": "Wednesday",
    "grammar_topic": "Storytelling Techniques", "grammar_explainer": "Good stories use sensory detail, dialogue, and pacing — not just events in order. Example: instead of 'I was scared,' try 'My hands were shaking and I couldn't breathe.'",
    "vocab_range_start": 201, "vocab_range_end": 220,
    "writing_prompt": "Rewrite a memory from earlier in your diary as a vivid, detailed short story using sensory description and dialogue.",
    "speaking_prompt": "Tell the same story out loud with as much detail and emotion as you can.",
    "song_index": 19, "listening_type": "caseoh", "listening_label": "Best of CaseOh March 2026", "listening_mode": "subs_optional",
    "daily_tip": "CaseOh's storytelling style — building tension, using sound effects and pauses — is actually a great real-world model for vivid storytelling."
  },
  {
    "day_number": 74, "month": 3, "week": 11, "phase_title": "Fluency & Confidence", "weekday": "Thursday",
    "grammar_topic": "Humor & Sarcasm in English", "grammar_explainer": "Sarcasm often uses tone and obvious exaggeration, plus phrases like 'oh great,' 'just what I needed,' 'sure, that'll work.' Humor often relies on understatement or unexpected timing.",
    "vocab_range_start": 221, "vocab_range_end": 240,
    "writing_prompt": "Write a short, humorous diary entry about something mildly annoying that happened, using light sarcasm.",
    "speaking_prompt": "Tell a funny, slightly exaggerated story about your day, the way CaseOh tells stories.",
    "song_index": 20, "listening_type": "caseoh", "listening_label": "CaseOh's Most Viewed Clips of All Time", "listening_mode": "subs_optional",
    "daily_tip": "Sarcasm is notoriously hard to translate between languages and cultures — pay close attention to CaseOh's tone today, not just his words."
  },
  {
    "day_number": 75, "month": 3, "week": 11, "phase_title": "Fluency & Confidence", "weekday": "Friday",
    "grammar_topic": "Anime-Specific Vocabulary (genres, tropes, archetypes in English)", "grammar_explainer": "English terms for things you already know in Japanese context: slow burn, love triangle, tsundere (kept as-is in English fandom), comic relief, plot twist, character development, foreshadowing.",
    "vocab_range_start": 241, "vocab_range_end": 260,
    "writing_prompt": "Write an English-language anime review using genre/trope vocabulary (slow burn, plot twist, character development, etc.).",
    "speaking_prompt": "Discuss your favorite anime trope or character archetype out loud in English.",
    "song_index": 21, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 18", "listening_mode": "subs_optional",
    "daily_tip": "This is the vocabulary that lets you actually discuss anime with English-speaking fans online — directly useful for something you already love."
  },
  {
    "day_number": 76, "month": 3, "week": 11, "phase_title": "Fluency & Confidence", "weekday": "Saturday",
    "grammar_topic": "Week 11 Catch-up & Mixed Practice", "grammar_explainer": "No new topic — combine academic vocabulary, presentation language, and storytelling techniques today.",
    "vocab_range_start": 261, "vocab_range_end": 280,
    "writing_prompt": "Free write: write about anything, mixing formal and casual register intentionally in different paragraphs.",
    "speaking_prompt": "Speak for 7 minutes, switching between formal and casual tone on purpose.",
    "song_index": 22, "listening_type": "caseoh", "listening_label": "Clips That Made CaseOh Famous", "listening_mode": "dub_only",
    "daily_tip": "Today's first dub-only listening challenge — don't worry about catching every word, focus on overall meaning and tone."
  },
  {
    "day_number": 77, "month": 3, "week": 11, "phase_title": "Fluency & Confidence", "weekday": "Sunday",
    "grammar_topic": "Week 11 Review", "grammar_explainer": "Review: Academic vocabulary, Presentation language, Storytelling, Humor & sarcasm, Anime vocabulary.",
    "vocab_range_start": 1, "vocab_range_end": 280,
    "writing_prompt": "Write a 250-word reflection on Week 11.",
    "speaking_prompt": "Speak for 10 minutes on anything, then listen back to your own recording and note what you'd improve.",
    "song_index": 23, "listening_type": "review", "listening_label": "Rewatch your favorite clip from this week", "listening_mode": "subs_optional",
    "daily_tip": "Listening to your own recordings is one of the fastest ways to improve — you'll catch patterns you can't hear in the moment.",
    "is_review_day": true
  },
  {
    "day_number": 78, "month": 3, "week": 12, "phase_title": "Fluency & Confidence", "weekday": "Monday",
    "grammar_topic": "Business / Professional English Basics", "grammar_explainer": "Common professional phrases: 'I look forward to hearing from you,' 'Please find attached,' 'Let's circle back on this,' 'I'd like to follow up on...'",
    "vocab_range_start": 281, "vocab_range_end": 300,
    "writing_prompt": "Write a professional email requesting information about something (a class, a job, a service).",
    "speaking_prompt": "Practice speaking professionally, as if in a meeting or job interview.",
    "song_index": 24, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 19", "listening_mode": "subs_optional",
    "daily_tip": "Even if you don't need professional English right now, having it ready expands every future opportunity."
  },
  {
    "day_number": 79, "month": 3, "week": 12, "phase_title": "Fluency & Confidence", "weekday": "Tuesday",
    "grammar_topic": "Email & Message Etiquette", "grammar_explainer": "Formal openings (Dear..., Hi...), formal closings (Best regards, Sincerely), tone matching for context (casual text vs formal email).",
    "vocab_range_start": 1, "vocab_range_end": 300,
    "writing_prompt": "Write 3 short messages in 3 different tones: a casual text to a friend, a polite message to a teacher, a formal email to a company.",
    "speaking_prompt": "Read your 3 messages out loud, adjusting your tone of voice for each one.",
    "song_index": 25, "listening_type": "caseoh", "listening_label": "Best of CaseOh April 2026", "listening_mode": "subs_optional",
    "daily_tip": "Matching tone to context (casual vs formal) is a skill that applies in every language, not just English — but it's worth practicing explicitly."
  },
  {
    "day_number": 80, "month": 3, "week": 12, "phase_title": "Fluency & Confidence", "weekday": "Wednesday",
    "grammar_topic": "Phone Call English", "grammar_explainer": "Common phone phrases: 'Hello, this is [name] speaking,' 'Can you hear me okay?' 'Could you repeat that?' 'I'll call you back.' Different rhythm than face-to-face conversation.",
    "vocab_range_start": 1, "vocab_range_end": 300,
    "writing_prompt": "Write a script for a phone conversation (ordering food, asking for information, calling a friend).",
    "speaking_prompt": "Practice your phone script out loud as if actually on a call.",
    "song_index": 26, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 20", "listening_mode": "dub_only",
    "daily_tip": "Phone calls remove visual cues (lips, gestures) that usually help comprehension — that's why they feel harder, even for advanced learners."
  },
  {
    "day_number": 81, "month": 3, "week": 12, "phase_title": "Fluency & Confidence", "weekday": "Thursday",
    "grammar_topic": "Small Talk Mastery", "grammar_explainer": "English small talk topics: weather, weekend plans, shared activities. Useful starter phrases: 'How's it going?' 'Any plans for the weekend?' 'Crazy weather today, huh?'",
    "vocab_range_start": 1, "vocab_range_end": 300,
    "writing_prompt": "Write a realistic small talk conversation between two people who just met.",
    "speaking_prompt": "Practice starting a small talk conversation out loud, as if meeting someone new.",
    "song_index": 27, "listening_type": "caseoh", "listening_label": "Best of CaseOh May 2026", "listening_mode": "subs_optional",
    "daily_tip": "Small talk feels unimportant but is often the gateway to every deeper conversation — it's worth practicing deliberately."
  },
  {
    "day_number": 82, "month": 3, "week": 12, "phase_title": "Fluency & Confidence", "weekday": "Friday",
    "grammar_topic": "Cultural Idioms & Expressions", "grammar_explainer": "Common English idioms: 'break the ice,' 'piece of cake,' 'under the weather,' 'hit the books,' 'spill the beans.' These don't translate literally and must be learned as full phrases.",
    "vocab_range_start": 1, "vocab_range_end": 300,
    "writing_prompt": "Write a short story using at least 5 cultural idioms naturally.",
    "speaking_prompt": "Try to use 5 idioms correctly in casual conversation out loud.",
    "song_index": 1, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 21", "listening_mode": "subs_optional",
    "daily_tip": "Idioms are some of the most 'native-sounding' parts of a language — using even a few correctly makes a big impression."
  },
  {
    "day_number": 83, "month": 3, "week": 12, "phase_title": "Fluency & Confidence", "weekday": "Saturday",
    "grammar_topic": "Week 12 Catch-up & Mixed Practice", "grammar_explainer": "No new topic — combine professional English, small talk, and idioms today.",
    "vocab_range_start": 1, "vocab_range_end": 300,
    "writing_prompt": "Free write: anything, but try to use at least 2 idioms and 1 professional phrase naturally.",
    "speaking_prompt": "Speak freely for 7 minutes, mixing registers naturally based on what you're talking about.",
    "song_index": 2, "listening_type": "caseoh", "listening_label": "Best of CaseOh 2025 (full year)", "listening_mode": "dub_only",
    "daily_tip": "By now, switching registers should feel less like a conscious decision and more like a natural reflex based on context."
  },
  {
    "day_number": 84, "month": 3, "week": 12, "phase_title": "Fluency & Confidence", "weekday": "Sunday",
    "grammar_topic": "Week 12 Review", "grammar_explainer": "Review: Professional English, Email etiquette, Phone English, Small talk, Cultural idioms.",
    "vocab_range_start": 1, "vocab_range_end": 300,
    "writing_prompt": "Write a 250-word reflection on Week 12 — almost done with the 90 days!",
    "speaking_prompt": "Speak for 10 minutes on how far you've come since Day 1.",
    "song_index": 3, "listening_type": "review", "listening_label": "Rewatch your favorite clip from the whole course", "listening_mode": "dub_only",
    "daily_tip": "One week left. Everything from here is about polishing and proving what you've already built, not learning brand-new concepts.",
    "is_review_day": true
  },
  {
    "day_number": 85, "month": 3, "week": 13, "phase_title": "Fluency & Confidence", "weekday": "Monday",
    "grammar_topic": "Listening Without Subtitles Strategies", "grammar_explainer": "Techniques: focus on tone and key words rather than every word, predict meaning from context, accept some words will be missed, watch body language and facial expression for clues.",
    "vocab_range_start": 1, "vocab_range_end": 300,
    "writing_prompt": "After watching today's clip without subtitles, write a summary of what you understood, even if it's incomplete.",
    "speaking_prompt": "Explain what you understood from today's no-subtitle clip, out loud, filling gaps with reasonable guesses.",
    "song_index": 4, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 22", "listening_mode": "dub_only",
    "daily_tip": "Understanding 70% of something without subtitles is a win, not a failure — perfection isn't the goal, comprehension is."
  },
  {
    "day_number": 86, "month": 3, "week": 13, "phase_title": "Fluency & Confidence", "weekday": "Tuesday",
    "grammar_topic": "Note-Taking While Listening", "grammar_explainer": "Practice jotting down key words (not full sentences) while listening, then reconstructing the meaning afterward. This mirrors how native listeners process fast speech.",
    "vocab_range_start": 1, "vocab_range_end": 300,
    "writing_prompt": "Take notes while watching today's clip, then write a full paragraph reconstructing what happened from your notes.",
    "speaking_prompt": "Using only your notes, explain out loud what happened in the clip.",
    "song_index": 5, "listening_type": "caseoh", "listening_label": "Best of CaseOh January 2026", "listening_mode": "dub_only",
    "daily_tip": "Note-taking while listening is a real skill used in interpreting and exam prep — and it forces active rather than passive listening."
  },
  {
    "day_number": 87, "month": 3, "week": 13, "phase_title": "Fluency & Confidence", "weekday": "Wednesday",
    "grammar_topic": "Shadowing Technique Practice", "grammar_explainer": "Shadowing = repeating what you hear almost simultaneously, copying rhythm, stress, and intonation exactly. One of the most effective pronunciation techniques used by professional interpreters.",
    "vocab_range_start": 1, "vocab_range_end": 300,
    "writing_prompt": "Write about how shadowing felt — was it hard to keep up? What did you notice about rhythm and stress in English?",
    "speaking_prompt": "Shadow a 1-minute clip of CaseOh or your song of the day — speak along almost at the same time, copying the rhythm.",
    "song_index": 6, "listening_type": "caseoh", "listening_label": "Best of CaseOh February 2026", "listening_mode": "subs_optional",
    "daily_tip": "Shadowing is uncomfortable at first — that's normal. It's training your mouth muscles for English rhythm, which is different from Japanese rhythm."
  },
  {
    "day_number": 88, "month": 3, "week": 13, "phase_title": "Fluency & Confidence", "weekday": "Thursday",
    "grammar_topic": "Accent Awareness (American vs British)", "grammar_explainer": "Key differences: vocabulary (apartment/flat, elevator/lift), pronunciation (r-sounds, vowel shifts), spelling (color/colour). CaseOh is American English; some YouTube anime dubs use different accents.",
    "vocab_range_start": 1, "vocab_range_end": 300,
    "writing_prompt": "Write a short list comparing American vs British versions of 10 common words/phrases.",
    "speaking_prompt": "Try saying 5 words in both an American and British pronunciation style, just for fun.",
    "song_index": 7, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — Episode 23", "listening_mode": "dub_only",
    "daily_tip": "You don't need to choose one accent — understanding both is the actually useful skill, and you'll naturally pick up your own blend."
  },
  {
    "day_number": 89, "month": 3, "week": 13, "phase_title": "Fluency & Confidence", "weekday": "Friday",
    "grammar_topic": "Fast Speech & Connected Speech", "grammar_explainer": "Native speakers blend words together: 'want to' becomes 'wanna,' 'going to' becomes 'gonna,' 'what are you' becomes 'whatcha.' Recognizing these patterns is key to understanding fast natural speech.",
    "vocab_range_start": 1, "vocab_range_end": 300,
    "writing_prompt": "Write a casual dialogue using connected speech spellings (gonna, wanna, kinda) the way people actually text.",
    "speaking_prompt": "Practice saying 10 sentences using natural connected speech instead of slow, separated words.",
    "song_index": 8, "listening_type": "caseoh", "listening_label": "Best of CaseOh March 2026", "listening_mode": "dub_only",
    "daily_tip": "This is almost certainly the exact thing making the anime dub feel 'too fast' — connected speech, not just speaking rate."
  },
  {
    "day_number": 90, "month": 3, "week": 13, "phase_title": "Fluency & Confidence", "weekday": "Saturday",
    "grammar_topic": "Graduation Day — Full Review & Final Reflection", "grammar_explainer": "No new grammar. Today is a celebration and comprehensive review of all 90 days: every tense, every structure, everything you've built since Day 1.",
    "vocab_range_start": 1, "vocab_range_end": 300,
    "writing_prompt": "GRADUATION PROJECT: Write a 400-500 word essay titled 'My 90 Days Learning English' — your journey, biggest struggles, proudest moments, and what's next.",
    "speaking_prompt": "Record a final 10-15 minute video: introduce yourself, reflect on your 90 days, and speak as freely and confidently as you can.",
    "song_index": 9, "listening_type": "anime", "listening_label": "Kaguya-sama: Love is War (Muse Asia) — your favorite episode from the course, no subtitles", "listening_mode": "dub_only",
    "daily_tip": "Compare your Day 1 self-introduction to today's graduation essay. That difference is 90 days of real, consistent work — congratulations.",
    "is_review_day": true
  }
]
```

**Note on vocab_range fields in review/mixed days:** where `vocab_range_start`/`end` spans a wide range (e.g. 1–300), this signals "review across everything learned so far" rather than "10 new words" — the frontend should detect when a day is `is_review_day: true` and show a "Review Mode" vocabulary widget (pick 10 random words from the range to quiz) instead of the standard "10 new words" widget.

**Note on `song_index`:** this maps to position 1-27 in the song pool (section 7.2), cycling. When `song_index` exceeds 27 conceptually it wraps back to 1 — the values above are already pre-wrapped for convenience.

### 7.5 Vocabulary Word List (data/vocab.json)

The full 300-word Oxford 3000-based list should be generated as a separate JSON file with this shape per entry:

```json
{ "word_index": 1, "word": "able", "pronunciation": "AY-bul", "meaning": "having the power or skill to do something", "example_sentence": "I am able to speak a little English now." }
```

**Implementation note for the coding agent:** Anthropic's web search confirmed the Oxford 3000 word list exists but pulling all 300 entries with pronunciation + definitions + example sentences is a large, mechanical data-entry task better suited to direct generation than hand-curation in this planning doc. Generate the full 300-word list programmatically (e.g., prompt an LLM once, offline, to produce `vocab.json` in the exact schema above, using the real Oxford 3000 word list as the source — the first 300 words by frequency/level), OR pull from a free Oxford 3000 API/dataset if available. This is the one piece of content in this plan that should be generated as a discrete sub-task before seeding, rather than hand-written here, since 300 well-formed dictionary-style entries would dominate this document without adding planning value.

---

## 8. Design Direction

**Audience cue:** built for a Japanese aesthetic sensibility — think clean stationery apps (Hobonichi-style journals), soft seasonal motifs, generous whitespace, not loud or cluttered. Avoid generic "kawaii pastel bubble" defaults — aim for *elegant* Japanese, not *cute-overload* Japanese.

**Color palette:**
- Background: warm off-white / washi paper tone `#FAF6F1`
- Primary accent: dusty sakura pink `#E8A6B8` (used sparingly — buttons, progress fill, active states)
- Secondary accent: deep matcha green `#5B7F6B` (success states, completed checkmarks)
- Ink: soft charcoal `#33312E` (body text, not pure black)
- Gold accent: muted gold `#C9A86A` (for milestones, badges, day 30/60/90 markers)

**Typography:**
- Display/headers: a refined serif with slight calligraphic feel for "Sakura English Journey" title and day numbers (e.g. font pairing like "Fraunces" or "Cormorant" for display)
- Body: a clean, highly readable sans (e.g. "Inter" or "Noto Sans") — important since she's reading instructional text in a non-native language, legibility beats personality here
- Use a vertical accent line or small sakura-petal motif (subtle SVG, not animated GIFs) near day headers, not on every element

**Layout:**
- Mobile-first (she'll mostly use this on her phone) — single column, generous tap targets, sticky bottom nav with Home / Today / Progress / Vocabulary icons
- Day page sections separated by thin hairline rules, not heavy card borders — keep it feeling like pages in a journal, not a SaaS dashboard
- Progress bar: thin, fills with the pink accent, small animated petal icon at the fill-edge (subtle, one-time per load, not looping)

**Signature element:** the weekly calendar strip on `/home` — instead of generic numbered circles, render each day as a small petal/leaf shape that fills in (color transitions from outline to filled sakura-pink) as she completes it. This ties the "journey" metaphor (sakura blooming over the 90 days) directly into the one UI element she'll see every single day.

**Motion:** keep minimal — progress bar fill on page load, checkbox tap micro-bounce, day-complete petal-bloom moment (small, tasteful, once). No scroll-jacking, no heavy parallax — she's here to study, not be wowed.

---

## 9. Open Items / Things the Builder Should Verify or Decide

1. **Vocab.json generation** — generate the full 300-word list as its own sub-task before seeding (see 7.5 note).
2. **YouTube IDs for grammar lesson videos** — not pre-filled in this plan; the coding agent or Vaibhav should search for one short (5-10 min) grammar-explainer video per topic (channels like BBC Learning English, Crown Academy English, Learn English with Emma work well) and paste IDs into the `grammar_youtube_id` field via the seed JSON or teacher dashboard. This was left open deliberately rather than guessing 90 video IDs that risk being wrong or taken down.
3. **Anime episode-specific YouTube IDs** — per section 7.2's implementation note, default to directing her to the Muse Asia channel/playlist and let the teacher dashboard's per-day video ID field get filled in incrementally as Vaibhav confirms exact episode links. Don't hardcode guessed IDs.
4. **CaseOh compilations beyond May 2026** — by the time this is built, newer "Best of CaseOh [Month] 2026" videos will likely exist on his channel; worth a quick refresh search to swap in the most recent ones for the later days in the 90-day cycle, since repetition across the full 90 days is otherwise heavier on early-2026 content.
5. **Spotify embeds requiring Premium** — the embed player works for anyone but full playback may be limited to 30-second previews for non-Premium Spotify accounts. If she doesn't have Spotify Premium, consider also linking the YouTube version of each song as a fallback (search "{song title} {artist} official audio" — not pre-filled here for the same reason as grammar videos).
6. **Voice messages** — per the plan, these are sent to Vaibhav directly (WhatsApp/Discord/wherever), not uploaded to the site. If full in-site recording/upload is wanted later, Supabase Storage can be added — flagged as a v2 feature, not required for launch.

---

## 10. Build Order (recommended sequence for the coding agent)

1. Scaffold Next.js + Tailwind + shadcn project, push empty repo to GitHub
2. Set up Supabase project, run schema SQL, enable Google OAuth
3. Build auth flow: `/` login page, session handling, profile auto-creation on first login
4. Build `data/curriculum.json` and `data/vocab.json` (generate the latter per section 7.5), write and run the seed script
5. Build `/home` dashboard (static data first, wire to Supabase after layout is solid)
6. Build `/day/[n]` page — this is the core of the app, get one day pixel-perfect before generalizing to all 90
7. Build `/vocabulary`, `/grammar`, `/progress`, `/mistakes` pages
8. Build `/teacher` dashboard + middleware gating
9. Wire up real-time progress writes (debounced autosave for diary text, instant for checkboxes)
10. Mobile responsiveness pass + design polish pass (section 8)
11. Deploy to Vercel, connect custom domain if desired, final QA pass logged in as both roles
