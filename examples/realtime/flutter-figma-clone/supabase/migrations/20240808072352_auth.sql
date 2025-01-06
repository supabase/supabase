create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null

  -- username should be 3 to 24 characters long containing alphabets, numbers and underscores
  constraint username_validation check (username ~* '^[A-Za-z0-9_]{3,24}$')
);

-- Function to create a new row in profiles table upon signup
-- Also copies the username value from metadata
create or replace function handle_new_user() returns trigger as $$
    begin
        insert into public.profiles(id, username)
        values(new.id, new.raw_user_meta_data->>'username');

        return new;
    end;
$$ language plpgsql security definer;

-- Trigger to call `handle_new_user` when new user signs up
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function handle_new_user();

create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    name text not null default 'new project',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.project_members (
    profile_id uuid references public.profiles(id) on delete cascade not null,
    project_id uuid references public.projects(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc' :: text, now()) not null,
    primary key (profile_id, project_id)
);

alter table public.canvas_objects
add column project_id uuid references public.projects(id) on delete cascade not null;

-- Returns true if the signed in user is a member of the project
create or replace function is_project_member(project_id uuid)
returns boolean as $$
  select exists(
    select 1
    from project_members
    where project_id = is_project_member.project_id and profile_id = auth.uid()
  );
$$ language sql security definer;

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);

alter table public.projects enable row level security;
create policy "Users can view projects that they have joined" on public.projects for select using (is_project_member(id));

alter table public.project_members enable row level security;
create policy "Participants of the project can view other participants." on public.project_members for select using (is_project_member(project_id));
create policy "Participants of the project can insert new users." on public.project_members for insert with check (is_project_member(project_id));

alter table public.canvas_objects enable row level security;
create policy "Users can view canvas_objects of projects they are in." on public.canvas_objects for select using (is_project_member(project_id));
create policy "Users can insert canvas_objects of projects they are in." on public.canvas_objects for insert with check (is_project_member(project_id));
create policy "Users can update canvas_objects of projects they are in." on public.canvas_objects for update using (is_project_member(project_id)) with check (is_project_member(project_id));
create policy "Users can delete canvas_objects of projects they are in." on public.canvas_objects for delete using (is_project_member(project_id));

-- Creates a new project and inserts the caller as a participant
create or replace function create_new_project() returns uuid as $$
    declare
        new_project_id uuid;
    begin
        -- Create a new project
        insert into public.projects default values
        returning id into new_project_id;

        -- Insert the caller user into the new project
        insert into public.project_members (profile_id, project_id)
        values (auth.uid(), new_project_id);

        return new_project_id;
    end
$$ language plpgsql security definer;

create policy "Project members can receive presence and broadcast messages." on realtime.messages for select using (is_project_member(realtime.topic()::uuid));
create policy "Project members can send presence and broadcast messages." on realtime.messages for insert with check (is_project_member(realtime.topic()::uuid));
