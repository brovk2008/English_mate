-- Word library
create table if not exists word_library (
  id serial primary key,
  word text not null unique,
  pronunciation text,
  part_of_speech text,
  meaning text not null,
  meaning_ja text,
  example_sentence text not null,
  difficulty_level text check (difficulty_level in ('A1','A2','B1','B2','C1')),
  category text,
  created_at timestamptz default now()
);

-- Library learning progress
create table if not exists library_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  word_id int not null references word_library(id) on delete cascade,
  status text not null default 'seen' check (status in ('seen','learning','mastered')),
  due_date date,
  review_count int default 0,
  ease_factor float default 2.5,
  first_seen_at timestamptz default now(),
  last_reviewed_at timestamptz,
  primary key (user_id, word_id)
);

-- Homework system
create table if not exists homework (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null,
  due_date date,
  day_number int,
  created_at timestamptz default now()
);

create table if not exists homework_items (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references homework(id) on delete cascade,
  item_text text not null,
  item_order int not null default 0,
  item_type text not null default 'checkbox'
    check (item_type in ('checkbox','text_response','audio','reading','vocabulary'))
);

create table if not exists homework_completion (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references homework(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  item_id uuid references homework_items(id) on delete cascade,
  completed boolean default false,
  response_text text,
  completed_at timestamptz,
  unique (homework_id, user_id, item_id)
);

create table if not exists homework_assignments (
  homework_id uuid not null references homework(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  assigned_at timestamptz default now(),
  primary key (homework_id, user_id)
);

-- RLS
alter table word_library enable row level security;
alter table library_progress enable row level security;
alter table homework enable row level security;
alter table homework_items enable row level security;
alter table homework_completion enable row level security;
alter table homework_assignments enable row level security;

-- Policies
create policy "public read word_library" on word_library for select using (true);
create policy "own library progress" on library_progress for all using (auth.uid() = user_id);
create policy "read assigned homework" on homework for select
  using (id in (select homework_id from homework_assignments where user_id = auth.uid())
    or created_by = auth.uid());
create policy "read homework items" on homework_items for select using (true);
create policy "own completion" on homework_completion for all using (auth.uid() = user_id);
create policy "read own assignments" on homework_assignments for select using (auth.uid() = user_id);
