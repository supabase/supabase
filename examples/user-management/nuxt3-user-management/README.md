# Supabase Nuxt User Management

This repo is a quick sample of how you can get started building apps using Nuxt 3 and Supabase. You can find a step by step guide of how to build out this app in the [Quickstart: Nuxt guide](https://supabase.io/docs/guides/with-nuxt-3).

This repo will demonstrate how to:

- sign users in with Supabase Auth using [magic link](https://supabase.io/docs/reference/dart/auth-signin#sign-in-with-magic-link)
- store and retrieve data with [Supabase database](https://supabase.io/docs/guides/database)
- store image files in [Supabase storage](https://supabase.io/docs/guides/storage)


## Technologies used

- Frontend:
  - [Nuxt.js 3](https://github.com/nuxt/nuxt) - The Intuitive Vue Framework.
  - [Supabase.js](https://supabase.com/docs/library/getting-started) for user management and realtime data syncing.
  - Supabase [Supabase module for Nuxt.](https://github.com/nuxt-modules/supabase).
- Backend:
  - [supabase.com/dashboard](https://supabase.com/dashboard/): hosted Postgres database with restful API for usage with Supabase.js.


## Getting Started

Iniate a new project in Nuxt 3 with `npx nuxi@latest init <project-name>`.

### 4. Env vars

Rename the `.env-example` to `.env.` and paste your secret keys. In this example they have already been set in the `nuxt.cofig`. More information about getting your keys is [here](https://supabase.io/docs/guides/with-nuxt-3#get-the-api-keys).

```
SUPABASE_URL=
SUPABASE_KEY=
```

### 5. Run the application

Run the application: `npm run dev` or `yarn dev`. Open your browser to `http://localhost:3000/` and you are ready to go 🚀.

## Supabase details
### Database Schema

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
  with check ( (select auth.uid()) = id );

create policy "Users can update own profile."
  on profiles for update
  using ( (select auth.uid()) = id );

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

### Postgres Row level security

This project uses very high-level Authorization using Postgres' Role Level Security.
When you start a Postgres database on Supabase, we populate it with an `auth` schema, and some helper functions.
When a user logs in, they are issued a JWT with the role `authenticated` and their UUID.
We can use these details to provide fine-grained control over what each user can and cannot do.

This is a trimmed-down schema, with the policies:

```sql
-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  website text,

  constraint username_length check (char_length(username) >= 3)
);
-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
## More Supabase Examples & Resources

### Examples

These official examples are maintained by the Supabase team:

- [Nuxt.js User Management in Details](https://supabase.com/docs/guides/getting-started/tutorials/with-nuxt-3)

## Other resources

- [[Docs] Nuxt.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nuxtjs)
- [[Docs] General Supabase Getting Started](https://supabase.com/docs/guides/getting-started)