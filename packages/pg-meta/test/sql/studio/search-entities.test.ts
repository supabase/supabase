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

const search = async (
  db: Awaited<ReturnType<typeof createTestDatabase>>,
  query: string,
  limit?: number
) => {
  const [row] = await db.executeQuery<SearchEntitiesResult[]>(
    getSearchEntitiesSql({ query, limit })
  )
  return row.tables
}

withTestDatabase('ranks exact, then prefix, then substring matches', async (db) => {
  await db.executeQuery(`
    create table public.old_blog_posts (id int);
    create table public.blog_posts_archive (id int);
    create table public.blog_posts (id int);
  `)

  const tables = await search(db, 'blog_posts')

  expect(tables.map((t) => t.name)).toEqual(['blog_posts', 'blog_posts_archive', 'old_blog_posts'])
})

withTestDatabase('matches case-insensitively', async (db) => {
  await db.executeQuery(`create table public."BlogPosts" (id int);`)

  const tables = await search(db, 'blogposts')

  expect(tables.map((t) => t.name)).toEqual(['BlogPosts'])
})

withTestDatabase('treats LIKE wildcards in the query literally', async (db) => {
  await db.executeQuery(`
    create table public.blog_posts (id int);
    create table public.blogxposts (id int);
  `)

  const tables = await search(db, 'blog_posts')
  expect(tables.map((t) => t.name)).toEqual(['blog_posts'])

  expect(await search(db, '%')).toEqual([])
})

withTestDatabase('handles quotes in the query safely', async (db) => {
  await db.executeQuery(`create table public.blog_posts (id int);`)

  expect(await search(db, `'; drop table public.blog_posts; --`)).toEqual([])
  expect(await search(db, 'blog_posts')).toHaveLength(1)
})

withTestDatabase('respects the limit', async (db) => {
  await db.executeQuery(`
    create table public.blog_a (id int);
    create table public.blog_b (id int);
    create table public.blog_c (id int);
  `)

  expect(await search(db, 'blog', 2)).toHaveLength(2)
})

withTestDatabase('only returns tables, excluding partitions and system schemas', async (db) => {
  await db.executeQuery(`
    create table public.blog_posts (id int);
    create view public.blog_view as select 1;
    create materialized view public.blog_mat_view as select 1;
    create table public.blog_events (id int, region text) partition by list (region);
    create table public.blog_events_east partition of public.blog_events for values in ('east');
  `)

  const tables = await search(db, 'blog')
  expect(tables.map((t) => t.name).sort()).toEqual(['blog_events', 'blog_posts'])

  // pg_catalog tables like pg_class are never returned
  expect(await search(db, 'pg_class')).toEqual([])
})

withTestDatabase('returns schema, RLS status and policy count', async (db) => {
  await db.executeQuery(`
    create schema blog;
    create table blog.posts (id int);
    alter table blog.posts enable row level security;
    create policy "read" on blog.posts for select using (true);
    create policy "write" on blog.posts for insert with check (true);
    create table public.posts_drafts (id int);
  `)

  const tables = await search(db, 'posts')

  expect(tables).toEqual([
    expect.objectContaining({ schema: 'blog', name: 'posts', rls_enabled: true, policy_count: 2 }),
    expect.objectContaining({
      schema: 'public',
      name: 'posts_drafts',
      rls_enabled: false,
      policy_count: 0,
    }),
  ])
  expect(typeof tables[0].id).toBe('number')
})

withTestDatabase('matches schema-qualified searches', async (db) => {
  await db.executeQuery(`
    create schema blog;
    create table blog.colors (id int);
    create table public.colors (id int);
    create table public.colors_archive (id int);
  `)

  const tables = await search(db, 'public.colors')

  expect(tables.map((t) => `${t.schema}.${t.name}`)).toEqual([
    'public.colors',
    'public.colors_archive',
  ])
})

withTestDatabase('matches a partial schema name', async (db) => {
  await db.executeQuery(`create table public.colors (id int);`)

  const tables = await search(db, 'pub.col')

  expect(tables.map((t) => `${t.schema}.${t.name}`)).toEqual(['public.colors'])
})

withTestDatabase('lists tables in a schema when the name part is empty', async (db) => {
  await db.executeQuery(`
    create schema blog;
    create table blog.posts (id int);
    create table blog.authors (id int);
    create table public.posts (id int);
  `)

  const tables = await search(db, 'blog.')

  expect(tables.map((t) => `${t.schema}.${t.name}`).sort()).toEqual(['blog.authors', 'blog.posts'])
})

withTestDatabase('still matches table names that contain a dot', async (db) => {
  await db.executeQuery(`create table public."v1.colors" (id int);`)

  const tables = await search(db, 'v1.colors')

  expect(tables.map((t) => t.name)).toEqual(['v1.colors'])
})

withTestDatabase('escapes wildcards in both parts of a schema-qualified search', async (db) => {
  await db.executeQuery(`
    create schema my_app;
    create schema myxapp;
    create table my_app.blog_posts (id int);
    create table myxapp.blog_posts (id int);
    create table my_app.blogxposts (id int);
  `)

  const tables = await search(db, 'my_app.blog_posts')

  expect(tables.map((t) => `${t.schema}.${t.name}`)).toEqual(['my_app.blog_posts'])
})

withTestDatabase('returns an empty array when nothing matches', async (db) => {
  expect(await search(db, 'does_not_exist')).toEqual([])
})
