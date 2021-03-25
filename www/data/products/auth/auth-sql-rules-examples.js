export default [
  {
    lang: 'sql',
    title: 'Allow read access',
    detail_title: 'Public profiles are viewable by everyone',
    detail_text: 'Create a policy that allows public access to a table',
    badges_label: '',
    badges: [],
    url: 'https://supabase.io/docs/guides/auth#allow-read-access',
    code: `create table profiles (
  id serial primary key,
  username text unique,
  avatar_url 
);

alter table profiles 
  enable row level security;

create policy "Public profiles are viewable by everyone." 
  on profiles for select using (
    true
  );`,
  },
  {
    lang: 'sql',
    title: 'Restrict updates',
    detail_title: 'Users can update their own profiles',
    detail_text:
      'Create a policy that only allows a user to update rows that match their unique ID',
    badges_label: '',
    badges: [],
    url: 'https://supabase.io/docs/guides/auth#restrict-updates',
    code: `-- 1. Create table
    create table profiles (
      id uuid references auth.users,
      avatar_url text
    );
    
    -- 2. Enable RLS
    alter table profiles 
      enable row level security;
    
    -- 3. Create Policy
    create policy "Users can update their own profiles." 
      on profiles for update using (
        auth.uid() = id
      );`,
  },
  {
    lang: 'sql',
    title: 'Policies with joins',
    detail_title: 'Team members can update team details',
    detail_text:
      'Create a policy that allows for team members to update only rows which match their team ID.',
    badges_label: '',
    badges: [],
    url: 'https://supabase.io/docs/guides/auth#policies-with-joins',
    code: `create table teams (
  id serial primary key,
  name
);
-- Many to many joins
create table members (
  team_id references team.id,
  user_id referenced auth.users.id
);

alter table teams 
  enable row level security;

create policy "Team members can update team details"
  on teams
  for update using (
    auth.uid() in ( 
      select user_id 
      from memebers 
      where team_id = id 
    )
  );`,
  },
]
