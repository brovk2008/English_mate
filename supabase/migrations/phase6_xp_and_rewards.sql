-- XP system
create table if not exists xp_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount int not null,
  source text not null,
  day_number int,
  earned_at timestamptz not null default now()
);

alter table profiles
  add column if not exists total_xp int not null default 0,
  add column if not exists level int not null default 1,
  add column if not exists level_title text not null default 'Seedling',
  add column if not exists pending_levelup boolean default false,
  add column if not exists pending_levelup_to int,
  add column if not exists sounds_enabled boolean default true;

-- Daily rewards
create table if not exists daily_rewards (
  user_id uuid not null references profiles(id) on delete cascade,
  reward_date date not null,
  reward_type text not null,
  reward_value int default 0,
  claimed boolean not null default false,
  claimed_at timestamptz,
  primary key (user_id, reward_date)
);

-- Game scores
create table if not exists game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  game_id text not null check (game_id in ('word_blitz','sakura_match','scramble_sprint')),
  score int not null,
  metadata jsonb,
  xp_earned int not null default 0,
  played_at timestamptz not null default now()
);

-- RLS
alter table xp_log enable row level security;
alter table daily_rewards enable row level security;
alter table game_scores enable row level security;

-- Avoid policy creation crash if they exist by dropping first or using safety check
drop policy if exists "own xp" on xp_log;
create policy "own xp" on xp_log for all using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');

drop policy if exists "own rewards" on daily_rewards;
create policy "own rewards" on daily_rewards for all using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');

drop policy if exists "own scores" on game_scores;
create policy "own scores" on game_scores for all using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');
