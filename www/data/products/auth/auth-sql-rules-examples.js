export default [
  {
    lang: 'sql',
    title: 'Allow read access',
    detail_title: 'Public profiles are viewable by everyone',
    detail_text: 'Create a policy that allows public access to a table',
    badges_label: '',
    badges: [],
    url: '/docs/guides/auth#allow-read-access',
    code: `
-- 1. Create table
create table profiles (
  id serial primary key,
  name text
);

-- 2. Enable RLS
alter table profiles enable row level security;

-- 3. Create Policy
create policy "Public profiles are viewable by everyone." 
on profiles for select 
using ( true );
`.trim(),
  },
  {
    lang: 'sql',
    title: 'Restrict updates',
    detail_title: 'Users can update their own profiles',
    detail_text:
      'Create a policy that only allows a user to update rows that match their unique ID',
    badges_label: '',
    badges: [],
    url: '/docs/guides/auth#restrict-updates',
    code: `
-- 1. Create table
create table profiles (
  id serial primary key,
  name text
);

-- 2. Enable RLS
alter table profiles enable row level security;

-- 3. Create Policy
create policy "Users can update their own profiles." 
on profiles for update 
using ( auth.uid() = id );
`.trim(),
  },
  {
    lang: 'sql',
    title: 'Advanced rules',
    detail_title: 'Team members can update team details',
    detail_text:
      'Create a policy that allows for team members to update only rows which match their team ID.',
    badges_label: '',
    badges: [],
    url: '/docs/guides/auth#policies-with-joins',
    code: `
create table teams (
  id serial primary key,
  name text
);

create table members (
  team_id references team.id,
  user_id referenced auth.users.id
);

alter table teams enable row level security;

-- Create Advanced Policies
create policy "Team members can update team details"
on teams
for update using (
  auth.uid() in ( 
    select user_id from members 
    where team_id = id 
  )
);
`.trim(),
  },
]
