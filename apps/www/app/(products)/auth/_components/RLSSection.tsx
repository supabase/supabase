import { createHighlighter, type ThemeRegistration } from 'shiki'
import { RLSSectionClient } from './RLSSectionClient'

const supabaseDark: ThemeRegistration = {
  name: 'supabase-dark',
  type: 'dark',
  colors: {
    'editor.background': '#00000000',
    'editor.foreground': '#ffffff',
  },
  tokenColors: [
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: '#bda4ff' } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: '#3ecf8e' } },
    { scope: ['constant', 'variable.other.constant', 'support.constant'], settings: { foreground: '#3ecf8e' } },
    { scope: ['string', 'string.quoted'], settings: { foreground: '#ffcda1' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7e7e7e' } },
    { scope: ['punctuation'], settings: { foreground: '#ffffff' } },
    { scope: ['constant.numeric'], settings: { foreground: '#ededed' } },
  ],
}

const supabaseLight: ThemeRegistration = {
  name: 'supabase-light',
  type: 'light',
  colors: {
    'editor.background': '#00000000',
    'editor.foreground': '#525252',
  },
  tokenColors: [
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'], settings: { foreground: '#6b35dc' } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: '#15593b' } },
    { scope: ['constant', 'variable.other.constant', 'support.constant'], settings: { foreground: '#15593b' } },
    { scope: ['string', 'string.quoted'], settings: { foreground: '#f1a10d' } },
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#7e7e7e' } },
    { scope: ['punctuation'], settings: { foreground: '#a0a0a0' } },
    { scope: ['constant.numeric'], settings: { foreground: '#525252' } },
  ],
}

const RLS_EXAMPLES = [
  {
    title: 'Allow read access',
    description: 'Public profiles are viewable by everyone.',
    code: `-- 1. Create table
create table profiles (
  id serial primary key,
  name text
);

-- 2. Enable RLS
alter table profiles enable row level security;

-- 3. Create Policy
create policy "Public profiles are viewable by everyone."
on profiles for select
using ( true );`,
  },
  {
    title: 'Restrict updates',
    description: 'Users can only update their own rows.',
    code: `-- 1. Create table
create table profiles (
  id serial primary key,
  name text
);

-- 2. Enable RLS
alter table profiles enable row level security;

-- 3. Create Policy
create policy "Users can update their own profiles."
on profiles for update
using ( (select auth.uid()) = id );`,
  },
  {
    title: 'Advanced rules',
    description: 'Team members can update team details using joins.',
    code: `create table teams (
  id bigint primary key generated always as identity,
  name text
);

create table members (
  team_id bigint references teams,
  user_id uuid references auth.users
);

alter table teams enable row level security;

create policy "Team members can update team details if they belong to the team"
  on teams
  for update using (
    (select auth.uid()) in (
      select user_id from members
      where team_id = id
    )
  );`,
  },
]

export async function RLSSection() {
  const hl = await createHighlighter({
    themes: [supabaseDark, supabaseLight],
    langs: ['sql'],
  })

  const examples = RLS_EXAMPLES.map((example) => ({
    title: example.title,
    description: example.description,
    darkHtml: hl.codeToHtml(example.code, { lang: 'sql', theme: 'supabase-dark' }),
    lightHtml: hl.codeToHtml(example.code, { lang: 'sql', theme: 'supabase-light' }),
  }))

  hl.dispose()

  return <RLSSectionClient examples={examples} />
}
