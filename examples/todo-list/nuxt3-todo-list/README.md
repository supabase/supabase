# Nuxt3 Todo example using Supabase
![nuxt3-supabase-todo](docs/nuxt3-supabase-todo.png)

- Frontend:
  - [Nuxt3 Docs](https://nuxt.com/docs)
  - [Supabase Docs](https://supabase.com/docs)
  - [NuxtLabs UI Docs](https://ui.nuxtlabs.com/getting-started)
- Backend:
  - [app.supabase.com](https://app.supabase.com/): hosted Postgres database with restful API for usage with Supabase.js.

## Build from scratch

### 1. Create new project

Sign up to Supabase - [https://app.supabase.com](https://app.supabase.com) and create a new project. Wait for your database to start.

### 2. Run build-todo-app.sql
Once your database has started, [***build-todo-app.sql***](./sql-scripts/build-todo-app.sql). Inside of your project, enter the `SQL editor`, and run the contents of the file.

### 3. Get the URL and Key

Go to the Project Settings (the cog icon), open the API tab, and find your API URL and `anon` key, you'll need these in the next step.

The `anon` key is your client-side API key. It allows "anonymous access" to your database, until the user has logged in. Once they have logged in, the keys will switch to the user's own login token. This enables row level security for your data. Read more about this [below](#postgres-row-level-security).

![image](https://user-images.githubusercontent.com/10214025/88916245-528c2680-d298-11ea-8a71-708f93e1ce4f.png)

**_NOTE_**: The `service_role` key has full access to your data, bypassing any security policies. These keys have to be kept secret and are meant to be used in server environments and never on a client or browser.

These variables should be placed in a .env file - see .env.example:
```
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_KEY=YOUR_SUPABASE_KEY
```

### Start the app

```
npm install
npm run dev
```

## Supabase details
This is a trimmed-down schema, with the policies:

```sql
create table if not exists todo (
  id uuid NOT NULL DEFAULT gen_random_uuid() primary key
  ,user_id uuid not null
  ,created_at timestamptz not null default current_timestamp
  ,updated_at timestamptz not null default current_timestamp
  ,name citext not null
  ,description citext
  ,status todo_status not null default 'incomplete'
);  
----------------------------------------------------------------------------------------------
ALTER TABLE todo ENABLE ROW LEVEL SECURITY;
create policy "Individuals can create todos." on todo for
  insert with check (auth.uid() = user_id);
create policy "Individuals can view their own todos. " on todo for
  select using (auth.uid() = user_id);
create policy "Individuals can update their own todos." on todo for
  update using (auth.uid() = user_id);
create policy "Individuals can delete their own todos." on todo for
  delete using (auth.uid() = user_id);
```

### Postgres Row level security

This project uses very high-level Authorization using Postgres' Role Level Security.
When you start a Postgres database on Supabase, we populate it with an `auth` schema, and some helper functions.
When a user logs in, they are issued a JWT with the role `authenticated` and their UUID.
We can use these details to provide fine-grained control over what each user can and cannot do.

## Authors

- [Supabase](https://supabase.com)

Supabase is open source. We'd love for you to follow along and get involved at https://github.com/supabase/supabase
