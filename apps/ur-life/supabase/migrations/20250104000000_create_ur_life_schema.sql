-- UR Life Database Schema Migration
-- This migration creates all necessary tables for the UR Life application

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ===================================================================
-- PROFILES TABLE
-- Stores extended user profile information
-- ===================================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  net_id text unique not null,
  name text not null,
  email text not null,
  major text not null,
  year text not null,
  avatar text default '🦊',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ===================================================================
-- TASKS TABLE
-- Stores user tasks and to-do items
-- ===================================================================
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  text text not null,
  completed boolean default false,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.tasks enable row level security;

-- Tasks policies
create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_date_idx on public.tasks (date);

-- ===================================================================
-- TASK_HISTORY TABLE
-- Stores completed task history
-- ===================================================================
create table public.task_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  text text not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  original_date date
);

-- Enable Row Level Security
alter table public.task_history enable row level security;

-- Task history policies
create policy "Users can view their own task history"
  on public.task_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own task history"
  on public.task_history for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own task history"
  on public.task_history for delete
  using (auth.uid() = user_id);

-- Create index
create index task_history_user_id_idx on public.task_history (user_id);

-- ===================================================================
-- CONTACTS TABLE
-- Stores mailing list contacts organized by category
-- ===================================================================
create table public.contacts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category text not null check (category in ('professors', 'tas', 'classmates', 'friends', 'clubs', 'research')),
  name text not null,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.contacts enable row level security;

-- Contacts policies
create policy "Users can view their own contacts"
  on public.contacts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own contacts"
  on public.contacts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own contacts"
  on public.contacts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own contacts"
  on public.contacts for delete
  using (auth.uid() = user_id);

-- Create index
create index contacts_user_id_idx on public.contacts (user_id);
create index contacts_category_idx on public.contacts (category);

-- ===================================================================
-- DEGREE_PROGRESS TABLE
-- Tracks degree requirement completion
-- ===================================================================
create table public.degree_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category text not null check (category in ('premajor', 'core', 'math', 'advanced', 'writing')),
  course_code text not null,
  course_name text not null,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, category, course_code)
);

-- Enable Row Level Security
alter table public.degree_progress enable row level security;

-- Degree progress policies
create policy "Users can view their own degree progress"
  on public.degree_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own degree progress"
  on public.degree_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own degree progress"
  on public.degree_progress for update
  using (auth.uid() = user_id);

create policy "Users can delete their own degree progress"
  on public.degree_progress for delete
  using (auth.uid() = user_id);

-- Create index
create index degree_progress_user_id_idx on public.degree_progress (user_id);
create index degree_progress_category_idx on public.degree_progress (category);

-- ===================================================================
-- COURSES TABLE
-- Stores weekly course schedule
-- ===================================================================
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  day text not null check (day in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')),
  start_time time not null,
  end_time time not null,
  course_name text not null,
  location text,
  color text default '#4a90e2',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.courses enable row level security;

-- Courses policies
create policy "Users can view their own courses"
  on public.courses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own courses"
  on public.courses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own courses"
  on public.courses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own courses"
  on public.courses for delete
  using (auth.uid() = user_id);

-- Create index
create index courses_user_id_idx on public.courses (user_id);
create index courses_day_idx on public.courses (day);

-- ===================================================================
-- FUNCTIONS
-- ===================================================================

-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.tasks
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.degree_progress
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.courses
  for each row
  execute function public.handle_updated_at();

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, net_id, name, email, major, year)
  values (
    new.id,
    new.raw_user_meta_data->>'net_id',
    new.raw_user_meta_data->>'name',
    new.email,
    coalesce(new.raw_user_meta_data->>'major', 'Undeclared'),
    coalesce(new.raw_user_meta_data->>'year', 'Freshman')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user registration
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ===================================================================
-- SEED DATA (Optional - for demo accounts)
-- ===================================================================

-- Note: Demo users should be created through Supabase Auth
-- This is just the profile data structure
