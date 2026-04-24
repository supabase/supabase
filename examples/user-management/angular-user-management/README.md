# Supabase Angular User Management

This example demonstrates how to build a user management app with Angular and Supabase.

## Features

- Magic link authentication (passwordless)
- User profile management
- Avatar upload with Supabase Storage

## Getting Started

### 1. Create a Supabase project

Create a new project in the [Supabase Dashboard](https://supabase.com/dashboard).

### 2. Set up the database

Run the following SQL in your Supabase SQL Editor to create the `profiles` table:

```sql
-- Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

-- Set up Storage
insert into storage.buckets (id, name)
  values ('avatars', 'avatars');

-- Set up access controls for storage
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');
```

### 3. Configure environment variables

Update the `src/environments/environment.ts` file with your Supabase project URL and anon key:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY',
}
```

You can find these values in your Supabase project settings under API.

### 4. Install dependencies

```bash
npm install
```

### 5. Run the development server

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Learn More

- [Supabase Documentation](https://supabase.com/docs)
- [Angular Documentation](https://angular.io/docs)
- [Supabase Angular Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-angular)
