import { afterAll, expect, test } from 'vitest'

import {
  getTableReferencingFunctionsSql,
  getTableRelatedResourcesSql,
  type TableReferencingFunctionsResult,
  type TableRelatedResourcesResult,
} from '../../../src'
import { cleanupRoot, createTestDatabase } from '../../db/utils'

afterAll(async () => {
  await cleanupRoot()
})

type TestDatabase = Awaited<ReturnType<typeof createTestDatabase>>

const withTestDatabase = (name: string, fn: (db: TestDatabase) => Promise<void>) => {
  test(name, async () => {
    const db = await createTestDatabase()
    try {
      await fn(db)
    } finally {
      await db.cleanup()
    }
  })
}

const related = async (db: TestDatabase, name: string, schema = 'public') => {
  const [row] = await db.executeQuery<TableRelatedResourcesResult[]>(
    getTableRelatedResourcesSql({ schema, name })
  )
  return row
}

const referencingFunctions = async (db: TestDatabase, name: string, schema = 'public') => {
  const [row] = await db.executeQuery<TableReferencingFunctionsResult[]>(
    getTableReferencingFunctionsSql({ schema, name })
  )
  return row.functions.map((fn) => `${fn.schema}.${fn.name}`)
}

withTestDatabase('returns the policies and triggers of that table only', async (db) => {
  await db.executeQuery(`
    create table public.blog_posts (id int, title text);
    create table public.comments (id int);

    create policy "posts are public" on public.blog_posts for select using (true);
    create policy "authors can edit" on public.blog_posts for update using (true);
    create policy "comments are public" on public.comments for select using (true);

    create function public.touch() returns trigger language plpgsql as $$ begin return new; end $$;
    create trigger set_updated_at before insert or update on public.blog_posts
      for each row execute function public.touch();
    create trigger comments_touch before insert on public.comments
      for each row execute function public.touch();
  `)

  const result = await related(db, 'blog_posts')

  expect(result.policies).toEqual([
    expect.objectContaining({ name: 'authors can edit', command: 'UPDATE', schema: 'public' }),
    expect.objectContaining({ name: 'posts are public', command: 'SELECT', schema: 'public' }),
  ])
  expect(result.triggers).toEqual([
    expect.objectContaining({
      name: 'set_updated_at',
      activation: 'BEFORE',
      events: ['INSERT', 'UPDATE'],
      schema: 'public',
    }),
  ])
})

withTestDatabase('leaves out the internal triggers backing constraints', async (db) => {
  await db.executeQuery(`
    create table public.authors (id int primary key);
    create table public.blog_posts (
      id int,
      author_id int references public.authors (id) on delete cascade
    );

    create function public.touch() returns trigger language plpgsql as $$ begin return new; end $$;
    create trigger audit_changes after update on public.blog_posts
      for each row execute function public.touch();
  `)

  // The foreign key installs its own triggers on both tables
  expect((await related(db, 'blog_posts')).triggers).toEqual([
    expect.objectContaining({ name: 'audit_changes', activation: 'AFTER', events: ['UPDATE'] }),
  ])
  expect((await related(db, 'authors')).triggers).toEqual([])
})

withTestDatabase('finds functions that reference the table in their body', async (db) => {
  await db.executeQuery(`
    create schema ext;
    create extension pgcrypto schema ext;
    create table public.blog_posts (id int);

    create function public.count_blog_posts() returns bigint language sql as
      'select count(*) from public.blog_posts';
    create function public.unrelated() returns int language sql as 'select 1';

    -- Already listed under the trigger it backs, so it should not repeat as a function
    create function public.blog_posts_touch() returns trigger language plpgsql as
      $$ begin insert into public.blog_posts values (1); return new; end $$;
    create trigger touch before insert on public.blog_posts
      for each row execute function public.blog_posts_touch();

    -- Extension functions are never offered, even when they mention the table
    create function ext.blog_posts_helper() returns int language sql as
      'select 1 /* blog_posts */';
    alter extension pgcrypto add function ext.blog_posts_helper();
  `)

  expect(await referencingFunctions(db, 'blog_posts')).toEqual(['public.count_blog_posts'])
  // The trigger function is listed as a trigger instead
  expect((await related(db, 'blog_posts')).triggers).toEqual([
    expect.objectContaining({ name: 'touch' }),
  ])
})

withTestDatabase('ranks functions named after the table first, and caps the list', async (db) => {
  await db.executeQuery(`
    create table public.blog_posts (id int);

    do $$
    declare i int;
    begin
      -- More mentions than the cap, none of them named after the table
      for i in 1..8 loop
        execute format(
          'create function public.report_%s() returns bigint language sql as %L',
          i, 'select count(*) from public.blog_posts'
        );
      end loop;
    end $$;

    create function public.blog_posts_summary() returns bigint language sql as
      'select count(*) from public.blog_posts';
  `)

  const names = await referencingFunctions(db, 'blog_posts')

  expect(names).toHaveLength(5)
  expect(names[0]).toBe('public.blog_posts_summary')
})

withTestDatabase('treats LIKE wildcards in the table name literally', async (db) => {
  await db.executeQuery(`
    create table public.blog_posts (id int);
    create table public.blogxposts (id int);

    create function public.count_other() returns bigint language sql as
      'select count(*) from public.blogxposts';
  `)

  // An unescaped `_` would make blog_posts match the blogxposts reference
  expect(await referencingFunctions(db, 'blog_posts')).toEqual([])
})

withTestDatabase('returns empty results for a table that is not there', async (db) => {
  await db.executeQuery(`
    create table public.blog_posts (id int);
    create policy "posts are public" on public.blog_posts for select using (true);
  `)

  expect(await related(db, 'blog_posts', 'other_schema')).toEqual({ policies: [], triggers: [] })
  expect(await referencingFunctions(db, 'blog_posts', 'other_schema')).toEqual([])
})
