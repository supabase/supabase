import { safeSql, untrustedSql } from '@supabase/pg-meta'
import { stripIndent } from 'common-tags'
import { describe, expect, it, test } from 'vitest'

import { sqlAiDisclaimerComment, untitledSnippetTitle } from './SQLEditor.constants'
import type { IStandaloneCodeEditor } from './SQLEditor.types'
import {
  analyzeQueryIssues,
  appendEnableRLSStatements,
  applyAutoLimit,
  assembleCompletionDiff,
  buildDebugChatArgs,
  buildDebugPromptText,
  buildExecuteParams,
  checkAlterDatabaseConnection,
  checkDestructiveQuery,
  computeErrorHighlightLine,
  deriveSnippetIdentity,
  extractDebugContext,
  filterTablesCoveredByEnsureRLSTrigger,
  getCreateTablesMissingRLS,
  getEditorSql,
  hasActiveEnsureRLSTrigger,
  hasBlockingIssues,
  isUpdateWithoutWhere,
  resolveConnectionString,
  shouldAutoGenerateTitle,
  trimTrailingSemicolons,
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

describe('SQLEditor.utils.ts:trimTrailingSemicolons', () => {
  test('removes a single trailing semicolon', () => {
    const sql = safeSql`select * from countries;`
    expect(trimTrailingSemicolons(sql)).toBe('select * from countries')
  })
  test('removes multiple trailing semicolons', () => {
    const sql = safeSql`select * from countries;;;;;;;`
    expect(trimTrailingSemicolons(sql)).toBe('select * from countries')
  })
  test('leaves a fragment with no trailing semicolon unchanged', () => {
    const sql = safeSql`select * from countries`
    expect(trimTrailingSemicolons(sql)).toBe('select * from countries')
  })
  test('does not touch semicolons that are not trailing', () => {
    const sql = safeSql`select 1; select 2`
    expect(trimTrailingSemicolons(sql)).toBe('select 1; select 2')
  })
})

describe('SQLEditor.utils.ts:applyAutoLimit', () => {
  test('Should return false if limit passed is <= 0', () => {
    const sql = safeSql`select * from countries;`
    const limit = -1
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return true if limit passed is > 0', () => {
    const sql = safeSql`select * from countries;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(true)
  })
  test('Should return false if query already has a limit', () => {
    const sql = safeSql`select * from countries limit 10;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit (check for case-insensitiveness)', () => {
    const sql = safeSql`SELECT * FROM countries LIMIT 10;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit with whitespace before the semi colon', () => {
    const sql = safeSql`select * from countries limit 10 ;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit and offset', () => {
    const sql = safeSql`select * from countries limit 10 offset 0;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit and offset with whitespace before the semi colon', () => {
    const sql = safeSql`select * from countries limit 10 offset 0 ;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit and offset (flip order of limit and offset)', () => {
    const sql = safeSql`select * from countries offset 0 limit 1;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query already has a limit, even if no value provided for limit', () => {
    const sql = safeSql`select * from countries limit`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query uses `FETCH FIRST` instead of limit ', () => {
    const sql = safeSql`select * from countries FETCH FIRST 5 rows only`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query uses `fetch first` instead of limit ', () => {
    const sql = safeSql`select * from countries fetch first 5 rows only`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query uses `fetch   first` (with random spaces) instead of limit ', () => {
    const sql = safeSql`select * from countries FETCH FIRST 5 rows only`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query is not a select statement', () => {
    const sql = safeSql`create table test (id int8 primary key, name varchar);`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if there are multiple queries I', () => {
    const sql1 = safeSql`select * from countries;
select * from cities;`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql1, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if there are multiple queries II', () => {
    const sql1 = safeSql`select * from countries;
select * from cities`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql1, limit)
    expect(appendAutoLimit).toBe(false)
  })
  // [Joshen] Opting to just avoid appending in this case to prevent making the logic overly complex atm
  test('Should return false if query has with a comment I', () => {
    const sql = safeSql`-- This is a comment
select * from cities`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })
  test('Should return false if query has with a comment II', () => {
    const sql = safeSql`select * from cities
-- This is a comment`
    const limit = 100
    const { appendAutoLimit } = applyAutoLimit(sql, limit)
    expect(appendAutoLimit).toBe(false)
  })

  // [Joshen] These will just need to test the cases when appendAutoLimit returns true then
  test('Should add the limit param properly if query ends without a semi colon', () => {
    const sql = safeSql`select * from countries`
    const limit = 100
    const { sql: formattedSql } = applyAutoLimit(sql, limit)
    expect(formattedSql).toBe('select * from countries limit 100;')
  })
  test('Should add the limit param properly if query ends with a semi colon', () => {
    const sql = safeSql`select * from countries;`
    const limit = 100
    const { sql: formattedSql } = applyAutoLimit(sql, limit)
    expect(formattedSql).toBe('select * from countries limit 100;')
  })
  test('Should add the limit param properly if query ends with multiple semi colon', () => {
    const sql = safeSql`select * from countries;;;;;;;`
    const limit = 100
    const { sql: formattedSql } = applyAutoLimit(sql, limit)
    expect(formattedSql).toBe('select * from countries limit 100;')
  })
  test('Should not append a limit if query already has one with whitespace before the semi colon', () => {
    const sql = safeSql`select * from countries limit 10 ;`
    const limit = 100
    const { sql: formattedSql } = applyAutoLimit(sql, limit)
    expect(formattedSql).toBe('select * from countries limit 10 ;')
  })
  test('returns the SafeSqlFragment result unchanged when no limit is appended', () => {
    const sql = safeSql`select * from countries limit 10;`
    const { sql: formattedSql } = applyAutoLimit(sql, 100)
    expect(formattedSql).toBe(sql)
  })
})

describe('SQLEditor.utils.ts:shouldAutoGenerateTitle', () => {
  test('returns true when AI is enabled, the name is still the placeholder, and on platform', () => {
    expect(
      shouldAutoGenerateTitle({
        aiOptInLevel: 'default',
        snippetName: `${untitledSnippetTitle} 1`,
        isPlatform: true,
      })
    ).toBe(true)
  })
  test('returns false when AI opt-in is disabled', () => {
    expect(
      shouldAutoGenerateTitle({
        aiOptInLevel: 'disabled',
        snippetName: `${untitledSnippetTitle} 1`,
        isPlatform: true,
      })
    ).toBe(false)
  })
  test('returns false when the snippet already has a custom name', () => {
    expect(
      shouldAutoGenerateTitle({
        aiOptInLevel: 'default',
        snippetName: 'My saved query',
        isPlatform: true,
      })
    ).toBe(false)
  })
  test('returns false when not running on the hosted platform', () => {
    expect(
      shouldAutoGenerateTitle({
        aiOptInLevel: 'default',
        snippetName: `${untitledSnippetTitle} 1`,
        isPlatform: false,
      })
    ).toBe(false)
  })
  test('returns false when the snippet name is undefined', () => {
    expect(
      shouldAutoGenerateTitle({
        aiOptInLevel: 'default',
        snippetName: undefined,
        isPlatform: true,
      })
    ).toBe(false)
  })
})

describe('SQLEditor.utils.ts:buildExecuteParams', () => {
  const impersonatedRoleState = createRoleImpersonationState('default', {
    current: async () => ({}),
  })

  test('applies the auto-limit suffix when appropriate', () => {
    const params = buildExecuteParams({
      sql: safeSql`select * from countries`,
      limit: 100,
      connectionString: 'postgresql://example',
      projectRef: 'default',
      impersonatedRoleState,
    })
    expect(params.sql).toBe('select * from countries limit 100;')
    expect(params.autoLimit).toBe(100)
  })
  test('leaves autoLimit undefined when a limit is already present', () => {
    const params = buildExecuteParams({
      sql: safeSql`select * from countries limit 10;`,
      limit: 100,
      connectionString: 'postgresql://example',
      projectRef: 'default',
      impersonatedRoleState,
    })
    expect(params.sql).toBe('select * from countries limit 10;')
    expect(params.autoLimit).toBeUndefined()
  })
  test('reflects isRoleImpersonationEnabled from the impersonation state', () => {
    const params = buildExecuteParams({
      sql: safeSql`select * from countries`,
      limit: 0,
      connectionString: 'postgresql://example',
      projectRef: 'default',
      impersonatedRoleState,
    })
    expect(params.isRoleImpersonationEnabled).toBe(false)
    expect(params.isStatementTimeoutDisabled).toBe(true)
    expect(params.contextualInvalidation).toBe(true)
  })
})

describe('SQLEditor.utils.ts:deriveSnippetIdentity', () => {
  test('uses the generated id when there is no url id, loading reflects the snippets map like any other id', () => {
    const result = deriveSnippetIdentity({
      urlId: undefined,
      generatedId: 'generated-id',
      snippets: {},
    })
    expect(result).toEqual({ id: 'generated-id', isLoading: true })
  })
  test('uses the generated id and is not loading once it appears in the snippets map', () => {
    const result = deriveSnippetIdentity({
      urlId: undefined,
      generatedId: 'generated-id',
      snippets: { 'generated-id': { snippet: { content: { some: 'content' } } } },
    })
    expect(result).toEqual({ id: 'generated-id', isLoading: false })
  })
  test('uses the generated id and is never loading when the url id is "new"', () => {
    const result = deriveSnippetIdentity({
      urlId: 'new',
      generatedId: 'generated-id',
      snippets: { 'generated-id': { snippet: { content: undefined } } },
    })
    expect(result).toEqual({ id: 'generated-id', isLoading: false })
  })
  test('uses the url id and is loading when the snippet is not yet in the store', () => {
    const result = deriveSnippetIdentity({
      urlId: 'existing-id',
      generatedId: 'generated-id',
      snippets: {},
    })
    expect(result).toEqual({ id: 'existing-id', isLoading: true })
  })
  test('uses the url id and is loading when the snippet has no content yet', () => {
    const result = deriveSnippetIdentity({
      urlId: 'existing-id',
      generatedId: 'generated-id',
      snippets: { 'existing-id': { snippet: { content: undefined } } },
    })
    expect(result).toEqual({ id: 'existing-id', isLoading: true })
  })
  test('uses the url id and is not loading once the snippet content has arrived', () => {
    const result = deriveSnippetIdentity({
      urlId: 'existing-id',
      generatedId: 'generated-id',
      snippets: { 'existing-id': { snippet: { content: { some: 'content' } } } },
    })
    expect(result).toEqual({ id: 'existing-id', isLoading: false })
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
  test('falls back to an empty sql when the snippet is undefined', () => {
    expect(extractDebugContext(undefined, { error: { message: 'boom' } })).toEqual({
      sql: '',
      errorMessage: 'boom',
    })
  })
  test('falls back to an empty sql when the snippet has no content yet', () => {
    expect(
      extractDebugContext({ snippet: { content: undefined } }, { error: { message: 'boom' } })
    ).toEqual({ sql: '', errorMessage: 'boom' })
  })
  test('falls back to "Unknown error" when the result is undefined', () => {
    const snippet = buildDebugSnippet('select 1;')
    expect(extractDebugContext(snippet, undefined)).toEqual({
      sql: 'select 1;',
      errorMessage: 'Unknown error',
    })
  })
  test('falls back to "Unknown error" when the result has no error message', () => {
    const snippet = buildDebugSnippet('select 1;')
    expect(extractDebugContext(snippet, {})).toEqual({
      sql: 'select 1;',
      errorMessage: 'Unknown error',
    })
  })
})

describe('SQLEditor.utils.ts:buildDebugChatArgs', () => {
  test('builds the newChat payload from the snippet sql and error message', () => {
    const snippet = buildDebugSnippet('select 1;')
    const result = { error: { message: 'relation does not exist' } }
    expect(buildDebugChatArgs(snippet, result)).toEqual({
      name: 'Debug SQL snippet',
      sqlSnippets: ['select 1;'],
      initialInput:
        'Help me to debug the attached sql snippet which gives the following error: \n\nrelation does not exist',
    })
  })
})

describe(`SQLEditor.utils.ts:checkDestructiveQuery`, () => {
  it('drop statement matches', () => {
    const match = checkDestructiveQuery('drop table films, distributors;')

    expect(match).toBe(true)
  })

  it('truncate statement matches', () => {
    const match = checkDestructiveQuery('truncate films;')

    expect(match).toBe(true)
  })

  it('delete statement matches', () => {
    const match = checkDestructiveQuery("delete from films where kind <> 'Musical';")

    expect(match).toBe(true)
  })

  it('delete statement after another statement matches', () => {
    const match = checkDestructiveQuery(stripIndent`
      select * from films;

      delete from films where kind <> 'Musical';
    `)

    expect(match).toBe(true)
  })

  it("rls policy containing delete doesn't match", () => {
    const match = checkDestructiveQuery(stripIndent`
      create policy "Users can delete their own files"
      on storage.objects for delete to authenticated using (
        bucket id = 'files' and (select auth.uid()) = owner
      );
    `)

    expect(match).toBe(false)
  })

  it('capitalized statement matches', () => {
    const match = checkDestructiveQuery("DELETE FROM films WHERE kind <> 'Musical';")

    expect(match).toBe(true)
  })

  it("comment containing keyword doesn't match", () => {
    const match = checkDestructiveQuery(stripIndent`
      -- Going to drop this in here, might delete later
      select * from films;
    `)

    expect(match).toBe(false)
  })
})

describe('SQLEditor.utils:updateWithoutWhere', () => {
  it('contains an update query with a where clause', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      UPDATE public.countries SET name = 'New Name' WHERE id = 1;
    `)

    expect(match).toBe(false)
  })

  it('contains an update query without a where clause', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      UPDATE public.countries SET name = 'New Name';
    `)

    expect(match).toBe(true)
  })

  it('contains an update query, with quoted identifiers with a where clause', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      UPDATE "public"."countries" SET name = 'New Name' WHERE id = 1;
    `)

    expect(match).toBe(false)
  })

  it('contains an update query, with quoted identifiers without a where clause', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      UPDATE "public"."countries" SET name = 'New Name';
    `)

    expect(match).toBe(true)
  })

  it('catches update on a single quoted table name without a where clause', () => {
    const match = isUpdateWithoutWhere(`UPDATE "messages" SET id = 1;`)
    expect(match).toBe(true)
  })

  it('does not flag update on a single quoted table name with a where clause', () => {
    const match = isUpdateWithoutWhere(`UPDATE "messages" SET id = 1 WHERE id = 2;`)
    expect(match).toBe(false)
  })

  it('catches update on a quoted schema with a bareword table without a where clause', () => {
    const match = isUpdateWithoutWhere(`UPDATE "public".messages SET id = 1;`)
    expect(match).toBe(true)
  })

  it('catches update on a bareword schema with a quoted table without a where clause', () => {
    const match = isUpdateWithoutWhere(`UPDATE public."messages" SET id = 1;`)
    expect(match).toBe(true)
  })

  it('catches update on a quoted table name containing a space without a where clause', () => {
    const match = isUpdateWithoutWhere(`UPDATE "my table" SET id = 1;`)
    expect(match).toBe(true)
  })

  it('catches update on a quoted table name containing escaped quotes without a where clause', () => {
    const match = isUpdateWithoutWhere(`UPDATE "weird""name" SET id = 1;`)
    expect(match).toBe(true)
  })

  it('catches update where a quoted identifier contains the word where', () => {
    const match = isUpdateWithoutWhere(`UPDATE "where table" SET id = 1;`)
    expect(match).toBe(true)
  })

  it('catches update where a string literal contains the word where', () => {
    const match = isUpdateWithoutWhere(`UPDATE messages SET name = 'where x';`)
    expect(match).toBe(true)
  })

  it('does not flag update where the only "where" sits inside a string literal but a real where clause exists', () => {
    const match = isUpdateWithoutWhere(`UPDATE messages SET name = 'where x' WHERE id = 1;`)
    expect(match).toBe(false)
  })

  it('contains both an update query and a delete query, triggers destructive', () => {
    const match = checkDestructiveQuery(stripIndent`
      delete from countries; update countries set name = 'hello';
    `)

    expect(match).toBe(true)
  })

  it('contains both an update query and a delete query, triggers no where', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      delete from countries; update countries set name = 'hello';
    `)

    expect(match).toBe(true)
  })
  it('contains both an update query and a delete query, triggers no where', () => {
    const match = isUpdateWithoutWhere(stripIndent`
      delete from countries; update countries set name = 'hello';
    `)

    expect(match).toBe(true)
  })

  it('should catch potential destructive queries', () => {
    const DESTRUCTIVE_QUERIES = [
      `ALTER TABLE test DROP COLUMN test;`,
      `DELETE FROM test;`,
      `DROP TABLE test;`,
      `TRUNCATE TABLE test;`,
    ]

    DESTRUCTIVE_QUERIES.forEach((query) => {
      expect(checkDestructiveQuery(query), `Query ${query} should be destructive`).toBe(true)
    })
  })

  it('should catch EXECUTE with DROP in string literal', () => {
    expect(checkDestructiveQuery(`EXECUTE 'DROP TABLE users';`)).toBe(true)
  })

  it('should catch EXECUTE with DELETE in string literal', () => {
    expect(checkDestructiveQuery(`EXECUTE 'DELETE FROM users';`)).toBe(true)
  })

  it('should catch EXECUTE with TRUNCATE in string literal', () => {
    expect(checkDestructiveQuery(`EXECUTE 'TRUNCATE TABLE users';`)).toBe(true)
  })

  it('should catch EXECUTE format with DROP', () => {
    expect(checkDestructiveQuery(`EXECUTE format('DROP TABLE %I', table_name);`)).toBe(true)
  })

  it('should catch EXECUTE format with DELETE', () => {
    expect(checkDestructiveQuery(`EXECUTE format('DELETE FROM %I', table_name);`)).toBe(true)
  })

  it('should catch EXECUTE format with TRUNCATE', () => {
    expect(checkDestructiveQuery(`EXECUTE format('TRUNCATE TABLE %I', table_name);`)).toBe(true)
  })

  it('should catch EXECUTE with string concatenation containing DROP', () => {
    expect(checkDestructiveQuery(`EXECUTE 'DROP TABLE ' || table_name;`)).toBe(true)
  })

  it('should catch EXECUTE with string concatenation containing DELETE', () => {
    expect(checkDestructiveQuery(`EXECUTE 'DELETE FROM ' || table_name;`)).toBe(true)
  })

  it('should catch DO block with EXECUTE DROP', () => {
    expect(
      checkDestructiveQuery(stripIndent`
        DO $$
        BEGIN
          EXECUTE 'DROP TABLE users';
        END
        $$;
      `)
    ).toBe(true)
  })

  it('should catch DO block with EXECUTE format DROP', () => {
    expect(
      checkDestructiveQuery(stripIndent`
        DO $$
        BEGIN
          FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
            EXECUTE format('DROP TABLE %I', rec.tablename);
          END LOOP;
        END
        $$;
      `)
    ).toBe(true)
  })

  it('should catch DO block with multiple EXECUTE format DROPs', () => {
    expect(
      checkDestructiveQuery(stripIndent`
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
      `)
    ).toBe(true)
  })

  it('should catch lowercase execute with drop', () => {
    expect(checkDestructiveQuery(`execute 'drop table users';`)).toBe(true)
  })

  it('should catch mixed case EXECUTE Format with DROP', () => {
    expect(checkDestructiveQuery(`EXECUTE Format('DROP TABLE users');`)).toBe(true)
  })

  it('should not flag EXECUTE with safe SQL', () => {
    expect(checkDestructiveQuery(`EXECUTE 'SELECT * FROM users';`)).toBe(false)
  })

  it('should not flag EXECUTE with INSERT', () => {
    expect(checkDestructiveQuery(`EXECUTE 'INSERT INTO users (name) VALUES (''test'')';`)).toBe(
      false
    )
  })

  it('should not flag EXECUTE with UPDATE and WHERE', () => {
    expect(checkDestructiveQuery(`EXECUTE 'UPDATE users SET name = ''test'' WHERE id = 1';`)).toBe(
      false
    )
  })

  it('should catch EXECUTE IMMEDIATE with DROP', () => {
    expect(checkDestructiveQuery(`EXECUTE IMMEDIATE 'DROP TABLE users';`)).toBe(true)
  })

  it('should catch EXECUTE IMMEDIATE with DELETE', () => {
    expect(checkDestructiveQuery(`EXECUTE IMMEDIATE 'DELETE FROM users';`)).toBe(true)
  })

  it('should catch EXECUTE IMMEDIATE with TRUNCATE', () => {
    expect(checkDestructiveQuery(`EXECUTE IMMEDIATE 'TRUNCATE TABLE users';`)).toBe(true)
  })

  it('should catch OPEN cursor FOR EXECUTE with DROP', () => {
    expect(checkDestructiveQuery(`OPEN ref FOR EXECUTE 'DROP TABLE users';`)).toBe(true)
  })

  it('should catch OPEN cursor FOR EXECUTE format with DELETE', () => {
    expect(checkDestructiveQuery(`OPEN ref FOR EXECUTE format('DELETE FROM %I', tbl);`)).toBe(true)
  })

  it('should catch OPEN cursor FOR EXECUTE with string concat', () => {
    expect(checkDestructiveQuery(`OPEN ref FOR EXECUTE 'TRUNCATE TABLE ' || tbl;`)).toBe(true)
  })

  it('should catch RETURN QUERY EXECUTE with DROP', () => {
    expect(checkDestructiveQuery(`RETURN QUERY EXECUTE 'DROP TABLE users';`)).toBe(true)
  })

  it('should catch RETURN QUERY EXECUTE format with DELETE', () => {
    expect(checkDestructiveQuery(`RETURN QUERY EXECUTE format('DELETE FROM %I', tbl);`)).toBe(true)
  })

  it('should catch EXECUTE with dollar-quoted string containing DROP', () => {
    expect(checkDestructiveQuery(`EXECUTE $sql$DROP TABLE users$sql$;`)).toBe(true)
  })

  it('should catch EXECUTE with dollar-quoted string containing TRUNCATE', () => {
    expect(checkDestructiveQuery(`EXECUTE $body$TRUNCATE TABLE logs$body$;`)).toBe(true)
  })

  it('should catch EXECUTE concat with DROP', () => {
    expect(checkDestructiveQuery(`EXECUTE concat('DROP TABLE ', 'users');`)).toBe(true)
  })

  it('should catch EXECUTE concat_ws with DELETE', () => {
    expect(checkDestructiveQuery(`EXECUTE concat_ws(' ', 'DELETE FROM', 'users');`)).toBe(true)
  })

  it('should catch EXECUTE with E-string escape containing DROP', () => {
    expect(checkDestructiveQuery(`EXECUTE E'DROP TABLE users';`)).toBe(true)
  })

  it('should catch EXECUTE with ALTER TABLE DROP COLUMN', () => {
    expect(checkDestructiveQuery(`EXECUTE 'ALTER TABLE users DROP COLUMN email';`)).toBe(true)
  })

  it('should catch EXECUTE format with ALTER TABLE DROP COLUMN', () => {
    expect(
      checkDestructiveQuery(`EXECUTE format('ALTER TABLE %I DROP COLUMN %I', 'users', 'email');`)
    ).toBe(true)
  })

  it('should catch EXECUTE IMMEDIATE with ALTER TABLE DROP COLUMN', () => {
    expect(checkDestructiveQuery(`EXECUTE IMMEDIATE 'ALTER TABLE users DROP COLUMN email';`)).toBe(
      true
    )
  })

  it('should catch OPEN cursor FOR EXECUTE with ALTER TABLE DROP COLUMN', () => {
    expect(
      checkDestructiveQuery(`OPEN ref FOR EXECUTE 'ALTER TABLE users DROP COLUMN email';`)
    ).toBe(true)
  })

  it('should catch RETURN QUERY EXECUTE with ALTER TABLE DROP COLUMN', () => {
    expect(
      checkDestructiveQuery(`RETURN QUERY EXECUTE 'ALTER TABLE users DROP COLUMN email';`)
    ).toBe(true)
  })

  it('should catch EXECUTE dollar-quoted with ALTER TABLE DROP COLUMN', () => {
    expect(checkDestructiveQuery(`EXECUTE $sql$ALTER TABLE users DROP COLUMN email$sql$;`)).toBe(
      true
    )
  })

  it('should catch EXECUTE concat with ALTER TABLE DROP COLUMN', () => {
    expect(
      checkDestructiveQuery(`EXECUTE concat('ALTER TABLE ', 'users DROP COLUMN email');`)
    ).toBe(true)
  })

  it('should catch DO block with EXECUTE ALTER TABLE DROP COLUMN', () => {
    expect(
      checkDestructiveQuery(stripIndent`
        DO $$
        BEGIN
          EXECUTE 'ALTER TABLE users DROP COLUMN email';
        END
        $$;
      `)
    ).toBe(true)
  })

  it('should not flag ALTER TABLE without DROP COLUMN', () => {
    expect(checkDestructiveQuery(`EXECUTE 'ALTER TABLE users ADD COLUMN email text';`)).toBe(false)
  })

  it('should not flag variable assignment with safe SQL', () => {
    expect(checkDestructiveQuery(`sql := 'SELECT * FROM users';`)).toBe(false)
  })

  it('should not flag OPEN cursor FOR EXECUTE with safe SQL', () => {
    expect(checkDestructiveQuery(`OPEN ref FOR EXECUTE 'SELECT * FROM users';`)).toBe(false)
  })

  it('should not flag RETURN QUERY EXECUTE with safe SQL', () => {
    expect(checkDestructiveQuery(`RETURN QUERY EXECUTE 'SELECT * FROM users';`)).toBe(false)
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
  it('returns false for undefined triggers', () => {
    expect(hasActiveEnsureRLSTrigger(undefined)).toBe(false)
  })

  it('returns false for an empty list', () => {
    expect(hasActiveEnsureRLSTrigger([])).toBe(false)
  })

  it('returns true when a trigger named "ensure_rls" is active', () => {
    expect(hasActiveEnsureRLSTrigger([buildTrigger()])).toBe(true)
  })

  it('returns true when a trigger uses the rls_auto_enable function (renamed trigger)', () => {
    expect(
      hasActiveEnsureRLSTrigger([
        buildTrigger({ name: 'something_else', function_name: 'rls_auto_enable' }),
      ])
    ).toBe(true)
  })

  it('returns false when the matching trigger is DISABLED', () => {
    expect(hasActiveEnsureRLSTrigger([buildTrigger({ enabled_mode: 'DISABLED' })])).toBe(false)
  })

  it('ignores unrelated triggers', () => {
    expect(
      hasActiveEnsureRLSTrigger([buildTrigger({ name: 'audit_log', function_name: 'log_changes' })])
    ).toBe(false)
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
  it('detects connection limit 0', () => {
    const match = checkAlterDatabaseConnection('alter database postgres connection limit 0;')
    expect(match).toBe(true)
  })

  it('detects allow_connections false', () => {
    const match = checkAlterDatabaseConnection('alter database postgres allow_connections false;')
    expect(match).toBe(true)
  })

  it('detects case-insensitive match', () => {
    const match = checkAlterDatabaseConnection('ALTER DATABASE postgres CONNECTION LIMIT 0;')
    expect(match).toBe(true)
  })

  it('detects statement among multiple statements', () => {
    const match = checkAlterDatabaseConnection(stripIndent`
      select * from countries;
      alter database postgres connection limit 0;
    `)
    expect(match).toBe(true)
  })

  it('does not flag unrelated alter database statement', () => {
    const match = checkAlterDatabaseConnection(
      'alter database postgres set statement_timeout = 60000;'
    )
    expect(match).toBe(false)
  })

  it('does not flag non-alter statements', () => {
    const match = checkAlterDatabaseConnection('select * from countries;')
    expect(match).toBe(false)
  })

  it('ignores statements inside comments', () => {
    const match = checkAlterDatabaseConnection(stripIndent`
      -- alter database postgres connection limit 0;
      select 1;
    `)
    expect(match).toBe(false)
  })

  it('detects both dangerous statements in same query', () => {
    const match = checkAlterDatabaseConnection(stripIndent`
      alter database postgres connection limit 0;
      alter database postgres allow_connections false;
    `)
    expect(match).toBe(true)
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
    getSelection: () => (hasSelection ? ({ startLineNumber: 1 } as any) : null),
    getModel: () => ({ getValueInRange: () => selectionValue }) as any,
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
    const result = buildDebugPromptText('select 1;', 'relation does not exist')
    expect(result).toContain('relation does not exist')
    expect(result).toContain('```sql\nselect 1;\n```')
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

  it('returns false when there are no issues', () => {
    expect(hasBlockingIssues(noIssues, false)).toBe(false)
  })

  it('returns true when hasDestructiveOperations is set', () => {
    expect(hasBlockingIssues({ ...noIssues, hasDestructiveOperations: true }, false)).toBe(true)
  })

  it('returns true when hasUpdateWithoutWhere is set', () => {
    expect(hasBlockingIssues({ ...noIssues, hasUpdateWithoutWhere: true }, false)).toBe(true)
  })

  it('returns true when hasAlterDatabasePreventConnection is set', () => {
    expect(hasBlockingIssues({ ...noIssues, hasAlterDatabasePreventConnection: true }, false)).toBe(
      true
    )
  })

  it('returns true when createTablesMissingRLS is non-empty', () => {
    expect(
      hasBlockingIssues({ ...noIssues, createTablesMissingRLS: [{ tableName: 'foo' }] }, false)
    ).toBe(true)
  })

  it('returns false when force is true, even with issues present', () => {
    expect(hasBlockingIssues({ ...noIssues, hasDestructiveOperations: true }, true)).toBe(false)
  })

  it('returns false when force is true and there are no issues', () => {
    expect(hasBlockingIssues(noIssues, true)).toBe(false)
  })
})

const buildDatabase = (overrides: Partial<Database> = {}): Database => ({
  cloud_provider: 'AWS',
  connectionString: 'postgres://primary',
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
