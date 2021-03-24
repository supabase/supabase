export default [
  {
    lang: 'sql',
    title: 'Allow anyone to view',
    detail_title: 'Spatial and Geographic objects for PostgreSQL',
    detail_text:
      'PostGIS is a spatial database extender for PostgreSQL object-relational database. It adds support for geographic objects allowing location queries to be run in SQL.',
    badges_label: 'Extensions used:',
    badges: ['PostGIS'],
    url: '',
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
    title: 'Users can only update their own profiles',
    detail_title: 'Spatial and Geographic objects for PostgreSQL',
    detail_text:
      'PostGIS is a spatial database extender for PostgreSQL object-relational database. It adds support for geographic objects allowing location queries to be run in SQL.',
    badges_label: 'Extensions used:',
    badges: ['PostGIS'],
    url: '',
    code: `create table profiles (
  id serial primary key,
  username text unique,
  avatar_url 
);

alter table profiles 
  enable row level security;

create policy "Users can update their own profiles." 
  on profiles for update using (
    auth.uid() = id
  );`,
  },
  {
    lang: 'sql',
    title: 'Detailed joins',
    detail_title:
      'Advance joins with many to many tables Allow any team member to update the team name',
    detail_text:
      'PostGIS is a spatial database extender for PostgreSQL object-relational database. It adds support for geographic objects allowing location queries to be run in SQL.',
    badges_label: 'Extensions used:',
    badges: ['PostGIS'],
    url: '',
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
