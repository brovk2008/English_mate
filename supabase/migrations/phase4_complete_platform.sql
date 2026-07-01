-- Placement test fields
alter table profiles 
  add column if not exists self_score int check (self_score between 1 and 10),
  add column if not exists daily_minutes int default 90,
  add column if not exists cefr_level text default 'A2' 
    check (cefr_level in ('A1','A2','B1','B1+','B2','C1')),
  add column if not exists placement_done boolean default false;

-- Listening comprehension tracking
alter table user_day_progress 
  add column if not exists comprehension_pct int check (comprehension_pct between 0 and 100),
  add column if not exists song_favorited boolean default false;

-- Mistake categorization
alter table mistake_log add column if not exists category text;

-- New curriculum fields
alter table days 
  add column if not exists listening_challenge jsonb,
  add column if not exists grammar_visual text;

-- Word lookup log
create table if not exists word_lookups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  word text not null,
  looked_up_at timestamptz not null default now(),
  context_page text
);

-- Speaking log
create table if not exists speaking_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  prompt_id text not null,
  day_number int,
  completed_at timestamptz default now()
);

-- Notes
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  day_number int,
  page_context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table word_lookups enable row level security;
alter table speaking_log enable row level security;
alter table notes enable row level security;

-- Drop existing policies if they exist, then recreate
drop policy if exists "own lookups" on word_lookups;
create policy "own lookups" on word_lookups for all using (auth.uid() = user_id);

drop policy if exists "own speaking" on speaking_log;
create policy "own speaking" on speaking_log for all using (auth.uid() = user_id);

drop policy if exists "own notes" on notes;
create policy "own notes" on notes for all using (auth.uid() = user_id);
