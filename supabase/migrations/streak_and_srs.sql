-- 1. Create Streak Data Table
create table if not exists streak_data (
  user_id uuid primary key references profiles(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  freezes_available int not null default 0,
  last_completed_date date,
  created_at timestamptz not null default now()
);

-- Enable RLS for streak_data
alter table streak_data enable row level security;

-- Policies for streak_data
create policy "own streak data select" on streak_data for select using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');
create policy "own streak data insert" on streak_data for insert with check (auth.uid() = user_id);
create policy "own streak data update" on streak_data for update using (auth.uid() = user_id or auth.jwt() ->> 'email' = 'brovaibhavkr2008@gmail.com');

-- 2. Add Spaced Repetition (SRS) columns to user_vocab_progress if they don't exist
alter table user_vocab_progress 
add column if not exists due_date date,
add column if not exists review_count int default 0,
add column if not exists ease_factor float default 2.5,
add column if not exists interval int default 1;
