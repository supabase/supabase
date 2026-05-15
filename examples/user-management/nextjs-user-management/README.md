# Supabase Next.js Auth & User Management Starter

This example sets you up for a very common situation: users can sign up or sign in and then update their account with public profile information, including a profile image.

This demonstrates how to use:

- User signups using Supabase [Auth](https://supabase.com/auth).
  - Supabase [SSR Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) with the Next.js App Router and Server Actions.
- User avatar images using Supabase [Storage](https://supabase.com/storage).
- Public profiles restricted with [Row Level Security policies](https://supabase.com/docs/guides/auth/row-level-security).
- Frontend using [Next.js](https://nextjs.org/) (App Router) with React 19 and Tailwind CSS v4.

## Technologies used

- Frontend:
  - [Next.js](https://github.com/vercel/next.js) (App Router) — a React framework for production.
  - [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side/nextjs) for cookie-based SSR auth, used from both Server Components and Server Actions.
  - [`@supabase/supabase-js`](https://supabase.com/docs/library/getting-started) for the browser client and realtime data.
  - [Tailwind CSS v4](https://tailwindcss.com/) for styling.
- Backend:
  - [supabase.com/dashboard](https://supabase.com/dashboard/) — hosted Postgres database with a REST API, Auth, and Storage.
  - Local development via the [Supabase CLI](https://supabase.com/docs/guides/cli).

## Project structure

- `app/login/` — login and signup form. The form posts to Server Actions in `app/login/actions.ts` that call `supabase.auth.signInWithPassword()` and `supabase.auth.signUp()`.
- `app/account/` — protected profile page. Uses a Supabase server client to check the session and renders an account form with avatar upload.
- `app/auth/confirm/route.ts` — handles the email confirmation callback by verifying the OTP token and redirecting.
- `app/auth/signout/route.ts` — server route that signs the user out.
- `lib/supabase/client.ts` — browser client (`createBrowserClient`).
- `lib/supabase/server.ts` — server client (`createServerClient`) wired up to Next.js cookies.
- `supabase/migrations/` — database schema for the `profiles` table, RLS policies, the `handle_new_user` trigger, and the `avatars` storage bucket.
- `supabase/config.toml` — local Supabase configuration used by `npx supabase start`.

## Instant deploy

The Vercel deployment will guide you through creating a Supabase account and project. After installation of the Supabase integration, all relevant environment variables will be set up so that the project is usable immediately after deployment 🚀.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Fuser-management%2Fnextjs-user-management&project-name=supabase-nextjs-user-management&repository-name=supabase-nextjs-user-management&integration-ids=oac_VqOgBHqhEoFTPzGkPd7L0iH6&external-id=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Fuser-management%2Fnextjs-user-management)

## Run locally

### 1. Install dependencies

Requires Node.js 20+ and `npx` (bundled with npm).

```bash
npm install
```

### 2. Start a local Supabase stack

The example includes a `supabase/` directory with the schema and config needed to run a local stack via the Supabase CLI.

```bash
npx supabase start
```

This boots Postgres, Auth, Storage, and Supabase Studio locally and runs the migrations in `supabase/migrations/`. When it finishes, it prints your local API URL and keys.

### 3. Configure environment variables

Copy the development env template:

```bash
cp .env.example .env.local
```

The defaults in `.env.example` already match the local stack (API URL `http://127.0.0.1:54321` and the demo publishable key). Update them if your local ports differ.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Using a remote Supabase project

### 1. Create a project

Sign up at [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a new project. Wait for your database to start.

### 2. Get the URL and publishable key

Go to the Project Settings (the cog icon), open the API tab, and find your **Project URL** and **publishable key**.

The `publishable` key is your client-side API key. It allows "anonymous access" to your database until the user logs in. Once they log in, the user's own JWT is used, which enables Row Level Security to scope data per user. Read more [below](#postgres-row-level-security).

> **Note:** The `secret` (service role) key has full access to your data and bypasses all security policies. Keep it in server environments only — never expose it to the client or browser.

### 3. Link and push the schema

Copy the production env template and fill it in with your project URL, publishable key, and the URL(s) you want to allow as redirect targets:

```bash
cp .env.production.example .env.production
```

Link your local checkout to the remote project:

```bash
SUPABASE_ENV=production npx supabase@latest link --project-ref <your-project-ref>
```

Push the `supabase/config.toml` settings (Auth site URL, redirect URLs, etc.):

```bash
SUPABASE_ENV=production npx supabase@latest config push
```

Push the database schema in `supabase/migrations/`:

```bash
SUPABASE_ENV=production npx supabase@latest db push
```

## Vercel Preview with Branching

Supabase integrates seamlessly with Vercel's preview branches, giving each branch a dedicated Supabase project. This setup allows testing database migrations or service configurations safely before applying them to production.

### Steps

1. Ensure the Vercel project is linked to a Git repository.
2. Configure the "Preview" environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

3. Create a new branch, make changes (e.g., update `max_frequency`), and push the branch to Git.
   - Open a pull request to trigger the Vercel + Supabase integration.
   - Upon successful deployment, the preview environment reflects the changes.

![Preview Checks](https://github.com/user-attachments/assets/db688cc2-60fd-4463-bbed-e8ecc11b1a39)

## Postgres Row Level Security

This project uses high-level authorization via Postgres' Row Level Security.
When you start a Postgres database on Supabase, we populate it with an `auth` schema and some helper functions.
When a user logs in, they are issued a JWT with the role `authenticated` and their UUID.
We can use these details to provide fine-grained control over what each user can and cannot do.

The schema and policies that this example uses (see `supabase/migrations/20221017024722_init.sql`):

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

-- Set up Storage!
insert into storage.buckets (id, name)
  values ('avatars', 'avatars');

-- Set up access controls for storage.
-- See https://supabase.com/docs/guides/storage#policy-examples for more details.
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'avatars');

create policy "Anyone can update their own avatar." on storage.objects
  for update using ( auth.uid() = owner ) with check (bucket_id = 'avatars');
```

## More Supabase examples & resources

### Examples

These official examples are maintained by the Supabase team:

- [Next.js Subscription Payments Starter](https://github.com/vercel/nextjs-subscription-payments)
- [Next.js Slack Clone](https://github.com/supabase/supabase/tree/master/examples/slack-clone/nextjs-slack-clone)
- [Next.js Data Fetching](https://github.com/supabase/supabase/tree/master/examples/caching/with-nextjs-13)
- [And more...](https://github.com/supabase/supabase/tree/master/examples)

### Other resources

- [[Docs] Next.js User Management Quickstart](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [[Docs] Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [[Blog] Fetching and caching Supabase data in Next.js 13 Server Components](https://supabase.com/blog/fetching-and-caching-supabase-data-in-next-js-server-components)

## Authors

- [Supabase](https://supabase.com)

Supabase is open source. We'd love for you to follow along and get involved at https://github.com/supabase/supabase
