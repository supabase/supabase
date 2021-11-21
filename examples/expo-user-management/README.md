# Supabase Expo User Management

This repo is a quick sample of how you can get started building apps using Expo and Supabase. You can find a step by step guide of how to build out this app in the [Quickstart: React Native guide](https://supabase.io/docs/guides/with-expo).

This repo will demonstrate how to:

- sign users in with Supabase Auth using [magic link](https://supabase.com/docs/reference/javascript/auth-signin#sign-in-with-magic-link)
- store and retrieve data with [Supabase database](https://supabase.io/docs/guides/database)
- store image files in [Supabase storage](https://supabase.io/docs/guides/storage)
- generate TypeScript interfaces for your tables

## Getting Started

Before running this app, you need to create a Supabase project and copy [your credentials](https://supabase.io/docs/guides/with-react-native#get-the-api-keys) to `src/config.ts`.

You'll also need to update the types script in package.json with your Supabase URL and anon key to generate Typescript types for your database tables.

```
  "scripts": {
    ...
    "types": "npx openapi-typescript https:[YOUR_SUPABASE_URL]/rest/v1/?apikey=[YOUR_SUPABASE_ANON_KEY] --output src/types/supabase.ts"
  }
```

You can run this app on iOS, Android.

To run this application, simply run the following for iOS, Android or Web

```bash
npm install
npm run types
expo start
```

## Database Schema

```sql
-- Create a table for public "profiles"
create table profiles (
  id uuid references auth.users not null,
  updated_at timestamp with time zone,
  username text unique,
  avatar_url text,
  website text,

  primary key (id),
  unique(username),
  constraint username_length check (char_length(username) >= 3)
);

alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Set up Realtime!
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table profiles;

-- Set up Storage!
insert into storage.buckets (id, name)
values ('avatars', 'avatars');

create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );
```
