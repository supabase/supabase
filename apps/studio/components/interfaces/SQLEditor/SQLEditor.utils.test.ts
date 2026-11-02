import { safeSql, untrustedSql } from '@supabase/pg-meta'
import { stripIndent } from 'common-tags'
import { describe, expect, it, test } from 'vitest'

import { sqlAiDisclaimerComment, untitledSnippetTitle } from './SQLEditor.constants'
import { DiffType, type IStandaloneCodeEditor } from './SQLEditor.types'
import {
  analyzeQueryIssues,
  appendEnableRLSStatements,
  assembleCompletionDiff,
  buildCompletionRequestBody,
  buildDebugChatArgs,
  buildDebugPromptText,
  buildExecuteParams,
  checkAlterDatabaseConnection,
  checkDestructiveQuery,
  computeErrorHighlightLine,
  createSqlSnippetSkeletonV2,
  deriveSnippetIdentity,
  extractDebugContext,
  filterTablesCoveredByEnsureRLSTrigger,
  getCreateTablesMissingRLS,
  getEditorSql,
  hasActiveEnsureRLSTrigger,
  hasBlockingIssues,
  isUpdateWithoutWhere,
  planDiffRequestApplication,
  resolveConnectionString,
  resolveDiffKeyAction,
  shouldAutoGenerateTitle,
  sqlSourceToDialect,
} from './SQLEditor.utils'
import type { DatabaseEventTrigger } from '@/data/database-event-triggers/database-event-triggers-query'
import type { Database } from '@/data/read-replicas/replicas-query'
import { createRoleImpersonationState } from '@/state/role-impersonation-state'

const buildTrigger = (overrides: Partial<DatabaseEventTrigger> = {}): DatabaseEventTrigger => ({
  oid: 1,
  name: 'ensure_rls',
  event: 'ddl_command_end',
  enabled_mode: 'ORIGIN',
  tags: ['CREATE TABLE'],
  function_name: 'rls_auto_enable',
  function_schema: 'public',
  owner: 'postgres',
  function_definition: null,
  ...overrides,
})

describe('SQLEditor.utils.ts:shouldAutoGenerateTitle', () => {
  const base = {
    aiOptInLevel: 'default',
    snippetName: `${untitledSnippetTitle} 1`,
    isPlatform: true,
  } as const

  test.each([
    ['AI is enabled, the name is still the placeholder, and on platform', {}, true],
    ['AI opt-in is disabled', { aiOptInLevel: 'disabled' }, false],
    ['the snippet already has a custom name', { snippetName: 'My saved query' }, false],
    ['not running on the hosted platform', { isPlatform: false }, false],
    ['the snippet name is undefined', { snippetName: undefined }, false],
  ] as const)('when %s -> %s', (_, overrides, expected) => {
    expect(shouldAutoGenerateTitle({ ...base, ...overrides })).toBe(expected)
  })
})

describe('SQLEditor.utils.ts:buildExecuteParams', () => {
  const impersonatedRoleState = createRoleImpersonationState('default', {
    current: async () => ({}),
  })
  const base = {
    limit: 100,
    connectionString: 'postgresql://example',
    projectRef: 'default',
    impersonatedRoleState,
  }

  test('applies the auto-limit suffix when appropriate', () => {
    const params = buildExecuteParams({ ...base, sql: safeSql`select * from countries` })
    expect(params.sql).toBe('select * from countries limit 100;')
    expect(params.autoLimit).toBe(100)
  })
  test('leaves autoLimit undefined when a limit is already present', () => {
    const params = buildExecuteParams({ ...base, sql: safeSql`select * from countries limit 10;` })
    expect(params.sql).toBe('select * from countries limit 10;')
    expect(params.autoLimit).toBeUndefined()
  })
  test('reflects isRoleImpersonationEnabled from the impersonation state', () => {
    const params = buildExecuteParams({ ...base, limit: 0, sql: safeSql`select * from countries` })
    expect(params.isRoleImpersonationEnabled).toBe(false)
    expect(params.isStatementTimeoutDisabled).toBe(true)
    expect(params.contextualInvalidation).toBe(true)
  })
})

type SnippetsMap = Record<string, { snippet: { content?: unknown } }>

describe('SQLEditor.utils.ts:deriveSnippetIdentity', () => {
  const loaded = { snippet: { content: { some: 'content' } } }
  const noContent = { snippet: { content: undefined } }

  test.each<
    [string, string | undefined, SnippetsMap | undefined, { id: string; isLoading: boolean }]
  >([
    ['no url id, generated id not in map', undefined, {}, { id: 'generated-id', isLoading: true }],
    [
      'no url id, generated id in map',
      undefined,
      { 'generated-id': loaded },
      { id: 'generated-id', isLoading: false },
    ],
    [
      'url id "new" is never loading',
      'new',
      { 'generated-id': noContent },
      { id: 'generated-id', isLoading: false },
    ],
    ['url id not yet in the store', 'existing-id', {}, { id: 'existing-id', isLoading: true }],
    [
      'url id with no content yet',
      'existing-id',
      { 'existing-id': noContent },
      { id: 'existing-id', isLoading: true },
    ],
    [
      'url id with content',
      'existing-id',
      { 'existing-id': loaded },
      { id: 'existing-id', isLoading: false },
    ],
    ['snippets map missing', 'existing-id', undefined, { id: 'existing-id', isLoading: true }],
    [
      'entry has no snippet',
      'existing-id',
      { 'existing-id': {} as SnippetsMap[string] },
      { id: 'existing-id', isLoading: true },
    ],
  ])('%s', (_, urlId, snippets, expected) => {
    expect(
      deriveSnippetIdentity({
        urlId,
        generatedId: 'generated-id',
        snippets: snippets as SnippetsMap,
      })
    ).toEqual(expected)
  })
})

const buildDebugSnippet = (uncheckedSql: string) => ({
  snippet: { content: { unchecked_sql: untrustedSql(uncheckedSql) } },
})

describe('SQLEditor.utils.ts:extractDebugContext', () => {
  test('strips the AI disclaimer comment and trims the sql', () => {
    const snippet = buildDebugSnippet(`${sqlAiDisclaimerComment}\n\nselect 1;`)
    const result = { error: { message: 'relation does not exist' } }
    expect(extractDebugContext(snippet, result)).toEqual({
      sql: 'select 1;',
      errorMessage: 'relation does not exist',
    })
  })
  test.each([
    ['the snippet is undefined', undefined],
    ['the snippet has no content yet', { snippet: { content: undefined } }],
  ])('falls back to an empty sql when %s', (_, snippet) => {
    expect(extractDebugContext(snippet, { error: { message: 'boom' } })).toEqual({
      sql: '',
      errorMessage: 'boom',
    })
  })
  test.each([
    ['the result is undefined', undefined],
    ['the result has no error message', {}],
  ])('falls back to "Unknown error" when %s', (_, result) => {
    expect(extractDebugContext(buildDebugSnippet('select 1;'), result)).toEqual({
      sql: 'select 1;',
      errorMessage: 'Unknown error',
    })
  })
})

describe('SQLEditor.utils.ts:buildDebugChatArgs', () => {
  test('builds the newChat payload from the snippet sql and error message', () => {
    const snippet = buildDebugSnippet('select 1;')
    const result = { error: { message: 'relation does not exist' } }
    expect(buildDebugChatArgs(snippet, result, 'database')).toEqual({
      name: 'Debug SQL snippet',
      sqlSnippets: [{ label: 'Current Query', content: 'select 1;', source: 'database' }],
      initialInput:
        'Help me to debug the attached sql snippet which gives the following error: \n\nrelation does not exist',
    })
  })

  // The attachment is what puts sqlSource on the message the user then submits, so
  // the debug flow has to attach a sourced snippet, not a bare string.
  test('attaches the query with its source and names the dialect', () => {
    const snippet = buildDebugSnippet('select count(*) from logs;')
    const result = { error: { message: 'Unknown expression identifier' } }
    const args = buildDebugChatArgs(snippet, result, 'logs')
    expect(args.sqlSnippets).toEqual([
      { label: 'Current Query', content: 'select count(*) from logs;', source: 'logs' },
    ])
    expect(args.initialInput).toContain('Unknown expression identifier')
    expect(args.initialInput).toContain('ClickHouse')
    expect(args.initialInput).toContain('not Postgres')
  })
})

describe('SQLEditor.utils.ts:buildCompletionRequestBody', () => {
  const base = { projectRef: 'default', connectionString: 'postgresql://example', orgSlug: 'acme' }

  test('builds the base request body and merges options on top', () => {
    expect(buildCompletionRequestBody(base)).toEqual({ ...base, language: 'sql' })
    expect(
      buildCompletionRequestBody({
        ...base,
        options: { completionMetadata: { prompt: 'add a where clause' } },
      })
    ).toEqual({
      ...base,
      language: 'sql',
      completionMetadata: { prompt: 'add a where clause' },
    })
  })
  test('omits dialect when not provided, so the route keeps its Postgres default', () => {
    expect(buildCompletionRequestBody(base)).not.toHaveProperty('dialect')
    expect(buildCompletionRequestBody({ ...base, dialect: 'clickhouse' }).dialect).toBe(
      'clickhouse'
    )
  })
})

describe('SQLEditor.utils.ts:sqlSourceToDialect', () => {
  test('logs snippets get ClickHouse, database snippets get Postgres', () => {
    expect(sqlSourceToDialect('logs')).toBe('clickhouse')
    expect(sqlSourceToDialect('database')).toBe('postgres')
  })
})

describe('SQLEditor.utils.ts:createSqlSnippetSkeletonV2', () => {
  const baseArgs = { name: 'Untitled', sql: 'select 1', owner_id: 1, project_id: 1 }

  test.each([
    ['defaults to a database (sql) snippet', undefined, 'sql'],
    ['builds a database snippet for source "database"', 'database', 'sql'],
    ['builds a logs (log_sql) snippet for source "logs"', 'logs', 'log_sql'],
  ] as const)('%s', (_, source, type) => {
    const snippet = createSqlSnippetSkeletonV2({ ...baseArgs, source, idOverride: 'snippet-id' })
    expect(snippet.type).toBe(type)
    expect(snippet.status).toBe('new')
    expect(snippet.content?.unchecked_sql).toBe('select 1')
    expect(snippet.content?.content_id).toBe('snippet-id')
  })
})

describe('SQLEditor.utils.ts:planDiffRequestApplication', () => {
  test('replaces the editor content when it is empty', () => {
    const plan = planDiffRequestApplication({
      existingValue: '',
      request: { diffType: DiffType.Modification, sql: 'select 1;' },
    })
    expect(plan).toEqual({ kind: 'replace', text: 'select 1;' })
  })
  test.each([DiffType.Modification, DiffType.NewSnippet])(
    'opens a %s diff against the existing content when it is not empty',
    (diffType) => {
      const plan = planDiffRequestApplication({
        existingValue: 'select 0;',
        request: { diffType, sql: 'select 1;' },
      })
      expect(plan).toEqual({
        kind: 'diff',
        diff: { original: 'select 0;', modified: 'select 1;' },
        diffType,
      })
    }
  )
})

describe('SQLEditor.utils.ts:resolveDiffKeyAction', () => {
  type KeyEvent = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey'>
  type Ctx = Parameters<typeof resolveDiffKeyAction>[1]
  const diffOpen: Ctx = { isDiffOpen: true, isPromptOpen: false, os: 'macos' }
  const promptOpen: Ctx = { isDiffOpen: false, isPromptOpen: true, os: 'macos' }
  const key = (k: string, mods: Partial<KeyEvent> = {}): KeyEvent => ({
    key: k,
    metaKey: false,
    ctrlKey: false,
    ...mods,
  })

  test.each<[string, KeyEvent, Ctx, ReturnType<typeof resolveDiffKeyAction>]>([
    [
      'nothing when neither a diff nor the prompt is open',
      key('Escape'),
      { ...diffOpen, isDiffOpen: false },
      { type: 'none' },
    ],
    ['nothing for keys other than Enter/Escape', key('a'), diffOpen, { type: 'none' }],
    ['accept on Cmd+Enter on macOS', key('Enter', { metaKey: true }), diffOpen, { type: 'accept' }],
    [
      'accept on Ctrl+Enter on Windows',
      key('Enter', { ctrlKey: true }),
      { ...diffOpen, os: 'windows' },
      { type: 'accept' },
    ],
    [
      'nothing on Ctrl+Enter on macOS (wrong modifier)',
      key('Enter', { ctrlKey: true }),
      diffOpen,
      { type: 'none' },
    ],
    ['nothing on Enter without a modifier', key('Enter'), diffOpen, { type: 'none' }],
    [
      'nothing on Cmd+Enter when only the prompt is open',
      key('Enter', { metaKey: true }),
      promptOpen,
      { type: 'none' },
    ],
    [
      'escape and discard when a diff is open',
      key('Escape'),
      diffOpen,
      { type: 'escape', shouldDiscard: true },
    ],
    [
      'escape without discard when only the prompt is open',
      key('Escape'),
      promptOpen,
      { type: 'escape', shouldDiscard: false },
    ],
  ])('%s', (_, event, ctx, expected) => {
    expect(resolveDiffKeyAction(event, ctx)).toEqual(expected)
  })
})

describe('SQLEditor.utils.ts:checkDestructiveQuery', () => {
  const doBlock = (body: string) => `DO $$\nBEGIN\n  ${body}\nEND\n$$;`

  test.each([
    'drop table films, distributors;',
    'truncate films;',
    "delete from films where kind <> 'Musical';",
    "DELETE FROM films WHERE kind <> 'Musical';",
    "select * from films;\n\ndelete from films where kind <> 'Musical';",
    "delete from countries; update countries set name = 'hello';",
    'ALTER TABLE test DROP COLUMN test;',
    'TRUNCATE TABLE test;',
  ])('flags plain destructive statement: %s', (sql) => {
    expect(checkDestructiveQuery(sql)).toBe(true)
  })

  test.each([
    // string literal / format / concatenation
    `EXECUTE 'DROP TABLE users';`,
    `EXECUTE 'DELETE FROM users';`,
    `EXECUTE 'TRUNCATE TABLE users';`,
    `EXECUTE format('DROP TABLE %I', table_name);`,
    `EXECUTE format('DELETE FROM %I', table_name);`,
    `EXECUTE format('TRUNCATE TABLE %I', table_name);`,
    `EXECUTE 'DROP TABLE ' || table_name;`,
    `EXECUTE 'DELETE FROM ' || table_name;`,
    `execute 'drop table users';`,
    `EXECUTE Format('DROP TABLE users');`,
    // EXECUTE IMMEDIATE / OPEN cursor / RETURN QUERY
    `EXECUTE IMMEDIATE 'DROP TABLE users';`,
    `EXECUTE IMMEDIATE 'DELETE FROM users';`,
    `EXECUTE IMMEDIATE 'TRUNCATE TABLE users';`,
    `OPEN ref FOR EXECUTE 'DROP TABLE users';`,
    `OPEN ref FOR EXECUTE format('DELETE FROM %I', tbl);`,
    `OPEN ref FOR EXECUTE 'TRUNCATE TABLE ' || tbl;`,
    `RETURN QUERY EXECUTE 'DROP TABLE users';`,
    `RETURN QUERY EXECUTE format('DELETE FROM %I', tbl);`,
    // dollar-quoted, concat, E-strings
    `EXECUTE $sql$DROP TABLE users$sql$;`,
    `EXECUTE $body$TRUNCATE TABLE logs$body$;`,
    `EXECUTE concat('DROP TABLE ', 'users');`,
    `EXECUTE concat_ws(' ', 'DELETE FROM', 'users');`,
    `EXECUTE E'DROP TABLE users';`,
    // ALTER TABLE ... DROP COLUMN through every dynamic form
    `EXECUTE 'ALTER TABLE users DROP COLUMN email';`,
    `EXECUTE format('ALTER TABLE %I DROP COLUMN %I', 'users', 'email');`,
    `EXECUTE IMMEDIATE 'ALTER TABLE users DROP COLUMN email';`,
    `OPEN ref FOR EXECUTE 'ALTER TABLE users DROP COLUMN email';`,
    `RETURN QUERY EXECUTE 'ALTER TABLE users DROP COLUMN email';`,
    `EXECUTE $sql$ALTER TABLE users DROP COLUMN email$sql$;`,
    `EXECUTE concat('ALTER TABLE ', 'users DROP COLUMN email');`,
    // DO blocks
    doBlock(`EXECUTE 'DROP TABLE users';`),
    doBlock(`EXECUTE 'ALTER TABLE users DROP COLUMN email';`),
    stripIndent`
      DO $$
      BEGIN
        FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
          EXECUTE format('DROP TABLE %I', rec.tablename);
        END LOOP;
      END
      $$;
    `,
    stripIndent`
      DO $$
      DECLARE
        func_name text;
      BEGIN
        FOR func_name IN
          SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'
        LOOP
          EXECUTE format('DROP FUNCTION %I', func_name);
        END LOOP;
      END
      $$;
    `,
  ])('flags destructive dynamic SQL: %s', (sql) => {
    expect(checkDestructiveQuery(sql)).toBe(true)
  })

  test.each([
    stripIndent`
      create policy "Users can delete their own files"
      on storage.objects for delete to authenticated using (
        bucket id = 'files' and (select auth.uid()) = owner
      );
    `,
    '-- Going to drop this in here, might delete later\nselect * from films;',
    `EXECUTE 'SELECT * FROM users';`,
    `EXECUTE 'INSERT INTO users (name) VALUES (''test'')';`,
    `EXECUTE 'UPDATE users SET name = ''test'' WHERE id = 1';`,
    `EXECUTE 'ALTER TABLE users ADD COLUMN email text';`,
    `sql := 'SELECT * FROM users';`,
    `OPEN ref FOR EXECUTE 'SELECT * FROM users';`,
    `RETURN QUERY EXECUTE 'SELECT * FROM users';`,
  ])('does not flag: %s', (sql) => {
    expect(checkDestructiveQuery(sql)).toBe(false)
  })
})

describe('SQLEditor.utils:isUpdateWithoutWhere', () => {
  test.each([
    `UPDATE public.countries SET name = 'New Name';`,
    `UPDATE "public"."countries" SET name = 'New Name';`,
    `UPDATE "messages" SET id = 1;`,
    `UPDATE "public".messages SET id = 1;`,
    `UPDATE public."messages" SET id = 1;`,
    `UPDATE "my table" SET id = 1;`,
    `UPDATE "weird""name" SET id = 1;`,
    // the word "where" inside an identifier or string literal is not a where clause
    `UPDATE "where table" SET id = 1;`,
    `UPDATE messages SET name = 'where x';`,
    `delete from countries; update countries set name = 'hello';`,
  ])('flags update without a where clause: %s', (sql) => {
    expect(isUpdateWithoutWhere(sql)).toBe(true)
  })

  test.each([
    `UPDATE public.countries SET name = 'New Name' WHERE id = 1;`,
    `UPDATE "public"."countries" SET name = 'New Name' WHERE id = 1;`,
    `UPDATE "messages" SET id = 1 WHERE id = 2;`,
    `UPDATE messages SET name = 'where x' WHERE id = 1;`,
  ])('does not flag update with a where clause: %s', (sql) => {
    expect(isUpdateWithoutWhere(sql)).toBe(false)
  })
})

describe('SQLEditor.utils:getCreateTablesMissingRLS', () => {
  it('flags a basic CREATE TABLE without RLS', () => {
    const result = getCreateTablesMissingRLS('create table foo (id int8 primary key);')
    expect(result).toEqual([{ schema: undefined, tableName: 'foo' }])
  })

  it('flags CREATE TABLE IF NOT EXISTS', () => {
    const result = getCreateTablesMissingRLS(
      'create table if not exists foo (id int8 primary key);'
    )
    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('foo')
  })

  it('flags schema-qualified CREATE TABLE', () => {
    const result = getCreateTablesMissingRLS('create table public.foo (id int8 primary key);')
    expect(result).toEqual([{ schema: 'public', tableName: 'foo' }])
  })

  it('flags quoted identifiers', () => {
    const result = getCreateTablesMissingRLS(
      'create table "public"."user_table" (id int8 primary key);'
    )
    expect(result).toEqual([{ schema: 'public', tableName: 'user_table' }])
  })

  it('flags quoted identifiers containing spaces', () => {
    const result = getCreateTablesMissingRLS(
      'create table "public"."My Table" (id int8 primary key);'
    )
    expect(result).toEqual([{ schema: 'public', tableName: 'My Table' }])
  })

  it('matches RLS to a table whose name contains spaces', () => {
    const sql = stripIndent`
      create table "My Table" (id int8 primary key);
      alter table "My Table" enable row level security;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('does not flag when ENABLE ROW LEVEL SECURITY is in the same SQL', () => {
    const sql = stripIndent`
      create table foo (id int8 primary key);
      alter table foo enable row level security;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('does not flag when ENABLE RLS shorthand is in the same SQL', () => {
    const sql = stripIndent`
      create table foo (id int8 primary key);
      alter table foo enable rls;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('matches RLS to the right table when multiple tables created', () => {
    const sql = stripIndent`
      create table foo (id int8 primary key);
      create table bar (id int8 primary key);
      alter table foo enable row level security;
    `
    const result = getCreateTablesMissingRLS(sql)
    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('bar')
  })

  it('does not flag when CREATE TABLE is inside a comment', () => {
    const sql = stripIndent`
      -- create table foo (id int8 primary key);
      select 1;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('does not flag when there is no CREATE TABLE at all', () => {
    expect(getCreateTablesMissingRLS('select * from foo;')).toEqual([])
  })

  it('schema-qualified RLS matches schema-qualified CREATE', () => {
    const sql = stripIndent`
      create table public.foo (id int8 primary key);
      alter table public.foo enable row level security;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('does not flag when ALTER TABLE IF EXISTS enables RLS', () => {
    const sql = stripIndent`
      CREATE TABLE IF NOT EXISTS public."Conversations" (id int8 primary key);
      ALTER TABLE IF EXISTS public."Conversations" ENABLE ROW LEVEL SECURITY;
      GRANT ALL ON TABLE public."Conversations" TO postgres, anon, authenticated, service_role;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('flags CREATE TEMP TABLE', () => {
    const result = getCreateTablesMissingRLS('create temp table foo (id int8 primary key);')
    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('foo')
  })

  it('does not flag `select ... into var` inside a plpgsql function body', () => {
    // Regression: the SELECT..INTO detector used to match variable assignments
    // inside $$...$$ function bodies and surface them as \"new tables\".
    const sql = stripIndent`
      create or replace function schema_checks()
      returns jsonb
      language plpgsql
      as $$
      declare
        ret jsonb;
      begin
        select jsonb_build_object('value', 'ok')
        into ret;
        return ret;
      end;
      $$;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('does not flag `select ... into var` inside a DO block', () => {
    const sql = stripIndent`
      do $$
      declare
        result int;
      begin
        select count(*) into result from information_schema.tables;
      end
      $$;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('does not flag CREATE TABLE text that appears inside a function body', () => {
    const sql = stripIndent`
      create or replace function noop()
      returns void
      language plpgsql
      as $$
      begin
        -- create table foo (id int);
        perform 1;
      end;
      $$;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('flags top-level CREATE TABLE alongside a function with INTO assignments', () => {
    const sql = stripIndent`
      create table public.foo (id int8 primary key);
      create or replace function bar()
      returns int
      language plpgsql
      as $$
      declare
        v int;
      begin
        select 1 into v;
        return v;
      end;
      $$;
    `
    const result = getCreateTablesMissingRLS(sql)
    expect(result).toEqual([{ schema: 'public', tableName: 'foo' }])
  })

  it('does not flag CREATE TABLE inside nested dollar-quoted dynamic SQL', () => {
    // Regression: the `$sql$...$sql$` block inside the outer `$fn$...$fn$`
    // body was previously pairing with the outer tag, letting the inner
    // semicolon split the statement and exposing `create table fake` to the
    // RLS warning.
    const sql = stripIndent`
      create function f()
      returns void
      language plpgsql
      as $fn$
      begin
        execute $sql$create table fake(id int);$sql$;
      end;
      $fn$;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('handles custom dollar-quote tags (e.g. $body$...$body$)', () => {
    const sql = stripIndent`
      create or replace function f()
      returns int
      language plpgsql
      as $body$
      declare
        v int;
      begin
        select 1 into v;
        return v;
      end;
      $body$;
    `
    expect(getCreateTablesMissingRLS(sql)).toEqual([])
  })

  it('does not collide quoted identifiers that differ only by case', () => {
    // "MyTable" and "mytable" are distinct tables in Postgres, so the ALTER
    // here targets a different table than the CREATE — the warning must fire.
    const sql = stripIndent`
      create table "MyTable" (id int8 primary key);
      alter table "mytable" enable row level security;
    `
    const result = getCreateTablesMissingRLS(sql)
    expect(result).toHaveLength(1)
    expect(result[0].tableName).toBe('MyTable')
  })
})

describe('SQLEditor.utils:appendEnableRLSStatements', () => {
  it('appends a single ALTER TABLE ENABLE RLS statement', () => {
    const result = appendEnableRLSStatements('create table foo (id int8 primary key);', [
      { tableName: 'foo' },
    ])
    expect(result).toContain('ALTER TABLE foo ENABLE ROW LEVEL SECURITY;')
  })

  it('appends one ALTER per table', () => {
    const result = appendEnableRLSStatements(
      'create table foo (id int8); create table bar (id int8);',
      [{ tableName: 'foo' }, { tableName: 'bar' }]
    )
    expect(result).toContain('ALTER TABLE foo ENABLE ROW LEVEL SECURITY;')
    expect(result).toContain('ALTER TABLE bar ENABLE ROW LEVEL SECURITY;')
  })

  it('schema-qualifies the table when schema is provided', () => {
    const result = appendEnableRLSStatements('create table public.foo (id int8);', [
      { schema: 'public', tableName: 'foo' },
    ])
    expect(result).toContain('ALTER TABLE public.foo ENABLE ROW LEVEL SECURITY;')
  })

  it('quotes identifiers that are not simple', () => {
    const result = appendEnableRLSStatements('create table "My Table" (id int8);', [
      { tableName: 'My Table' },
    ])
    expect(result).toContain('ALTER TABLE "My Table" ENABLE ROW LEVEL SECURITY;')
  })

  it('quotes mixed-case identifiers so Postgres does not fold them to lowercase', () => {
    const result = appendEnableRLSStatements('create table "MyTable" (id int8);', [
      { tableName: 'MyTable' },
    ])
    expect(result).toContain('ALTER TABLE "MyTable" ENABLE ROW LEVEL SECURITY;')
  })

  it('quotes mixed-case schema and table identifiers', () => {
    const result = appendEnableRLSStatements('create table "MySchema"."MyTable" (id int8);', [
      { schema: 'MySchema', tableName: 'MyTable' },
    ])
    expect(result).toContain('ALTER TABLE "MySchema"."MyTable" ENABLE ROW LEVEL SECURITY;')
  })

  it('returns the original SQL unchanged when there are no tables', () => {
    const sql = 'select 1;'
    expect(appendEnableRLSStatements(sql, [])).toBe(sql)
  })

  it('puts the terminator on its own line when SQL ends with a line comment', () => {
    // Without this, the appended ';' would be swallowed by the line comment and
    // the following ALTER TABLE would be parsed as part of the CREATE TABLE.
    const sql = stripIndent`
      create table foo (id int)
      -- forgot the semicolon
    `
    const result = appendEnableRLSStatements(sql, [{ tableName: 'foo' }])
    expect(result).toMatch(/-- forgot the semicolon\n;\n/)
    expect(result).toContain('ALTER TABLE foo ENABLE ROW LEVEL SECURITY;')
  })
})

describe('SQLEditor.utils:hasActiveEnsureRLSTrigger', () => {
  test.each<[string, DatabaseEventTrigger[] | undefined, boolean]>([
    ['undefined triggers', undefined, false],
    ['an empty list', [], false],
    ['an active "ensure_rls" trigger', [buildTrigger()], true],
    [
      'a renamed trigger using rls_auto_enable',
      [buildTrigger({ name: 'something_else', function_name: 'rls_auto_enable' })],
      true,
    ],
    ['a DISABLED matching trigger', [buildTrigger({ enabled_mode: 'DISABLED' })], false],
    [
      'unrelated triggers',
      [buildTrigger({ name: 'audit_log', function_name: 'log_changes' })],
      false,
    ],
  ])('%s -> %s', (_, triggers, expected) => {
    expect(hasActiveEnsureRLSTrigger(triggers)).toBe(expected)
  })
})

describe('SQLEditor.utils:filterTablesCoveredByEnsureRLSTrigger', () => {
  it('returns the input unchanged when the trigger is not present', () => {
    const tables = [{ tableName: 'foo' }, { schema: 'private', tableName: 'bar' }]
    expect(filterTablesCoveredByEnsureRLSTrigger(tables, false)).toEqual(tables)
  })

  it('drops public-schema tables when the trigger is present', () => {
    const tables = [
      { schema: 'public', tableName: 'foo' },
      { tableName: 'bar' }, // no schema → defaults to public
    ]
    expect(filterTablesCoveredByEnsureRLSTrigger(tables, true)).toEqual([])
  })

  it('keeps tables in non-public schemas when the trigger is present', () => {
    const tables = [
      { schema: 'public', tableName: 'foo' },
      { schema: 'private', tableName: 'bar' },
      { schema: 'app', tableName: 'baz' },
    ]
    expect(filterTablesCoveredByEnsureRLSTrigger(tables, true)).toEqual([
      { schema: 'private', tableName: 'bar' },
      { schema: 'app', tableName: 'baz' },
    ])
  })

  it('matches the public schema case-insensitively', () => {
    const tables = [{ schema: 'PUBLIC', tableName: 'foo' }]
    expect(filterTablesCoveredByEnsureRLSTrigger(tables, true)).toEqual([])
  })
})

describe('SQLEditor.utils:checkAlterDatabaseConnection', () => {
  test.each([
    'alter database postgres connection limit 0;',
    'alter database postgres allow_connections false;',
    'ALTER DATABASE postgres CONNECTION LIMIT 0;',
    'select * from countries;\nalter database postgres connection limit 0;',
  ])('detects: %s', (sql) => {
    expect(checkAlterDatabaseConnection(sql)).toBe(true)
  })

  test.each([
    'alter database postgres set statement_timeout = 60000;',
    'select * from countries;',
    '-- alter database postgres connection limit 0;\nselect 1;',
  ])('does not flag: %s', (sql) => {
    expect(checkAlterDatabaseConnection(sql)).toBe(false)
  })
})

// Minimal fake editor for exercising getEditorSql's selection/value logic.
const makeEditor = ({
  value,
  selectionValue,
  hasSelection = selectionValue !== undefined,
}: {
  value: string | undefined
  selectionValue?: string
  hasSelection?: boolean
}): IStandaloneCodeEditor =>
  ({
    getValue: () => value,
    getSelection: () => (hasSelection ? { startLineNumber: 1 } : null),
    getModel: () => ({ getValueInRange: () => selectionValue }),
  }) as unknown as IStandaloneCodeEditor

describe('SQLEditor.utils:getEditorSql', () => {
  it('returns the selected text when there is a selection', () => {
    const editor = makeEditor({ value: 'select 1;', selectionValue: 'select 2;' })
    expect(getEditorSql(editor)).toBe('select 2;')
  })

  it('returns the full editor value when there is no selection', () => {
    const editor = makeEditor({ value: 'select 1;', hasSelection: false })
    expect(getEditorSql(editor)).toBe('select 1;')
  })

  it('falls back to the full value when the selection is empty', () => {
    const editor = makeEditor({ value: 'select 1;', selectionValue: '' })
    expect(getEditorSql(editor)).toBe('select 1;')
  })

  it('falls back to snippet content only when there is no editor value', () => {
    // Real Monaco always returns a string from getValue(); this guards the
    // last-resort snippet-content fallback contract.
    const editor = makeEditor({ value: undefined, hasSelection: false })
    expect(getEditorSql(editor, untrustedSql('stored sql'))).toBe('stored sql')
  })
})

describe('SQLEditor.utils:computeErrorHighlightLine', () => {
  it('parses the LINE marker and offsets by the selection start line', () => {
    const error = { formattedError: 'ERROR:  syntax error\nLINE 3: slect 1;\n        ^' }
    expect(computeErrorHighlightLine(error, 0)).toBe(3)
    expect(computeErrorHighlightLine(error, 5)).toBe(8)
  })

  it('returns NaN when there is no LINE marker', () => {
    expect(computeErrorHighlightLine({ formattedError: 'boom' }, 0)).toBeNaN()
  })

  it('returns NaN when formattedError is missing', () => {
    expect(computeErrorHighlightLine({}, 2)).toBeNaN()
  })
})

describe('SQLEditor.utils:assembleCompletionDiff', () => {
  it('assembles original and modified from before/selection/after', () => {
    const result = assembleCompletionDiff(
      { textBeforeCursor: 'a ', selection: 'b', textAfterCursor: ' c' },
      'X'
    )
    expect(result).toEqual({ original: 'a b c', modified: 'a X c' })
  })

  it('treats missing metadata fields as empty strings', () => {
    expect(assembleCompletionDiff({}, 'X')).toEqual({ original: '', modified: 'X' })
  })
})

describe('SQLEditor.utils:buildDebugPromptText', () => {
  it('builds the debug prompt with the error message and SQL block', () => {
    const result = buildDebugPromptText('select 1;', 'relation does not exist', 'database')
    expect(result).toContain('relation does not exist')
    expect(result).toContain('```sql\nselect 1;\n```')
    expect(result).not.toContain('ClickHouse')
  })

  // This text is copyable and gets pasted into external models, so it has to name
  // the dialect itself rather than relying on the message metadata.
  it('names the dialect for a logs snippet', () => {
    const sql = "select count() from logs where source = 'edge_logs'"
    const result = buildDebugPromptText(sql, 'Unknown expression identifier', 'logs')
    expect(result).toContain('Unknown expression identifier')
    expect(result).toContain('ClickHouse')
    expect(result).toContain('not Postgres')
    expect(result).toContain('```clickhouse\n' + sql + '\n```')
  })
})

describe('SQLEditor.utils:analyzeQueryIssues', () => {
  it('flags a destructive query with no event triggers', () => {
    expect(analyzeQueryIssues('drop table countries;', undefined)).toEqual({
      hasDestructiveOperations: true,
      hasUpdateWithoutWhere: false,
      hasAlterDatabasePreventConnection: false,
      createTablesMissingRLS: [],
    })
  })

  it('filters out a CREATE TABLE covered by an active ensure_rls trigger', () => {
    const result = analyzeQueryIssues('create table foo (id int);', [buildTrigger()])
    expect(result.createTablesMissingRLS).toEqual([])
  })

  it('reports no issues for a clean select query', () => {
    expect(analyzeQueryIssues('select * from countries;', undefined)).toEqual({
      hasDestructiveOperations: false,
      hasUpdateWithoutWhere: false,
      hasAlterDatabasePreventConnection: false,
      createTablesMissingRLS: [],
    })
  })
})

describe('SQLEditor.utils:hasBlockingIssues', () => {
  const noIssues = {
    hasDestructiveOperations: false,
    hasUpdateWithoutWhere: false,
    hasAlterDatabasePreventConnection: false,
    createTablesMissingRLS: [],
  }

  test.each([
    ['no issues', {}, false],
    ['hasDestructiveOperations', { hasDestructiveOperations: true }, true],
    ['hasUpdateWithoutWhere', { hasUpdateWithoutWhere: true }, true],
    ['hasAlterDatabasePreventConnection', { hasAlterDatabasePreventConnection: true }, true],
    ['createTablesMissingRLS non-empty', { createTablesMissingRLS: [{ tableName: 'foo' }] }, true],
  ])('%s -> %s', (_, overrides, expected) => {
    expect(hasBlockingIssues({ ...noIssues, ...overrides }, false)).toBe(expected)
  })

  it('returns false when force is true, even with issues present', () => {
    expect(hasBlockingIssues({ ...noIssues, hasDestructiveOperations: true }, true)).toBe(false)
  })
})

const buildDatabase = (overrides: Partial<Database> = {}): Database => ({
  cloud_provider: 'AWS',
  connectionString: 'postgres://primary',
  connection_string_read_only: 'postgres://primary',
  db_host: 'db.example.com',
  db_name: 'postgres',
  db_port: 5432,
  db_user: 'postgres',
  identifier: 'primary',
  inserted_at: '2024-01-01T00:00:00Z',
  region: 'us-east-1',
  restUrl: 'https://example.com',
  size: 'micro',
  status: 'ACTIVE_HEALTHY',
  ...overrides,
})

describe('SQLEditor.utils:resolveConnectionString', () => {
  it('returns the matching database connection string', () => {
    const databases = [
      buildDatabase({ identifier: 'primary', connectionString: 'postgres://primary' }),
      buildDatabase({ identifier: 'replica-1', connectionString: 'postgres://replica-1' }),
    ]
    expect(resolveConnectionString(databases, 'replica-1')).toBe('postgres://replica-1')
  })

  it('returns undefined when no database matches', () => {
    const databases = [buildDatabase({ identifier: 'primary' })]
    expect(resolveConnectionString(databases, 'unknown')).toBeUndefined()
  })

  it('returns undefined when databases is undefined', () => {
    expect(resolveConnectionString(undefined, 'primary')).toBeUndefined()
  })

  it('normalizes a null connectionString to undefined', () => {
    const databases = [buildDatabase({ identifier: 'primary', connectionString: null })]
    expect(resolveConnectionString(databases, 'primary')).toBeUndefined()
  })
})
