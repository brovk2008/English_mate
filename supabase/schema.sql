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
  vocab_sentences text,                -- JSON string of custom sentences for the daily 10 words
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

-- Profiles policies
create policy "own profile select" on profiles for select using (auth.uid() = id or auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');
create policy "own profile insert" on profiles for insert with check (auth.uid() = id);
create policy "own profile update" on profiles for update using (auth.uid() = id or auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');

-- user_day_progress policies
create policy "own progress read" on user_day_progress for select using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');
create policy "own progress write" on user_day_progress for insert with check (auth.uid() = user_id or auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');
create policy "own progress update" on user_day_progress for update using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');

-- user_vocab_progress policies
create policy "own vocab" on user_vocab_progress for all using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');

-- mistake_log policies
create policy "own mistakes read" on mistake_log for select using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');
create policy "teacher mistakes insert" on mistake_log for insert with check (auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');
create policy "teacher mistakes delete" on mistake_log for delete using (auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');

-- Days & Vocab public read
alter table days enable row level security;
alter table vocab_words enable row level security;
create policy "public read days" on days for select using (true);
create policy "public read vocab" on vocab_words for select using (true);

-- Announcements policies
alter table announcements enable row level security;
create policy "public read announcements" on announcements for select using (true);
create policy "teacher announcements insert" on announcements for insert with check (auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');
create policy "teacher announcements delete" on announcements for delete using (auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');
