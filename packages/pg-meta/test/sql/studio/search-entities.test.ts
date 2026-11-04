import { afterAll, expect, test } from 'vitest'

import { getSearchEntitiesSql, type SearchEntitiesResult } from '../../../src'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

afterAll(async () => {
  await cleanupRoot()
})

const withTestDatabase = (
  name: string,
  fn: (db: Awaited<ReturnType<typeof createTestDatabase>>) => Promise<void>
) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

const search = async (db: Awaited<ReturnType<typeof createTestDatabase>>, query: string) => {
  const [row] = await db.executeQuery<SearchEntitiesResult[]>(getSearchEntitiesSql({ query }))
  return row.tables.map((t) => `${t.schema}.${t.name}`)
}

withTestDatabase('ranks exact, then prefix, then substring matches', async (db) => {
  await db.executeQuery(`
    create table public.old_blog_posts (id int);
    create table public.blog_posts_archive (id int);
    create table public.blog_posts (id int);
  `)

  expect(await search(db, 'blog_posts')).toEqual([
    'public.blog_posts',
    'public.blog_posts_archive',
    'public.old_blog_posts',
  ])
})

withTestDatabase('treats LIKE wildcards in the query literally', async (db) => {
  await db.executeQuery(`
    create schema my_app;
    create schema myxapp;
    create table my_app.blog_posts (id int);
    create table my_app.blogxposts (id int);
    create table myxapp.blog_posts (id int);
  `)

  expect((await search(db, 'blog_posts')).sort()).toEqual([
    'my_app.blog_posts',
    'myxapp.blog_posts',
  ])
  expect(await search(db, 'my_app.blog_posts')).toEqual(['my_app.blog_posts'])
  expect(await search(db, '%')).toEqual([])
})

withTestDatabase('matches schema-qualified searches', async (db) => {
  await db.executeQuery(`
    create schema blog;
    create table blog.colors (id int);
    create table public.colors (id int);
    create table public.colors_archive (id int);
    create table public."v1.palette" (id int);
  `)

  expect(await search(db, 'public.colors')).toEqual(['public.colors', 'public.colors_archive'])
  // A partial schema name matches too
  expect(await search(db, 'pub.colors')).toEqual(['public.colors', 'public.colors_archive'])
  // Table names that themselves contain a dot are still found
  expect(await search(db, 'v1.palette')).toEqual(['public.v1.palette'])
})

withTestDatabase('only returns tables, excluding partitions and system schemas', async (db) => {
  await db.executeQuery(`
    create table public.blog_posts (id int);
    create view public.blog_view as select 1;
    create materialized view public.blog_mat_view as select 1;
    create table public.blog_events (id int, region text) partition by list (region);
    create table public.blog_events_east partition of public.blog_events for values in ('east');
  `)

  expect((await search(db, 'blog')).sort()).toEqual(['public.blog_events', 'public.blog_posts'])
  expect(await search(db, 'pg_class')).toEqual([])
})

withTestDatabase('returns RLS status and policy count', async (db) => {
  await db.executeQuery(`
    create table public.posts (id int);
    alter table public.posts enable row level security;
    create policy "read" on public.posts for select using (true);
    create policy "write" on public.posts for insert with check (true);
    create table public.posts_drafts (id int);
  `)

  const [row] = await db.executeQuery<SearchEntitiesResult[]>(
    getSearchEntitiesSql({ query: 'posts' })
  )

  expect(row.tables).toEqual([
    {
      id: expect.any(Number),
      schema: 'public',
      name: 'posts',
      rls_enabled: true,
      policy_count: 2,
    },
    {
      id: expect.any(Number),
      schema: 'public',
      name: 'posts_drafts',
      rls_enabled: false,
      policy_count: 0,
    },
  ])
})

const searchPolicies = async (
  db: Awaited<ReturnType<typeof createTestDatabase>>,
  query: string,
  options?: { limit?: number }
) => {
  const [row] = await db.executeQuery<SearchEntitiesResult[]>(
    getSearchEntitiesSql({ query, ...options })
  )
  return row.policies.map((p) => `${p.schema}.${p.table}: ${p.name} (${p.command})`)
}

withTestDatabase(
  'finds policies by name, ranking name matches before table matches',
  async (db) => {
    await db.executeQuery(`
    create table public.posts (id int);
    create table public.comments (id int);
    alter table public.posts enable row level security;
    alter table public.comments enable row level security;
    create policy "posts are public" on public.posts for select using (true);
    create policy "authors write" on public.posts for insert with check (true);
    create policy "posts moderation" on public.comments for update using (true);
  `)

    expect(await searchPolicies(db, 'posts')).toEqual([
      // Name matches, ranked by prefix then length
      'public.posts: posts are public (SELECT)',
      'public.comments: posts moderation (UPDATE)',
      // Policies on the matched `posts` table that didn't match by name
      'public.posts: authors write (INSERT)',
    ])
  }
)

withTestDatabase('ranks name-matched policies by policy name, not by table', async (db) => {
  await db.executeQuery(`
    create table public.a (id int);
    create table public.bb (id int);
    create policy "read_everything" on public.a for select using (true);
    create policy "read_x" on public.bb for select using (true);
  `)

  expect(await searchPolicies(db, 'read')).toEqual([
    'public.bb: read_x (SELECT)',
    'public.a: read_everything (SELECT)',
  ])
})

withTestDatabase('returns a policy that matches both ways only once', async (db) => {
  await db.executeQuery(`
    create table public.posts (id int);
    create policy "posts read" on public.posts for select using (true);
  `)

  expect(await searchPolicies(db, 'posts')).toEqual(['public.posts: posts read (SELECT)'])
})

withTestDatabase('caps the total number of policies', async (db) => {
  await db.executeQuery(`
    create table public.posts (id int);
    create policy "posts a" on public.posts for select using (true);
    create policy "posts b" on public.posts for insert with check (true);
    create policy "posts c" on public.posts for update using (true);
    create policy "posts d" on public.posts for delete using (true);
  `)

  expect(await searchPolicies(db, 'posts', { limit: 2 })).toEqual([
    'public.posts: posts a (SELECT)',
    'public.posts: posts b (INSERT)',
  ])
})

withTestDatabase('maps policy commands and returns ids for linking', async (db) => {
  await db.executeQuery(`
    create table public.posts (id int);
    create policy "everything" on public.posts for all using (true);
  `)

  const [row] = await db.executeQuery<SearchEntitiesResult[]>(
    getSearchEntitiesSql({ query: 'everything' })
  )

  expect(row.policies).toEqual([
    {
      id: expect.any(Number),
      name: 'everything',
      command: 'ALL',
      schema: 'public',
      table: 'posts',
      table_id: expect.any(Number),
    },
  ])
  expect(row.policies[0].table_id).toEqual(
    (await db.executeQuery<{ id: number }[]>(`select 'public.posts'::regclass::oid::int8 as id`))[0]
      .id
  )
})

withTestDatabase('treats LIKE wildcards in policy searches literally', async (db) => {
  await db.executeQuery(`
    create table public.posts (id int);
    create policy "read_posts" on public.posts for select using (true);
    create policy "readxposts" on public.posts for select using (true);
  `)

  expect(await searchPolicies(db, 'read_posts')).toEqual(['public.posts: read_posts (SELECT)'])
  expect(await searchPolicies(db, '%')).toEqual([])
})

const searchFunctions = async (
  db: Awaited<ReturnType<typeof createTestDatabase>>,
  query: string,
  options?: { limit?: number }
) => {
  const [row] = await db.executeQuery<SearchEntitiesResult[]>(
    getSearchEntitiesSql({ query, ...options })
  )
  return row.functions.map((f) => `${f.schema}.${f.name}(${f.args})`)
}

withTestDatabase('ranks function matches exact, then prefix, then substring', async (db) => {
  await db.executeQuery(`
    create function public.old_get_user() returns int language sql as 'select 1';
    create function public.get_user_by_id(id int) returns int language sql as 'select 1';
    create function public.get_user() returns int language sql as 'select 1';
  `)

  expect(await searchFunctions(db, 'get_user')).toEqual([
    'public.get_user()',
    'public.get_user_by_id(id integer)',
    'public.old_get_user()',
  ])
})

withTestDatabase('returns overloads separately with their identity arguments', async (db) => {
  await db.executeQuery(`
    create function public.add_one(a int) returns int language sql as 'select a + 1';
    create function public.add_one(a text, b text) returns text language sql as 'select a || b';
  `)

  const [row] = await db.executeQuery<SearchEntitiesResult[]>(
    getSearchEntitiesSql({ query: 'add_one' })
  )

  expect(row.functions).toHaveLength(2)
  expect(new Set(row.functions.map((f) => f.id)).size).toBe(2)
  expect(row.functions.map((f) => f.args).sort()).toEqual(['a integer', 'a text, b text'])
})

withTestDatabase('distinguishes procedures and skips aggregates', async (db) => {
  await db.executeQuery(`
    create function public.stat_fn() returns int language sql as 'select 1';
    create procedure public.stat_proc() language sql as 'select 1';
    create function public.stat_sfunc(state int, v int) returns int language sql as 'select state + v';
    create aggregate public.stat_agg(int) (sfunc = public.stat_sfunc, stype = int);
  `)

  const [row] = await db.executeQuery<SearchEntitiesResult[]>(
    getSearchEntitiesSql({ query: 'stat_' })
  )

  expect(row.functions.map((f) => `${f.name}:${f.type}`).sort()).toEqual([
    'stat_fn:function',
    'stat_proc:procedure',
    'stat_sfunc:function',
  ])
})

withTestDatabase('leaves out system schema functions', async (db) => {
  // pg_catalog has plenty of pg_get_* functions, so this only passes if they are excluded
  expect(await searchFunctions(db, 'pg_get_')).toEqual([])
})

withTestDatabase(
  'leaves out extension functions without hiding the same-named ones',
  async (db) => {
    await db.executeQuery(`
    create schema ext;
    create extension pgcrypto schema ext;
    create function public.crypt_user_function() returns int language sql as 'select 1';
  `)

    // pgcrypto's own `crypt` is an exact match, and would otherwise rank first
    expect(await searchFunctions(db, 'crypt')).toEqual(['public.crypt_user_function()'])
  }
)

withTestDatabase(
  'finds the user functions when extension functions match more of the cap',
  async (db) => {
    await db.executeQuery(`
    create schema ext;
    create extension pgcrypto schema ext;
    create function public.pgp_user_function() returns int language sql as 'select 1';
  `)

    // pgcrypto ships well over the 6 `pgp_*` functions that would fill the result
    expect(await searchFunctions(db, 'pgp_')).toEqual(['public.pgp_user_function()'])
  }
)

withTestDatabase('matches schema-qualified function searches', async (db) => {
  await db.executeQuery(`
    create schema app;
    create function app.helper() returns int language sql as 'select 1';
    create function public.helper() returns int language sql as 'select 1';
    create function public."v1.helper"() returns int language sql as 'select 1';
  `)

  expect(await searchFunctions(db, 'app.helper')).toEqual(['app.helper()'])
  // A partial schema name matches too
  expect(await searchFunctions(db, 'ap.helper')).toEqual(['app.helper()'])
  // Function names that themselves contain a dot are still found
  expect(await searchFunctions(db, 'v1.helper')).toEqual(['public.v1.helper()'])
})

withTestDatabase('treats LIKE wildcards in function searches literally', async (db) => {
  await db.executeQuery(`
    create function public.read_fn() returns int language sql as 'select 1';
    create function public.readxfn() returns int language sql as 'select 1';
  `)

  expect(await searchFunctions(db, 'read_fn')).toEqual(['public.read_fn()'])
  expect(await searchFunctions(db, '%')).toEqual([])
})

withTestDatabase('caps the number of functions', async (db) => {
  await db.executeQuery(`
    create function public.cap_a() returns int language sql as 'select 1';
    create function public.cap_b() returns int language sql as 'select 1';
    create function public.cap_c() returns int language sql as 'select 1';
  `)

  expect(await searchFunctions(db, 'cap_', { limit: 2 })).toEqual([
    'public.cap_a()',
    'public.cap_b()',
  ])
})
