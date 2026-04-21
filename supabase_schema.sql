-- ENABLE REALTIME
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  username text unique not null,
  display_name text not null,
  avatar_color text default '#6366f1',
  bio text,
  points integer default 0,
  is_premium boolean default false,
  premium_expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AI USAGE TRACKING (for non-premium)
create table public.ai_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  count integer default 0,
  window_start timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- AI RESPONSE CACHE
create table public.ai_cache (
  prompt_hash text primary key,
  response text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PREMIUM CODES
create table public.premium_codes (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  status text not null default 'active', -- active, used, revoked
  utr_number text not null unique,
  email text not null,
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROOMS
create table public.rooms (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  subject text not null,
  description text,
  is_active boolean default true,
  member_count integer default 1,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MESSAGES (Chat)
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.rooms;

-- QA POSTS
create table public.qa_posts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  subject text not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  upvotes integer default 0,
  answer_count integer default 0,
  is_solved boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ANSWERS
create table public.answers (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.qa_posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  upvotes integer default 0,
  is_accepted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ADD RPC FUNCTIONS (Stored Procedures)
-- Increment Answer Upvotes
create or replace function increment_answer_upvotes(answer_id uuid)
returns void as $$
begin
  update public.answers
  set upvotes = upvotes + 1
  where id = answer_id;
end;
$$ language plpgsql;

-- Increment Post Upvotes
create or replace function increment_post_upvotes(post_id uuid)
returns void as $$
begin
  update public.qa_posts
  set upvotes = upvotes + 1
  where id = post_id;
end;
$$ language plpgsql;

-- Increment User Points
create or replace function increment_user_points(user_id uuid, amount integer)
returns void as $$
begin
  update public.profiles
  set points = points + amount
  where id = user_id;
end;
$$ language plpgsql;

-- Increment Answer Count
create or replace function increment_answer_count(post_id uuid)
returns void as $$
begin
  update public.qa_posts
  set answer_count = answer_count + 1
  where id = post_id;
end;
$$ language plpgsql;

-- Increment Room Members
create or replace function increment_room_members(row_id uuid)
returns void as $$
begin
  update public.rooms
  set member_count = member_count + 1
  where id = row_id;
end;
$$ language plpgsql;

-- TRIGGERS (Auto-create profile on auth signup)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, username)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1) || floor(random() * 1000)::text)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- TURN OFF RLS FOR SPEED/EASE in this iteration (zero cost setup)
-- Warning: In a real production environment, you should implement strict Row Level Security
alter table public.profiles disable row level security;
alter table public.ai_usage disable row level security;
alter table public.premium_codes disable row level security;
alter table public.rooms disable row level security;
alter table public.messages disable row level security;
alter table public.qa_posts disable row level security;
alter table public.answers disable row level security;
