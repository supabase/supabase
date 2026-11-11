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
  'finds the user functions when extension functions fill the candidate cap',
  async (db) => {
    await db.executeQuery(`
      create schema ext;
      create extension pgcrypto schema ext;
      create function public.pgp_user_function_with_a_long_name() returns int language sql as 'select 1';

      -- More extension functions than the 50 candidates, all with shorter names so
      -- they outrank the user's. Filtering them out after the cap would leave nothing.
      do $$
      begin
        for i in 1..60 loop
          execute format('create function ext.pgp_a%s() returns int language sql as ''select 1''', i);
          execute format('alter extension pgcrypto add function ext.pgp_a%s()', i);
        end loop;
      end $$;
    `)

    expect(await searchFunctions(db, 'pgp_')).toEqual([
      'public.pgp_user_function_with_a_long_name()',
    ])
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

const searchTriggers = async (
  db: Awaited<ReturnType<typeof createTestDatabase>>,
  query: string,
  options?: { limit?: number }
) => {
  const [row] = await db.executeQuery<SearchEntitiesResult[]>(
    getSearchEntitiesSql({ query, ...options })
  )
  return row.triggers.map(
    (t) => `${t.schema}.${t.table}: ${t.name} (${t.activation} ${t.events.join(' OR ')})`
  )
}

const TRIGGER_FN = `create function public.noop() returns trigger language plpgsql as 'begin return new; end';`

withTestDatabase('finds triggers by name with their timing and events', async (db) => {
  await db.executeQuery(`
    ${TRIGGER_FN}
    create table public.posts (id int);
    create view public.posts_view as select * from public.posts;
    create trigger audit_insert before insert on public.posts for each row execute function public.noop();
    create trigger audit_change after update or delete on public.posts for each row execute function public.noop();
    create trigger audit_wipe after truncate on public.posts for each statement execute function public.noop();
    create trigger audit_view instead of insert on public.posts_view for each row execute function public.noop();
  `)

  expect((await searchTriggers(db, 'audit_', { limit: 10 })).sort()).toEqual([
    'public.posts: audit_change (AFTER UPDATE OR DELETE)',
    'public.posts: audit_insert (BEFORE INSERT)',
    'public.posts: audit_wipe (AFTER TRUNCATE)',
    'public.posts_view: audit_view (INSTEAD OF INSERT)',
  ])
})

withTestDatabase('ranks name-matched triggers by trigger name, not by table', async (db) => {
  await db.executeQuery(`
    ${TRIGGER_FN}
    create table public.a (id int);
    create table public.bb (id int);
    create trigger sync_everything after insert on public.a for each row execute function public.noop();
    create trigger sync_x after insert on public.bb for each row execute function public.noop();
  `)

  expect(await searchTriggers(db, 'sync')).toEqual([
    'public.bb: sync_x (AFTER INSERT)',
    'public.a: sync_everything (AFTER INSERT)',
  ])
})

withTestDatabase('includes triggers on a matched table, name matches first', async (db) => {
  await db.executeQuery(`
    ${TRIGGER_FN}
    create table public.posts (id int);
    create table public.comments (id int);
    create trigger touch_updated_at before update on public.posts for each row execute function public.noop();
    create trigger posts_audit after insert on public.posts for each row execute function public.noop();
    create trigger posts_moderation after insert on public.comments for each row execute function public.noop();
  `)

  expect(await searchTriggers(db, 'posts', { limit: 10 })).toEqual([
    // Name matches
    'public.posts: posts_audit (AFTER INSERT)',
    'public.comments: posts_moderation (AFTER INSERT)',
    // Triggers on the matched `posts` table that didn't match by name
    'public.posts: touch_updated_at (BEFORE UPDATE)',
  ])
})

withTestDatabase('leaves out internal triggers such as foreign key checks', async (db) => {
  await db.executeQuery(`
    create table public.authors (id int primary key);
    create table public.posts (id int, author_id int references public.authors (id));
  `)

  // Foreign keys create RI_ConstraintTrigger_* triggers on both tables
  const [{ n }] = await db.executeQuery<{ n: number }[]>(
    `select count(*)::int as n from pg_trigger where tgisinternal`
  )
  expect(n).toBeGreaterThan(0)
  expect(await searchTriggers(db, 'ri_constraint')).toEqual([])
  expect(await searchTriggers(db, 'authors')).toEqual([])
})

withTestDatabase('treats LIKE wildcards in trigger searches literally', async (db) => {
  await db.executeQuery(`
    ${TRIGGER_FN}
    create table public.posts (id int);
    create trigger set_slug before insert on public.posts for each row execute function public.noop();
    create trigger setxslug before insert on public.posts for each row execute function public.noop();
  `)

  expect(await searchTriggers(db, 'set_slug')).toEqual(['public.posts: set_slug (BEFORE INSERT)'])
  expect(await searchTriggers(db, '%')).toEqual([])
})

withTestDatabase('caps the number of triggers', async (db) => {
  await db.executeQuery(`
    ${TRIGGER_FN}
    create table public.posts (id int);
    create trigger cap_a before insert on public.posts for each row execute function public.noop();
    create trigger cap_b before insert on public.posts for each row execute function public.noop();
    create trigger cap_c before insert on public.posts for each row execute function public.noop();
  `)

  expect(await searchTriggers(db, 'cap_', { limit: 2 })).toEqual([
    'public.posts: cap_a (BEFORE INSERT)',
    'public.posts: cap_b (BEFORE INSERT)',
  ])
})

const searchTriggerRows = async (
  db: Awaited<ReturnType<typeof createTestDatabase>>,
  query: string,
  options?: { limit?: number }
) => {
  const [row] = await db.executeQuery<SearchEntitiesResult[]>(
    getSearchEntitiesSql({ query, ...options })
  )
  return row.triggers.map((t) => ({ name: t.name, matchedFunction: t.matched_function }))
}

withTestDatabase('finds triggers that run a function matching the search', async (db) => {
  await db.executeQuery(`
    create function public.handle_new_user() returns trigger language plpgsql as 'begin return new; end';
    create function public.set_slug() returns trigger language plpgsql as 'begin return new; end';
    create table public.authors (id int);
    create trigger on_author_created after insert on public.authors for each row execute function public.handle_new_user();
    create trigger fill_slug before insert on public.authors for each row execute function public.set_slug();
  `)

  // Neither the trigger name nor its table matches, only the function it runs
  expect(await searchTriggerRows(db, 'handle_new_user')).toEqual([
    { name: 'on_author_created', matchedFunction: 'handle_new_user' },
  ])
})

withTestDatabase('lists name matches before triggers found through their function', async (db) => {
  await db.executeQuery(`
    create function public.sync_rows() returns trigger language plpgsql as 'begin return new; end';
    create table public.authors (id int);
    create trigger zz_one after insert on public.authors for each row execute function public.sync_rows();
    create trigger zz_two after update on public.authors for each row execute function public.sync_rows();
    create trigger sync_rows_audit after delete on public.authors for each row execute function public.sync_rows();
  `)

  expect(await searchTriggerRows(db, 'sync_rows')).toEqual([
    // Matched by its own name, so it doesn't claim to have matched through the function
    { name: 'sync_rows_audit', matchedFunction: null },
    { name: 'zz_one', matchedFunction: 'sync_rows' },
    { name: 'zz_two', matchedFunction: 'sync_rows' },
  ])
})

withTestDatabase('does not find triggers through extension or system functions', async (db) => {
  await db.executeQuery(`
    create schema ext;
    create extension pgcrypto schema ext;
    create table public.authors (id int primary key);
    create table public.posts (id int, author_id int references public.authors (id));
  `)

  // Foreign keys run RI_FKey_* functions from pg_catalog, and pgcrypto has its own
  expect(await searchTriggerRows(db, 'ri_fkey')).toEqual([])
  expect(await searchTriggerRows(db, 'crypt')).toEqual([])
})

withTestDatabase('caps triggers found through a function', async (db) => {
  await db.executeQuery(`
    create function public.touch_row() returns trigger language plpgsql as 'begin return new; end';
    create table public.authors (id int);
    create trigger t_a before insert on public.authors for each row execute function public.touch_row();
    create trigger t_b before update on public.authors for each row execute function public.touch_row();
    create trigger t_c before delete on public.authors for each row execute function public.touch_row();
  `)

  expect(await searchTriggerRows(db, 'touch_row', { limit: 2 })).toHaveLength(2)
})
