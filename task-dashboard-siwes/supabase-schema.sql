-- Task Dashboard schema for Supabase

-- 1. PROFILES TABLE (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  email text unique,
  created_at timestamptz default now()
);

-- 2. TASKS TABLE
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  due_date timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  category text not null default 'General',
  status text not null default 'todo' check (status in ('todo', 'in-progress', 'done')),
  task_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  message text not null,
  type text not null default 'reminder' check (type in ('reminder', 'overdue', 'task_updated', 'task_completed')),
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 4. TASK REMINDERS TABLE
create table if not exists public.task_reminders (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  reminder_time timestamptz not null,
  reminder_type text default 'due_soon',
  sent_at timestamptz,
  status text default 'pending',
  created_at timestamptz default now()
);

-- INDEXES
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists task_reminders_user_id_idx on public.task_reminders(user_id);

-- TRIGGER FOR UPDATED_AT
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_tasks_updated_at on public.tasks;
create trigger update_tasks_updated_at
before update on public.tasks
for each row
execute function public.update_updated_at_column();

-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;
alter table public.task_reminders enable row level security;

-- Profiles Policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Tasks Policies
drop policy if exists "Users can view own tasks" on public.tasks;
create policy "Users can view own tasks" on public.tasks
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own tasks" on public.tasks;
create policy "Users can insert own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks" on public.tasks
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks" on public.tasks
  for delete using (auth.uid() = user_id);

-- Notifications Policies
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own notifications" on public.notifications;
create policy "Users can insert own notifications" on public.notifications
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications" on public.notifications
  for delete using (auth.uid() = user_id);

-- Task Reminders Policies
drop policy if exists "Users can view own reminders" on public.task_reminders;
create policy "Users can view own reminders" on public.task_reminders
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own reminders" on public.task_reminders;
create policy "Users can insert own reminders" on public.task_reminders
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own reminders" on public.task_reminders;
create policy "Users can update own reminders" on public.task_reminders
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own reminders" on public.task_reminders;
create policy "Users can delete own reminders" on public.task_reminders
  for delete using (auth.uid() = user_id);

-- 5. ENABLE SUPABASE REALTIME PUBLICATION FOR LIVE TAB SYNC
alter table public.tasks replica identity full;
alter table public.notifications replica identity full;

begin;
  alter publication supabase_realtime drop table if exists public.tasks;
  alter publication supabase_realtime drop table if exists public.notifications;
  alter publication supabase_realtime add table public.tasks;
  alter publication supabase_realtime add table public.notifications;
commit;
