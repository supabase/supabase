---
id: 'local-development-testing-pgtap-extended'
title: 'Advanced pgTAP Testing'
description: 'Learn how to leverage dbdev and test helpers for advanced database testing.'
---

While basic pgTAP provides excellent testing capabilities, you can enhance the testing workflow using database development tools and helper packages. This guide covers advanced testing techniques using database.dev and community-maintained test helpers.

## Using database.dev

[Database.dev](https://database.dev) is a package manager for Postgres that allows installation and use of community-maintained packages, including testing utilities.

### Setting up dbdev

To use database development tools and packages, install some prerequisites:

```sql
create extension if not exists http with schema extensions;
create extension if not exists pg_tle;
drop extension if exists "supabase-dbdev";
select pgtle.uninstall_extension_if_exists('supabase-dbdev');
select
    pgtle.install_extension(
        'supabase-dbdev',
        resp.contents ->> 'version',
        'PostgreSQL package manager',
        resp.contents ->> 'sql'
    )
from extensions.http(
    (
        'GET',
        'https://api.database.dev/rest/v1/'
        || 'package_versions?select=sql,version'
        || '&package_name=eq.supabase-dbdev'
        || '&order=version.desc'
        || '&limit=1',
        array[
            ('apiKey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXB0cHBsZnZpaWZyYndtbXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAxMDczNzIsImV4cCI6MTk5NTY4MzM3Mn0.z2CN0mvO2No8wSi46Gw59DFGCTJrzM0AQKsu_5k134s')::extensions.http_header
        ],
        null,
        null
    )
) x,
lateral (
    select
        ((row_to_json(x) -> 'content') #>> '{}')::json -> 0
) resp(contents);
create extension "supabase-dbdev";
select dbdev.install('supabase-dbdev');

-- Drop and recreate the extension to ensure a clean installation
drop extension if exists "supabase-dbdev";
create extension "supabase-dbdev";
```

### Installing test helpers

The Test Helpers package provides utilities that simplify testing Supabase-specific features:

```sql
select dbdev.install('basejump-supabase_test_helpers');
create extension if not exists "basejump-supabase_test_helpers" version '0.0.6';
```

## Test helper benefits

The test helpers package provides several advantages over writing raw pgTAP tests:

1. **Simplified User Management**

   - Create test users with `tests.create_supabase_user()`
   - Switch contexts with `tests.authenticate_as()`
   - Retrieve user IDs using `tests.get_supabase_uid()`

2. **Row Level Security (RLS) Testing Utilities**

   - Verify RLS status with `tests.rls_enabled()`
   - Test policy enforcement
   - Simulate different user contexts

3. **Reduced Boilerplate**
   - No need to manually insert auth.users
   - Simplified JWT claim management
   - Clean test setup and cleanup

## Schema-wide Row Level Security testing

When working with Row Level Security, it's crucial to ensure that RLS is enabled on all tables that need it. Create a simple test to verify RLS is enabled across an entire schema:

```sql
begin;
select plan(1);

-- Verify RLS is enabled on all tables in the public schema
select tests.rls_enabled('public');

select * from finish();
rollback;
```

## Test file organization

When working with multiple test files that share common setup requirements, it's beneficial to create a single "pre-test" file that handles the global environment setup. This approach reduces duplication and ensures consistent test environments.

### Creating a pre-test hook

Since pgTAP test files are executed in alphabetical order, create a setup file that runs first by using a naming convention like `000-setup-tests-hooks.sql`:

```bash
supabase test new 000-setup-tests-hooks
```

This setup file should contain:

1. All shared extensions and dependencies
2. Common test utilities
3. A simple always green test to verify the setup

Here's an example setup file:

```sql
-- install tests utilities
-- install pgtap extension for testing
create extension if not exists pgtap with schema extensions;
/*
---------------------
---- install dbdev ----
----------------------
Requires:
  - pg_tle: https://github.com/aws/pg_tle
  - pgsql-http: https://github.com/pramsey/pgsql-http
*/
create extension if not exists http with schema extensions;
create extension if not exists pg_tle;
drop extension if exists "supabase-dbdev";
select pgtle.uninstall_extension_if_exists('supabase-dbdev');
select
    pgtle.install_extension(
        'supabase-dbdev',
        resp.contents ->> 'version',
        'PostgreSQL package manager',
        resp.contents ->> 'sql'
    )
from extensions.http(
    (
        'GET',
        'https://api.database.dev/rest/v1/'
        || 'package_versions?select=sql,version'
        || '&package_name=eq.supabase-dbdev'
        || '&order=version.desc'
        || '&limit=1',
        array[
            ('apiKey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdXB0cHBsZnZpaWZyYndtbXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODAxMDczNzIsImV4cCI6MTk5NTY4MzM3Mn0.z2CN0mvO2No8wSi46Gw59DFGCTJrzM0AQKsu_5k134s')::extensions.http_header
        ],
        null,
        null
    )
) x,
lateral (
    select
        ((row_to_json(x) -> 'content') #>> '{}')::json -> 0
) resp(contents);
create extension "supabase-dbdev";
select dbdev.install('supabase-dbdev');
drop extension if exists "supabase-dbdev";
create extension "supabase-dbdev";
-- Install test helpers
select dbdev.install('basejump-supabase_test_helpers');
create extension if not exists "basejump-supabase_test_helpers" version '0.0.6';

-- Verify setup with a no-op test
begin;
select plan(1);
select ok(true, 'Pre-test hook completed successfully');
select * from finish();
rollback;
```

### Benefits

This approach provides several advantages:

- Reduces code duplication across test files
- Ensures consistent test environment setup
- Makes it easier to maintain and update shared dependencies
- Provides immediate feedback if the setup process fails

Your subsequent test files (`001-auth-tests.sql`, `002-rls-tests.sql`) can focus solely on their specific test cases, knowing that the environment is properly configured.

## Example: Advanced RLS testing

Here's a complete example using test helpers to verify RLS policies putting it all together:

```sql
begin;
-- Assuming 000-setup-tests-hooks.sql file is present to use tests helpers
select plan(4);

-- Set up test data

-- Create test supabase users
select tests.create_supabase_user('user1@test.com');
select tests.create_supabase_user('user2@test.com');

-- Create test data
insert into public.todos (task, user_id) values
  ('User 1 Task 1', tests.get_supabase_uid('user1@test.com')),
  ('User 1 Task 2', tests.get_supabase_uid('user1@test.com')),
  ('User 2 Task 1', tests.get_supabase_uid('user2@test.com'));

-- Test as User 1
select tests.authenticate_as('user1@test.com');

-- Test 1: User 1 should only see their own todos
select results_eq(
  'select count(*) from todos',
  ARRAY[2::bigint],
  'User 1 should only see their 2 todos'
);

-- Test 2: User 1 can create their own todo
select lives_ok(
  $$insert into todos (task, user_id) values ('New Task', tests.get_supabase_uid('user1@test.com'))$$,
  'User 1 can create their own todo'
);

-- Test as User 2
select tests.authenticate_as('user2@test.com');

-- Test 3: User 2 should only see their own todos
select results_eq(
  'select count(*) from todos',
  ARRAY[1::bigint],
  'User 2 should only see their 1 todo'
);

-- Test 4: User 2 cannot modify User 1's todo
SELECT results_ne(
    $$ update todos set task = 'Hacked!' where user_id = tests.get_supabase_uid('user1@test.com') returning 1 $$,
    $$ values(1) $$,
    'User 2 cannot modify User 1 todos'
);

select * from finish();
rollback;
```

## Not another todo app: Testing complex organizations

Todo apps are great for learning, but this section explores testing a more realistic scenario: a multi-tenant content publishing platform. This example demonstrates testing complex permissions, plan restrictions, and content management.

### System overview

This demo app implements:

- Organizations with tiered plans (free/pro/enterprise)
- Role-based access (owner/admin/editor/viewer)
- Content management (posts/comments)
- Premium content restrictions
- Plan-based limitations

### What makes this complex?

1. **Layered Permissions**

   - Role hierarchies affect access rights
   - Plan types influence user capabilities
   - Content state (draft/published) affects permissions

2. **Business Rules**
   - Free plan post limits
   - Premium content visibility
   - Cross-organization security

### Testing focus areas

When writing tests, verify:

- Organization member access control
- Content visibility across roles
- Plan limitation enforcement
- Cross-organization data isolation

#### 1. App schema definitions

The app schema tables are defined like this:

```sql
create table public.profiles (
  id uuid references auth.users(id) primary key,
  username text unique not null,
  full_name text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.organizations (
  id bigint primary key generated always as identity,
  name text not null,
  slug text unique not null,
  plan_type text not null check (plan_type in ('free', 'pro', 'enterprise')),
  max_posts int not null default 5,
  created_at timestamptz default now()
);

create table public.org_members (
  org_id bigint references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz default now(),
  primary key (org_id, user_id)
);

create table public.posts (
  id bigint primary key generated always as identity,
  title text not null,
  content text not null,
  author_id uuid references public.profiles(id) not null,
  org_id bigint references public.organizations(id),
  status text not null check (status in ('draft', 'published', 'archived')),
  is_premium boolean default false,
  scheduled_for timestamptz,
  category text,
  view_count int default 0,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.comments (
  id bigint primary key generated always as identity,
  post_id bigint references public.posts(id) on delete cascade,
  author_id uuid references public.profiles(id),
  content text not null,
  is_deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

#### 2. RLS policies declaration

Now to setup the RLS policies for each tables:

```sql
-- Create a private schema to store all security definer functions utils
-- As such functions should never be in an API exposed schema
create schema if not exists private;
-- Helper function for role checks
create or replace function private.get_user_org_role(org_id bigint, user_id uuid)
returns text
set search_path = ''
as $$
  select role from public.org_members
  where org_id = $1 and user_id = $2;
-- Note the use of security definer to avoid RLS checking recursion issue
-- see: https://supabase.com/docs/guides/database/postgres/row-level-security#use-security-definer-functions
$$ language sql security definer;
-- Helper utils to check if an org is below the max post limit
create or replace function private.can_add_post(org_id bigint)
returns boolean
set search_path = ''
as $$
  select (select count(*)
          from public.posts p
          where p.org_id = $1) < o.max_posts
  from public.organizations o
  where o.id = $1
$$ language sql security definer;


-- Enable RLS for all tables
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.org_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Organizations policies
create policy "Public org info visible to all"
  on public.organizations for select using (true);

create policy "Org management restricted to owners"
  on public.organizations for all using (
    private.get_user_org_role(id, (select auth.uid())) = 'owner'
  );

-- Org Members policies
create policy "Members visible to org members"
  on public.org_members for select using (
    private.get_user_org_role(org_id, (select auth.uid())) is not null
  );

create policy "Member management restricted to admins and owners"
  on public.org_members for all using (
    private.get_user_org_role(org_id, (select auth.uid())) in ('owner', 'admin')
  );

-- Posts policies
create policy "Complex post visibility"
  on public.posts for select using (
    -- Published non-premium posts are visible to all
    (status = 'published' and not is_premium)
    or
    -- Premium posts visible to org members only
    (status = 'published' and is_premium and
    private.get_user_org_role(org_id, (select auth.uid())) is not null)
    or
    -- All posts visible to editors and above
    private.get_user_org_role(org_id, (select auth.uid())) in ('owner', 'admin', 'editor')
  );

create policy "Post creation rules"
  on public.posts for insert with check (
    -- Must be org member with appropriate role
    private.get_user_org_role(org_id, (select auth.uid())) in ('owner', 'admin', 'editor')
    and
    -- Check org post limits for free plans
    (
      (select o.plan_type != 'free'
      from organizations o
      where o.id = org_id)
      or
      (select private.can_add_post(org_id))
    )
  );

create policy "Post update rules"
  on public.posts for update using (
    exists (
      select 1
      where
        -- Editors can update non-published posts
        (private.get_user_org_role(org_id, (select auth.uid())) = 'editor' and status != 'published')
        or
        -- Admins and owners can update any post
        private.get_user_org_role(org_id, (select auth.uid())) in ('owner', 'admin')
    )
  );

-- Comments policies
create policy "Comments on published posts are viewable by everyone"
  on public.comments for select using (
    exists (
      select 1 from public.posts
      where id = post_id
      and status = 'published'
    )
    and not is_deleted
  );

create policy "Authenticated users can create comments"
  on public.comments for insert with check ((select auth.uid()) = author_id);

create policy "Users can update their own comments"
  on public.comments for update using (author_id = (select auth.uid()));
```

#### 3. Test cases:

Now everything is setup, let's write RLS test cases, note that each section could be in its own test:

```sql
-- Assuming we already have: 000-setup-tests-hooks.sql file we can use tests helpers
begin;
-- Declare total number of tests
select plan(10);

-- Create test users
select tests.create_supabase_user('org_owner', 'owner@test.com');
select tests.create_supabase_user('org_admin', 'admin@test.com');
select tests.create_supabase_user('org_editor', 'editor@test.com');
select tests.create_supabase_user('premium_user', 'premium@test.com');
select tests.create_supabase_user('free_user', 'free@test.com');
select tests.create_supabase_user('scheduler', 'scheduler@test.com');
select tests.create_supabase_user('free_author', 'free_author@test.com');

-- Create profiles for test users
insert into profiles (id, username, full_name)
values
  (tests.get_supabase_uid('org_owner'), 'org_owner', 'Organization Owner'),
  (tests.get_supabase_uid('org_admin'), 'org_admin', 'Organization Admin'),
  (tests.get_supabase_uid('org_editor'), 'org_editor', 'Organization Editor'),
  (tests.get_supabase_uid('premium_user'), 'premium_user', 'Premium User'),
  (tests.get_supabase_uid('free_user'), 'free_user', 'Free User'),
  (tests.get_supabase_uid('scheduler'), 'scheduler', 'Scheduler User'),
  (tests.get_supabase_uid('free_author'), 'free_author', 'Free Author');

-- First authenticate as service role to bypass RLS for initial setup
select tests.authenticate_as_service_role();

-- Create test organizations and setup data
with new_org as (
  insert into organizations (name, slug, plan_type, max_posts)
  values
    ('Test Org', 'test-org', 'pro', 100),
    ('Premium Org', 'premium-org', 'enterprise', 1000),
    ('Schedule Org', 'schedule-org', 'pro', 100),
    ('Free Org', 'free-org', 'free', 2)
  returning id, slug
),
-- Setup members and posts
member_setup as (
  insert into org_members (org_id, user_id, role)
  select
    org.id,
    user_id,
    role
  from new_org org cross join (
    values
      (tests.get_supabase_uid('org_owner'), 'owner'),
      (tests.get_supabase_uid('org_admin'), 'admin'),
      (tests.get_supabase_uid('org_editor'), 'editor'),
      (tests.get_supabase_uid('premium_user'), 'viewer'),
      (tests.get_supabase_uid('scheduler'), 'editor'),
      (tests.get_supabase_uid('free_author'), 'editor')
  ) as members(user_id, role)
  where org.slug = 'test-org'
     or (org.slug = 'premium-org' and role = 'viewer')
     or (org.slug = 'schedule-org' and role = 'editor')
     or (org.slug = 'free-org' and role = 'editor')
)
-- Setup initial posts
insert into posts (title, content, org_id, author_id, status, is_premium, scheduled_for)
select
  title,
  content,
  org.id,
  author_id,
  status,
  is_premium,
  scheduled_for
from new_org org cross join (
  values
    ('Premium Post', 'Premium content', tests.get_supabase_uid('premium_user'), 'published', true, null),
    ('Free Post', 'Free content', tests.get_supabase_uid('premium_user'), 'published', false, null),
    ('Future Post', 'Future content', tests.get_supabase_uid('scheduler'), 'published', false, '2024-01-02 12:00:00+00'::timestamptz)
) as posts(title, content, author_id, status, is_premium, scheduled_for)
where org.slug in ('premium-org', 'schedule-org');

-- Test owner privileges
select tests.authenticate_as('org_owner');
select lives_ok(
  $$
    update organizations
    set name = 'Updated Org'
    where id = (select id from organizations limit 1)
  $$,
  'Owner can update organization'
);

-- Test admin privileges
select tests.authenticate_as('org_admin');
select results_eq(
    $$select count(*) from org_members$$,
    ARRAY[6::bigint],
    'Admin can view all members'
);

-- Test editor restrictions
select tests.authenticate_as('org_editor');
select throws_ok(
  $$
    insert into org_members (org_id, user_id, role)
    values (
      (select id from organizations limit 1),
      (select tests.get_supabase_uid('org_editor')),
      'viewer'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "org_members"',
  'Editor cannot manage members'
);

-- Premium Content Access Tests
select tests.authenticate_as('premium_user');
select results_eq(
    $$select count(*) from posts where org_id = (select id from organizations where slug = 'premium-org')$$,
    ARRAY[3::bigint],
    'Premium user can see all posts'
);

select tests.clear_authentication();
select results_eq(
    $$select count(*) from posts where org_id = (select id from organizations where slug = 'premium-org')$$,
    ARRAY[2::bigint],
    'Anonymous users can only see free posts'
);

-- Time-Based Publishing Tests
select tests.authenticate_as('scheduler');
select tests.freeze_time('2024-01-01 12:00:00+00'::timestamptz);

select results_eq(
    $$select count(*) from posts where scheduled_for > now() and org_id = (select id from organizations where slug = 'schedule-org')$$,
    ARRAY[1::bigint],
    'Can see scheduled posts'
);

select tests.freeze_time('2024-01-02 13:00:00+00'::timestamptz);

select results_eq(
    $$select count(*) from posts where scheduled_for < now() and org_id = (select id from organizations where slug = 'schedule-org')$$,
    ARRAY[1::bigint],
    'Can see posts after schedule time'
);

select tests.unfreeze_time();

-- Plan Limit Tests
select tests.authenticate_as('free_author');

select lives_ok(
  $$
    insert into posts (title, content, org_id, author_id, status)
    select 'Post 1', 'Content 1', id, auth.uid(), 'draft'
    from organizations where slug = 'free-org' limit 1
  $$,
  'First post creates successfully'
);

select lives_ok(
  $$
    insert into posts (title, content, org_id, author_id, status)
    select 'Post 2', 'Content 2', id, auth.uid(), 'draft'
    from organizations where slug = 'free-org' limit 1
  $$,
  'Second post creates successfully'
);

select throws_ok(
  $$
    insert into posts (title, content, org_id, author_id, status)
    select 'Post 3', 'Content 3', id, auth.uid(), 'draft'
    from organizations where slug = 'free-org' limit 1
  $$,
  '42501',
  'new row violates row-level security policy for table "posts"',
  'Cannot exceed free plan post limit'
);

select * from finish();
rollback;
```

## Additional resources

- [Test Helpers Documentation](https://database.dev/basejump/supabase_test_helpers)
- [Test Helpers Reference](https://github.com/usebasejump/supabase-test-helpers)
- [Row Level Security Writing Guide](https://usebasejump.com/blog/testing-on-supabase-with-pgtap)
- [Database.dev Package Registry](https://database.dev)
- [Row Level Security Performance and Best Practices](https://github.com/orgs/supabase/discussions/14576)
