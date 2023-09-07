# Realtime chat example using Supabase

This is a full-stack Slack clone example using:

- Frontend:
  - Next.js.
  - [Supabase.js](https://supabase.com/docs/library/getting-started) for user management and realtime data syncing.
- Backend:
  - [supabase.com/dashboard](https://supabase.com/dashboard/): hosted Postgres database with restful API for usage with Supabase.js.

## Demo

- Live demo: http://supabase-slack-clone-supabase.vercel.app/
- CodeSandbox: https://codesandbox.io/s/github/supabase/supabase/tree/master/examples/nextjs-slack-clone

![Demo animation gif](./public/slack-clone-demo.gif)

## Deploy your own

### 1. Create new project

Sign up to Supabase - [https://supabase.com/dashboard](https://supabase.com/dashboard) and create a new project. Wait for your database to start.

### 2. Run "Slack Clone" Quickstart

Once your database has started, run the "Slack Clone" quickstart.

![Slack Clone Quick Start](https://user-images.githubusercontent.com/1811651/101558751-73fecc80-3974-11eb-80be-423fa2789877.png)

### 3. Get the URL and Key

Go to the Project Settings (the cog icon), open the API tab, and find your API URL and `anon` key. You'll need these in the next step.

The `anon` key is your client-side API key. It allows "anonymous access" to your database, until the user has logged in. Once they have logged in, the keys will switch to the user's own login token. This enables row level security for your data. Read more about this [below](#postgres-row-level-security).

![image](https://user-images.githubusercontent.com/10214025/88916245-528c2680-d298-11ea-8a71-708f93e1ce4f.png)

**_NOTE_**: The `service_role` key has full access to your data, bypassing any security policies. These keys have to be kept secret and are meant to be used in server environments and never on a client or browser.

### 4. Deploy the Next.js client

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fsupabase%2Fsupabase%2Ftree%2Fmaster%2Fexamples%2Fslack-clone%2Fnextjs-slack-clone&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Find%20the%20Supabase%20URL%20and%20key%20in%20the%20your%20auto-generated%20docs%20at%20supabase.com/dashboard&project-name=supabase-slack-clone&repo-name=supabase-slack-clone)

Here, we recommend forking this repo so you can deploy through Vercel by clicking the button above. When you click the button, replace the repo URL with your fork's URL.

You will be asked for a `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Use the API URL and `anon` key from [step 3](#3-get-the-url-and-key).

### 5. Change authentication settings if necessary

![Change auth settings](https://user-images.githubusercontent.com/1811651/101840012-39be3800-3af8-11eb-8c32-73f2fae6299e.png)

On [supabase.com/dashboard](https://supabase.com/dashboard), you can go to Authentication -> Settings to change your auth settings for your project if necessary. Here, you can change the site URL, which is used for determining where to redirect users after they confirm their email addresses or attempt to use a magic link to log in.

Here, you can also enable external oauth providers, such as Google and GitHub.

## How to use

### Using `create-next-app`

Execute [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) with [npm](https://docs.npmjs.com/cli/init) or [Yarn](https://yarnpkg.com/lang/en/docs/cli/create/) to bootstrap the example locally:

```bash
npx create-next-app --example with-supabase-auth-realtime-db realtime-chat-app
# or
yarn create next-app --example with-supabase-auth-realtime-db realtime-chat-app
```

### Download manually

Download the example:

```bash
curl https://codeload.github.com/vercel/next.js/tar.gz/canary | tar -xz --strip=2 next.js-canary/examples/with-supabase-auth-realtime-db
cd with-supabase-auth-realtime-db
```

### Using this repo

Simply clone this repo locally and proceed to the next section.

### Required configuration

Copy the `.env.local.example` file into a file named `.env.local` in the root directory of the example:

```bash
cp .env.local.example .env.local
```

Set your Supabase details from [step 3](#3-get-the-url-and-key) above:

```bash
NEXT_PUBLIC_SUPABASE_URL=<replace-with-your-API-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<replace-with-your-anon-key>
```

### Change authentication settings if necessary

Follow [Step #5](#5-change-authentication-settings-if-necessary) above if you want to change the auth settings.

### Run the development server

Now install the dependencies and start the development server.

```bash
npm install
npm run dev
# or
yarn
yarn dev
```

Visit http://localhost:3000 and start chatting! Open a channel across two browser tabs to see everything getting updated in realtime 🥳

## Supabase details

### Role-based access control (RBAC)

Use [plus addressing](https://en.wikipedia.org/wiki/Email_address#Subaddressing) to sign up users with the `admin` & `moderator` roles. Email addresses including `+supaadmin@` will be assigned the `admin` role, and email addresses including `+supamod@` will be assigned the `moderator` role. For example:

```
// admin user
email+supaadmin@example.com

// moderator user
email+supamod@example.com
```

Users with the `moderator` role can delete all messages. Users with the `admin` role can delete all messages and channels (note: it's not recommended to delete the `public` channel).

### Postgres Row level security

This project uses very high-level Authorization using Postgres' Role Level Security.
When you start a Postgres database on Supabase, we populate it with an `auth` schema, and some helper functions.
When a user logs in, they are issued a JWT with the role `authenticated` and their UUID.
We can use these details to provide fine-grained control over what each user can and cannot do.

Full schema here with role-based access control:

```sql
--
-- For use with https://github.com/supabase/supabase/tree/master/examples/slack-clone/nextjs-slack-clone
--

-- Custom types
create type public.app_permission as enum ('channels.delete', 'messages.delete');
create type public.app_role as enum ('admin', 'moderator');
create type public.user_status as enum ('ONLINE', 'OFFLINE');

-- USERS
create table public.users (
  id          uuid not null primary key, -- UUID from auth.users
  username    text,
  status      user_status default 'OFFLINE'::public.user_status
);
comment on table public.users is 'Profile data for each user.';
comment on column public.users.id is 'References the internal Supabase Auth user.';

-- CHANNELS
create table public.channels (
  id            bigint generated by default as identity primary key,
  inserted_at   timestamp with time zone default timezone('utc'::text, now()) not null,
  slug          text not null unique,
  created_by    uuid references public.users not null
);
comment on table public.channels is 'Topics and groups.';

-- MESSAGES
create table public.messages (
  id            bigint generated by default as identity primary key,
  inserted_at   timestamp with time zone default timezone('utc'::text, now()) not null,
  message       text,
  user_id       uuid references public.users not null,
  channel_id    bigint references public.channels on delete cascade not null
);
comment on table public.messages is 'Individual messages sent by each user.';

-- USER ROLES
create table public.user_roles (
  id        bigint generated by default as identity primary key,
  user_id   uuid references public.users on delete cascade not null,
  role      app_role not null,
  unique (user_id, role)
);
comment on table public.user_roles is 'Application roles for each user.';

-- ROLE PERMISSIONS
create table public.role_permissions (
  id           bigint generated by default as identity primary key,
  role         app_role not null,
  permission   app_permission not null,
  unique (role, permission)
);
comment on table public.role_permissions is 'Application permissions for each role.';

-- authorize with role-based access control (RBAC)
create function public.authorize(
  requested_permission app_permission,
  user_id uuid
)
returns boolean as $$
declare
  bind_permissions int;
begin
  select count(*)
  from public.role_permissions
  inner join public.user_roles on role_permissions.role = user_roles.role
  where role_permissions.permission = authorize.requested_permission
    and user_roles.user_id = authorize.user_id
  into bind_permissions;

  return bind_permissions > 0;
end;
$$ language plpgsql security definer;

-- Secure the tables
alter table public.users enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
create policy "Allow logged-in read access" on public.users for select using ( auth.role() = 'authenticated' );
create policy "Allow individual insert access" on public.users for insert with check ( auth.uid() = id );
create policy "Allow individual update access" on public.users for update using ( auth.uid() = id );
create policy "Allow logged-in read access" on public.channels for select using ( auth.role() = 'authenticated' );
create policy "Allow individual insert access" on public.channels for insert with check ( auth.uid() = created_by );
create policy "Allow individual delete access" on public.channels for delete using ( auth.uid() = created_by );
create policy "Allow authorized delete access" on public.channels for delete using ( authorize('channels.delete', auth.uid()) );
create policy "Allow logged-in read access" on public.messages for select using ( auth.role() = 'authenticated' );
create policy "Allow individual insert access" on public.messages for insert with check ( auth.uid() = user_id );
create policy "Allow individual update access" on public.messages for update using ( auth.uid() = user_id );
create policy "Allow individual delete access" on public.messages for delete using ( auth.uid() = user_id );
create policy "Allow authorized delete access" on public.messages for delete using ( authorize('messages.delete', auth.uid()) );
create policy "Allow individual read access" on public.user_roles for select using ( auth.uid() = user_id );

-- Send "previous data" on change
alter table public.users replica identity full;
alter table public.channels replica identity full;
alter table public.messages replica identity full;

-- inserts a row into public.users and assigns roles
create function public.handle_new_user()
returns trigger as $$
declare is_admin boolean;
begin
  insert into public.users (id, username)
  values (new.id, new.email);

  select count(*) = 1 from auth.users into is_admin;

  if position('+supaadmin@' in new.email) > 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  elsif position('+supamod@' in new.email) > 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'moderator');
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

/**
 * REALTIME SUBSCRIPTIONS
 * Only allow realtime listening on public tables.
 */

begin;
  -- remove the realtime publication
  drop publication if exists supabase_realtime;

  -- re-create the publication but don't enable it for any tables
  create publication supabase_realtime;
commit;

-- add tables to the publication
alter publication supabase_realtime add table public.channels;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.users;

-- DUMMY DATA
insert into public.users (id, username)
values
    ('8d0fd2b3-9ca7-4d9e-a95f-9e13dded323e', 'supabot');

insert into public.channels (slug, created_by)
values
    ('public', '8d0fd2b3-9ca7-4d9e-a95f-9e13dded323e'),
    ('random', '8d0fd2b3-9ca7-4d9e-a95f-9e13dded323e');

insert into public.messages (message, channel_id, user_id)
values
    ('Hello World 👋', 1, '8d0fd2b3-9ca7-4d9e-a95f-9e13dded323e'),
    ('Perfection is attained, not when there is nothing more to add, but when there is nothing left to take away.', 2, '8d0fd2b3-9ca7-4d9e-a95f-9e13dded323e');

insert into public.role_permissions (role, permission)
values
    ('admin', 'channels.delete'),
    ('admin', 'messages.delete'),
    ('moderator', 'messages.delete');
```

## Authors

- [Supabase](https://supabase.com)

Supabase is open source, we'd love for you to follow along and get involved at https://github.com/supabase/supabase
