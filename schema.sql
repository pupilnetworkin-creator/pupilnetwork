-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  avatar_url text,
  points integer default 0,
  is_premium boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Note: In a real app, you should set up RLS policies to control access.
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- 2. Friends Table
create table public.friends (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, friend_id)
);

alter table public.friends enable row level security;
create policy "Users can view their friends." on friends for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "Users can add friends." on friends for insert with check (auth.uid() = user_id);

-- 3. Rooms Table
create table public.rooms (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  is_private boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.rooms enable row level security;
create policy "Rooms are viewable by everyone." on rooms for select using (true);
create policy "Authenticated users can create rooms." on rooms for insert with check (auth.uid() = created_by);

-- 4. Messages Table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;
create policy "Messages are viewable by everyone." on messages for select using (true);
create policy "Authenticated users can insert messages." on messages for insert with check (auth.uid() = user_id);

-- 5. Questions Table
create table public.questions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  tags text[] default '{}',
  points integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.questions enable row level security;
create policy "Questions are viewable by everyone." on questions for select using (true);
create policy "Authenticated users can create questions." on questions for insert with check (auth.uid() = user_id);

-- 6. Answers Table
create table public.answers (
  id uuid default uuid_generate_v4() primary key,
  question_id uuid references public.questions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  upvotes integer default 0,
  is_best boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.answers enable row level security;
create policy "Answers are viewable by everyone." on answers for select using (true);
create policy "Authenticated users can insert answers." on answers for insert with check (auth.uid() = user_id);

-- 7. Points History Table
create table public.points_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  points integer not null,
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.points_history enable row level security;
create policy "Points history is viewable by owner." on points_history for select using (auth.uid() = user_id);
create policy "Authenticated users can't directly insert points in production (needs trigger/RPC)." on points_history for insert with check (auth.uid() = user_id);

-- Trigger to create a profile automatically when a new user signs up via auth
-- Handles username collisions by appending partial UUID if needed
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_username text;
begin
  new_username := split_part(new.email, '@', 1);
  
  -- Check if username exists, if so append short UUID
  if exists (select 1 from public.profiles where username = new_username) then
    new_username := new_username || '_' || substr(new.id::text, 1, 4);
  end if;

  insert into public.profiles (id, username, avatar_url)
  values (new.id, new_username, 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable replication for realtime
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.messages;

-- 8. Room Members Table
create table public.room_members (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(room_id, user_id)
);

alter table public.room_members enable row level security;
create policy "Room members are viewable by everyone." on room_members for select using (true);
create policy "Users can join rooms." on room_members for insert with check (auth.uid() = user_id);
create policy "Users can leave rooms." on room_members for delete using (auth.uid() = user_id);

alter publication supabase_realtime add table public.room_members;

-- 9. Direct Messages Table
create table public.direct_messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.direct_messages enable row level security;
create policy "Users can view their own DMs." on direct_messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send DMs to friends." on direct_messages for insert with check (auth.uid() = sender_id);

alter publication supabase_realtime add table public.direct_messages;

-- 10. Friend Requests Table
create table public.friend_requests (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(sender_id, receiver_id)
);

alter table public.friend_requests enable row level security;
create policy "Users can view their own requests." on friend_requests for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send requests." on friend_requests for insert with check (auth.uid() = sender_id);
create policy "Users can update their own received requests." on friend_requests for update using (auth.uid() = receiver_id);

alter publication supabase_realtime add table public.friend_requests;
