# Supabase Realtime Presence API Sample Program

This is an example program for Supabase Realtime Presence APIs.
User get authenticated using Supabase Auth API. Once Logged-in you can see which users are 'present' and viewing the page.

- Frontend:
  - Next.js.
  - [Supabase.js v2 (realtime presence support)](https://supabase.io/docs/library/getting-started)
- Backend:
  - [app.supabase.io](https://app.supabase.io/): hosted postgres database with realtime support.

## Real time Presence APIs used.

This program shows usage of channel presence API calls such as , channel.on('presence', ...), channel.subscribe function usage.

## Getting Started

### 1. Create new project

Sign up to Supabase - [https://app.supabase.io](https://app.supabase.io) and create a new project. Wait for your database to start.

### 2. Run "User Management Starter" Quickstart

This will create user tables and profile tables for user management.

### 3. Get the URL and Key

Go to the Project Settings (the cog icon), open the API tab, and find your API URL and `anon` key, you'll need these in the next step.

The `anon` key is your client-side API key. It allows "anonymous access" to your database, until the user has logged in. Once they have logged in, the keys will switch to the user's own login token.

![Supabase Anon Key](supabase_anon_key.jpg?raw=true 'Supabase Anon Key')

### 4. Pull this example git repository

`git clone <<this repository url>> `

### 5. Create a .env.local file

Create a .env.local file and add following environment variables.

```
NEXT_PUBLIC_SUPABASE_URL=<<insert-your-db-url-here>>

NEXT_PUBLIC_SUPABASE_ANON_KEY=<<insert-your-anon-key-here>>
```

### 5. Now run the development server!

Now run
First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How to Test?

When you visit http://localhost:3000, you will be redirected to auth login/signup screen.

Signup if you haven't and then login.

You will see your email listed on the page.

Open another browser window. And sign-in as another user.

As you login from other browser window, you will see list of current users updated.

## Deployment

Since this is next.js application, simplest method to deploy this repository is on Vercel.

## Conclusion/Next Steps

- Need to implement Profile page
- Need to implement ability to upload User Avatars
- Need ability to read user avatar from social media.
