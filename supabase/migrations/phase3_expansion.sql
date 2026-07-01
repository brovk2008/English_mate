-- Language preference on profile
alter table profiles add column if not exists lang text not null default 'en' check (lang in ('en','ja'));
alter table profiles add column if not exists reminder_time text default '20:00';
alter table profiles add column if not exists onboarded boolean default false;

-- Japanese meanings on vocab words
alter table vocab_words add column if not exists meaning_ja text;

-- Reading content progress
create table if not exists reading_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  passage_id text not null,
  score int,
  completed_at timestamptz default now(),
  primary key (user_id, passage_id)
);

-- Quiz results
create table if not exists quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  day_number int,
  score int not null,
  total int not null default 10,
  wrong_words int[] default '{}',
  taken_at timestamptz not null default now()
);

-- Conversation scripts progress
create table if not exists conversation_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  conversation_id text not null,
  completed_at timestamptz default now(),
  primary key (user_id, conversation_id)
);

-- Sentence builder results
create table if not exists sentence_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  day_number int references days(day_number),
  mode text check (mode in ('fill','arrange')),
  correct boolean not null,
  attempts int not null default 1,
  completed_at timestamptz default now()
);

-- Achievements
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

-- Curriculum additions
alter table days add column if not exists sentence_challenge jsonb;
alter table days add column if not exists bonus_challenge jsonb;

-- RLS on new tables (students see own rows only)
alter table reading_progress enable row level security;
alter table quiz_results enable row level security;
alter table conversation_progress enable row level security;
alter table sentence_results enable row level security;
alter table achievements enable row level security;

-- Drop policy if exists to make it idempotent
drop policy if exists "own reading" on reading_progress;
drop policy if exists "own quiz" on quiz_results;
drop policy if exists "own conversation" on conversation_progress;
drop policy if exists "own sentences" on sentence_results;
drop policy if exists "own achievements" on achievements;

create policy "own reading" on reading_progress for all using (auth.uid() = user_id);
create policy "own quiz" on quiz_results for all using (auth.uid() = user_id);
create policy "own conversation" on conversation_progress for all using (auth.uid() = user_id);
create policy "own sentences" on sentence_results for all using (auth.uid() = user_id);
create policy "own achievements" on achievements for all using (auth.uid() = user_id);
