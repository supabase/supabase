import { describe, expect, it } from 'vitest'
import { cronPattern, parseCronJobCommand, secondsPattern } from './CronJobs.utils'

describe('parseCronJobCommand', () => {
  it('should return a default object when the command is null', () => {
    expect(parseCronJobCommand('', 'random_project_ref')).toStrictEqual({
      httpBody: '',
      method: 'POST',
      snippet: '',
      timeoutMs: 1000,
      type: 'sql_snippet',
    })
  })

  it('should return a default object when the command is random', () => {
    const command = 'some random text'
    expect(parseCronJobCommand(command, 'random_project_ref')).toStrictEqual({
      snippet: 'some random text',
      type: 'sql_snippet',
    })
  })

  it('should return a sql function command when the command is SELECT auth.jwt ()', () => {
    const command = 'SELECT auth.jwt ()'
    expect(parseCronJobCommand(command, 'random_project_ref')).toStrictEqual({
      type: 'sql_function',
      schema: 'auth',
      functionName: 'jwt',
      snippet: command,
    })
  })

  it('should return a sql function command when the command is SELECT public.test_fn(1, 2)', () => {
    const command = 'SELECT public.test_fn(1, 2)'
    expect(parseCronJobCommand(command, 'random_project_ref')).toStrictEqual({
      type: 'sql_function',
      schema: 'public',
      functionName: 'test_fn',
      snippet: command,
    })
  })

  it('should return a edge function config when the command posts to its own supabase.co project', () => {
    const command = `select net.http_post( url:='https://random_project_ref.supabase.co/functions/v1/_', headers:=jsonb_build_object(), body:='', timeout_milliseconds:=5000 );`
    expect(parseCronJobCommand(command, 'random_project_ref')).toStrictEqual({
      edgeFunctionName: 'https://random_project_ref.supabase.co/functions/v1/_',
      method: 'POST',
      httpHeaders: [],
      httpBody: '',
      timeoutMs: 5000,
      type: 'edge_function',
      snippet: command,
    })
  })

  it('should return a HTTP request config when the command posts to another supabase.co project', () => {
    const command = `select net.http_post( url:='https://another_project_ref.supabase.co/functions/v1/_', headers:=jsonb_build_object(), body:='', timeout_milliseconds:=5000 );`
    expect(parseCronJobCommand(command, 'random_project_ref')).toStrictEqual({
      endpoint: 'https://another_project_ref.supabase.co/functions/v1/_',
      method: 'POST',
      httpHeaders: [],
      httpBody: '',
      timeoutMs: 5000,
      type: 'http_request',
      snippet: command,
    })
  })

  it('should return a HTTP request config with POST method, empty headers and a body as string', () => {
    const command = `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object(), body:='hello', timeout_milliseconds:=5000 );`
    expect(parseCronJobCommand(command, 'random_project_ref')).toStrictEqual({
      endpoint: 'https://example.com/api/endpoint',
      method: 'POST',
      httpHeaders: [],
      httpBody: 'hello',
      timeoutMs: 5000,
      type: 'http_request',
      snippet: command,
    })
  })

  it('should return a HTTP request config with POST method, some headers and empty body', () => {
    const command = `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object('fst', '1', 'snd', '2'), body:='', timeout_milliseconds:=1000 );`
    expect(parseCronJobCommand(command, 'random_project_ref')).toStrictEqual({
      endpoint: 'https://example.com/api/endpoint',
      method: 'POST',
      httpHeaders: [
        { name: 'fst', value: '1' },
        { name: 'snd', value: '2' },
      ],
      httpBody: '',
      timeoutMs: 1000,
      type: 'http_request',
      snippet: command,
    })
  })

  it('should return a HTTP request config with GET method and empty body', () => {
    const command = `select net.http_get( url:='https://example.com/api/endpoint', headers:=jsonb_build_object(), timeout_milliseconds:=5000 );`
    expect(parseCronJobCommand(command, 'random_project_ref')).toStrictEqual({
      endpoint: 'https://example.com/api/endpoint',
      method: 'GET',
      httpHeaders: [],
      httpBody: '',
      timeoutMs: 5000,
      type: 'http_request',
      snippet: command,
    })
  })

  it('should return a HTTP request config with POST method and a body as JSON object', () => {
    const command = `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object(), body:='{"key": "value"}', timeout_milliseconds:=5000 );`
    expect(parseCronJobCommand(command, 'random_project_ref')).toStrictEqual({
      endpoint: 'https://example.com/api/endpoint',
      method: 'POST',
      httpHeaders: [],
      httpBody: '{"key": "value"}',
      timeoutMs: 5000,
      type: 'http_request',
      snippet: command,
    })
  })

  it('should return a HTTP request config with POST method, plain JSON headers and plain JSON body', () => {
    const command = `select net.http_post( url:='https://example.com/api/endpoint', headers:='{"fst": "1", "snd": "2"}',body:='{"key": "value"}',timeout_milliseconds:=5000);`
    expect(parseCronJobCommand(command, 'random_project_ref')).toStrictEqual({
      endpoint: 'https://example.com/api/endpoint',
      method: 'POST',
      httpHeaders: [
        { name: 'fst', value: '1' },
        { name: 'snd', value: '2' },
      ],
      httpBody: '{"key": "value"}',
      timeoutMs: 5000,
      type: 'http_request',
      snippet: command,
    })
  })

  it('should return a HTTP request config with POST method, plain JSON headers and plain JSON body with ::jsonb typecasting', () => {
    const command = `select net.http_post( url:='https://example.com/api/endpoint', headers:='{"fst": "1", "snd": "2"}'::jsonb,body:='{"key": "value"}'::jsonb,timeout_milliseconds:=5000);`
    expect(parseCronJobCommand(command, 'random_project_ref')).toStrictEqual({
      endpoint: 'https://example.com/api/endpoint',
      method: 'POST',
      httpHeaders: [
        { name: 'fst', value: '1' },
        { name: 'snd', value: '2' },
      ],
      httpBody: '{"key": "value"}',
      timeoutMs: 5000,
      type: 'http_request',
      snippet: command,
    })
  })

  // Array of test cases for secondsPattern
  const secondsPatternTests = [
    { description: '10 seconds', command: '10 seconds' },
    { description: '30 seconds', command: '30 seconds' },
  ]

  // Run tests for secondsPattern
  secondsPatternTests.forEach(({ description, command }) => {
    it(`should match the regex for a secondsPattern with "${description}"`, () => {
      expect(command).toMatch(secondsPattern)
    })
  })

  // Array of test cases for cronPattern
  const cronPatternTests = [
    { description: 'every hour', command: '0 * * * *' },
    { description: 'every day at midnight', command: '0 0 * * *' },
    { description: 'every Monday at 9 AM', command: '0 9 * * 1' },
    { description: 'every 15th of the month at noon', command: '0 12 15 * *' },
    { description: 'every January 1st at 3 AM', command: '0 3 1 1 *' },
    { description: 'every 30 minutes', command: '30 * * * *' },
    { description: 'every weekday at 6 PM', command: '0 18 * * 1-5' },
    { description: 'every weekend at 10 AM', command: '0 10 * * 0,6' },
    { description: 'every quarter hour', command: '*/15 * * * *' },
    { description: 'twice daily at 8 AM and 8 PM', command: '0 8,20 * * *' },
  ]

  // Replace the single cronPattern test with forEach
  cronPatternTests.forEach(({ description, command }) => {
    it(`should match the regex for a cronPattern with "${description}"`, () => {
      expect(command).toMatch(cronPattern)
    })
  })
})
