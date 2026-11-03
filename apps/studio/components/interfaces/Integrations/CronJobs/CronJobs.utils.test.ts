import { describe, expect, it } from 'vitest'

import { cronPattern, secondsPattern } from './CronJobs.constants'
import {
  buildCronCreateQuery,
  buildCronUpdateQuery,
  formatCronJobColumns,
  parseCronJobCommand,
} from './CronJobs.utils'

describe('buildCronQuery', () => {
  it('uses cron.schedule to create a job by name', () => {
    expect(buildCronCreateQuery('my-job', '*/5 * * * *', 'select 1')).toBe(
      "select cron.schedule('my-job', '*/5 * * * *', 'select 1');"
    )
  })
})

describe('buildCronUpdateQuery', () => {
  it('uses cron.alter_job to update a job by id', () => {
    expect(buildCronUpdateQuery(42, '*/10 * * * *', 'select 2')).toBe(
      "select cron.alter_job(job_id := 42, schedule := '*/10 * * * *', command := 'select 2');"
    )
  })
})

describe('parseCronJobCommand', () => {
  const REF = 'random_project_ref'

  it('should return a default object when the command is empty', () => {
    expect(parseCronJobCommand('', REF)).toStrictEqual({
      httpBody: '',
      method: 'POST',
      snippet: '',
      timeoutMs: 1000,
      type: 'sql_snippet',
    })
  })

  it.each([
    { command: 'SELECT auth.jwt ()', schema: 'auth', functionName: 'jwt' },
    { command: 'SELECT auth.jwt ();', schema: 'auth', functionName: 'jwt' },
    {
      command: 'SELECT random_schema.function_1()',
      schema: 'random_schema',
      functionName: 'function_1',
    },
    { command: 'select lowercase.issue ()', schema: 'lowercase', functionName: 'issue' },
  ])('parses "$command" as a sql function', ({ command, schema, functionName }) => {
    expect(parseCronJobCommand(command, REF)).toStrictEqual({
      type: 'sql_function',
      schema,
      functionName,
      snippet: command,
    })
  })

  it.each([
    { case: 'random text', command: 'some random text' },
    { case: 'a function call with arguments', command: 'SELECT public.test_fn(1, 2)' },
    { case: 'a function from the search path', command: 'SELECT test_cron_function()' },
    { case: 'a missing schema and function name', command: 'SELECT .()' },
    { case: 'a missing function name', command: 'SELECT schema.()' },
    {
      case: 'an HTTP request in positional notation',
      command: `SELECT net.http_post( 'https://webhook.site/dacc2028-a588-462c-9597-c8968e61d0fa', '{"message":"Hello from Supabase"}'::jsonb, '{}'::jsonb, '{"Content-Type":"application/json"}'::jsonb );`,
    },
  ])('falls back to a sql snippet for $case', ({ command }) => {
    expect(parseCronJobCommand(command, REF)).toStrictEqual({
      type: 'sql_snippet',
      snippet: command,
    })
  })

  it.each([
    {
      case: 'with a body',
      command: `select net.http_post( url:='https://random_project_ref.supabase.co/functions/v1/_', headers:=jsonb_build_object('Authorization', 'Bearer something'), body:='', timeout_milliseconds:=5000 );`,
    },
    {
      case: 'without a body',
      command: `select net.http_post( url:='https://random_project_ref.supabase.co/functions/v1/_', headers:=jsonb_build_object('Authorization', 'Bearer something'), timeout_milliseconds:=5000 );`,
    },
  ])('returns an edge function config when posting to its own project $case', ({ command }) => {
    expect(parseCronJobCommand(command, REF)).toStrictEqual({
      edgeFunctionName: 'https://random_project_ref.supabase.co/functions/v1/_',
      method: 'POST',
      httpHeaders: [{ name: 'Authorization', value: 'Bearer something' }],
      httpBody: '',
      timeoutMs: 5000,
      type: 'edge_function',
      snippet: command,
    })
  })

  it.each([
    {
      case: 'edge function',
      command: `select net.http_post( url:='https://random_project_ref.supabase.co/functions/v1/_', headers:=jsonb_build_object('Authorization', 'Bearer something'), body:='' );`,
      expected: { type: 'edge_function' },
    },
    {
      case: 'http request',
      command: `select net.http_get( url:='https://example.com/api' );`,
      expected: { type: 'http_request', method: 'GET', endpoint: 'https://example.com/api' },
    },
  ])(
    'falls back to the pg_net default timeout for an $case without timeout_milliseconds',
    ({ command, expected }) => {
      expect(parseCronJobCommand(command, REF)).toMatchObject({ ...expected, timeoutMs: 5000 })
    }
  )

  it.each([
    {
      case: 'self-hosted function URL',
      url: 'http://kong:8000/functions/v1/_',
      restUrl: undefined,
    },
    {
      case: 'self-hosted public function URL',
      url: 'https://default.supabase.localhost/functions/v1/_',
      restUrl: 'https://default.supabase.localhost/rest/v1/',
    },
  ])('returns an edge function config for a $case', ({ url, restUrl }) => {
    const command = `select net.http_post( url:='${url}', headers:=jsonb_build_object('Authorization', 'Bearer something'), timeout_milliseconds:=5000 );`
    expect(parseCronJobCommand(command, 'default', restUrl, false)).toMatchObject({
      edgeFunctionName: url,
      type: 'edge_function',
    })
  })

  it.each([
    {
      case: 'an own-project function URL with a query or hash',
      command: `select net.http_post( url:='https://random_project_ref.supabase.co/functions/v1/_?first=1#second=2', headers:=jsonb_build_object('Authorization', 'Bearer something'), timeout_milliseconds:=5000 )`,
      endpoint: 'https://random_project_ref.supabase.co/functions/v1/_?first=1#second=2',
      httpHeaders: [{ name: 'Authorization', value: 'Bearer something' }],
    },
    {
      case: "another project's function URL",
      command: `select net.http_post( url:='https://another_project_ref.supabase.co/functions/v1/_', headers:=jsonb_build_object(), body:='', timeout_milliseconds:=5000 );`,
      endpoint: 'https://another_project_ref.supabase.co/functions/v1/_',
    },
    {
      case: 'a string body',
      command: `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object(), body:='hello', timeout_milliseconds:=5000 );`,
      httpBody: 'hello',
    },
    {
      case: 'headers with an escaped quote',
      command: `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object('fst', '1', 'snd', 'O''Reilly'), body:='', timeout_milliseconds:=1000 );`,
      httpHeaders: [
        { name: 'fst', value: '1' },
        { name: 'snd', value: "O'Reilly" },
      ],
      timeoutMs: 1000,
    },
    {
      case: 'a header value containing a comma',
      command: `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object('Accept', 'application/json, text/plain'), timeout_milliseconds:=5000 );`,
      httpHeaders: [{ name: 'Accept', value: 'application/json, text/plain' }],
    },
    {
      case: 'a later header after a comma-containing value',
      command: `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object('Accept', 'application/json, text/plain', 'Authorization', 'Bearer abc'), timeout_milliseconds:=5000 );`,
      httpHeaders: [
        { name: 'Accept', value: 'application/json, text/plain' },
        { name: 'Authorization', value: 'Bearer abc' },
      ],
    },
    {
      case: 'a header value containing parentheses',
      command: `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object('User-Agent', 'Mozilla/5.0 (compatible)'), timeout_milliseconds:=5000 );`,
      httpHeaders: [{ name: 'User-Agent', value: 'Mozilla/5.0 (compatible)' }],
    },
    {
      case: 'an escaped quote inside a comma-containing header value',
      command: `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object('X-Company', 'O''Reilly, Inc'), timeout_milliseconds:=5000 );`,
      httpHeaders: [{ name: 'X-Company', value: "O'Reilly, Inc" }],
    },
    {
      case: 'backslashes in an E-prefixed header value',
      command: `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object('X-Custom', E'value\\\\here'), timeout_milliseconds:=5000 );`,
      httpHeaders: [{ name: 'X-Custom', value: 'value\\here' }],
    },
    {
      case: 'a later header after a parentheses-containing value',
      command: `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object('User-Agent', 'Mozilla/5.0 (compatible)', 'Accept', 'application/json'), timeout_milliseconds:=5000 );`,
      httpHeaders: [
        { name: 'User-Agent', value: 'Mozilla/5.0 (compatible)' },
        { name: 'Accept', value: 'application/json' },
      ],
    },
    {
      case: 'whitespace before the jsonb_build_object parenthesis',
      command: `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object ('Accept', 'application/json'), timeout_milliseconds:=5000 );`,
      httpHeaders: [{ name: 'Accept', value: 'application/json' }],
    },
    {
      case: 'a comma-containing header value followed by a body',
      command: `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object('Accept', 'application/json, text/plain'), body:='{"key": "value"}', timeout_milliseconds:=5000 );`,
      httpHeaders: [{ name: 'Accept', value: 'application/json, text/plain' }],
      httpBody: '{"key": "value"}',
    },
    {
      case: 'a GET request',
      command: `select net.http_get( url:='https://example.com/api/endpoint', headers:=jsonb_build_object(), timeout_milliseconds:=5000 );`,
      method: 'GET',
    },
    {
      case: 'a JSON body',
      command: `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object(), body:='{"key": "value"}', timeout_milliseconds:=5000 );`,
      httpBody: '{"key": "value"}',
    },
    {
      case: 'plain JSON headers and body',
      command: `select net.http_post( url:='https://example.com/api/endpoint', headers:='{"fst": "1", "snd": "2"}',body:='{"key": "value"}',timeout_milliseconds:=5000);`,
      httpHeaders: [
        { name: 'fst', value: '1' },
        { name: 'snd', value: '2' },
      ],
      httpBody: '{"key": "value"}',
    },
    {
      case: 'plain JSON with escaped SQL strings and ::jsonb casts',
      command: `select net.http_post( url:='https://example.com/api/endpoint', headers:='{"X-Name":"O''Reilly"}'::jsonb,body:='{"message":"hello  there","name":"O''Reilly"}'::jsonb,timeout_milliseconds:=5000);`,
      httpHeaders: [{ name: 'X-Name', value: "O'Reilly" }],
      httpBody: `{"message":"hello  there","name":"O'Reilly"}`,
    },
    {
      case: 'escape-string headers and body with backslashes',
      command: String.raw`select net.http_post( url:='https://example.com/api/endpoint', headers:=E'{"Content-Type":"application/json","X-Regex":"^\\\\d+$"}'::jsonb,body:=E'{"path":"C:\\\\tmp","regex":"^\\\\d+$"}',timeout_milliseconds:=1000);`,
      httpHeaders: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'X-Regex', value: String.raw`^\d+$` },
      ],
      httpBody: String.raw`{"path":"C:\\tmp","regex":"^\\d+$"}`,
      timeoutMs: 1000,
    },
    {
      case: 'a body before later quoted arguments',
      command: `select net.http_post( url:='https://example.com/api/endpoint', body:='{"payload":"ok"}'::jsonb, headers:='{"Authorization":"Bearer demo"}'::jsonb, timeout_milliseconds:=5000 );`,
      httpHeaders: [{ name: 'Authorization', value: 'Bearer demo' }],
      httpBody: '{"payload":"ok"}',
    },
  ])(
    'returns an HTTP request config for $case',
    ({
      command,
      endpoint = 'https://example.com/api/endpoint',
      method = 'POST',
      httpHeaders = [],
      httpBody = '',
      timeoutMs = 5000,
    }) => {
      expect(parseCronJobCommand(command, REF)).toStrictEqual({
        endpoint,
        method,
        httpHeaders,
        httpBody,
        timeoutMs,
        type: 'http_request',
        snippet: command,
      })
    }
  )
})

describe('schedule patterns', () => {
  it.each(['10 seconds', '30 seconds'])('secondsPattern matches "%s"', (command) => {
    expect(command).toMatch(secondsPattern)
  })

  it.each([
    '0 * * * *',
    '0 9 * * 1',
    '0 12 15 * *',
    '0 3 1 1 *',
    '0 18 * * 1-5',
    '0 10 * * 0,6',
    '*/15 * * * *',
    '0 8,20 * * *',
    // pg_cron's last-day-of-month syntax
    '0 0 $ * *',
  ])('cronPattern matches "%s"', (command) => {
    expect(command).toMatch(cronPattern)
  })

  it.each(['$ * * * *', '* $ * * *', '* * * $ *', '* * * * $'])(
    'cronPattern rejects $ outside the day-of-month field ("%s")',
    (command) => {
      expect(command).not.toMatch(cronPattern)
    }
  )
})

describe('formatCronJobColumns', () => {
  it('enables resizing for informational columns and keeps utility columns fixed', () => {
    const columns = formatCronJobColumns({
      onSelectEdit: () => undefined,
      onSelectDelete: () => undefined,
    })

    const columnsByKey = Object.fromEntries(columns.map((column) => [String(column.key), column]))

    expect(columnsByKey.jobname.resizable).toBe(true)
    expect(columnsByKey.jobname.minWidth).toBeGreaterThan(0)
    expect(columnsByKey.schedule.resizable).toBe(true)
    expect(columnsByKey.latest_run.resizable).toBe(true)
    expect(columnsByKey.next_run.resizable).toBe(true)
    expect(columnsByKey.command.resizable).toBe(true)
    expect(columnsByKey.active.resizable).toBe(false)
    expect(columnsByKey.actions.resizable).toBe(false)
  })
})
