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
