import { it } from 'vitest'
import { cronPattern, parseCronJobCommand, secondsPattern } from './CronJobs.utils'

describe('parseCronJobCommand', () => {
  it('should return a default object when the command is null', () => {
    expect(parseCronJobCommand('')).toMatchObject({ snippet: '', type: 'sql_snippet' })
  })

  it('should return a default object when the command is random', () => {
    const command = 'some random text'
    expect(parseCronJobCommand(command)).toMatchObject({
      snippet: 'some random text',
      type: 'sql_snippet',
    })
  })

  it('should return a sql function command when the command is CALL auth.jwt ()', () => {
    const command = 'CALL auth.jwt ()'
    expect(parseCronJobCommand(command)).toMatchObject({
      type: 'sql_function',
      schema: 'auth',
      functionName: 'jwt',
    })
  })

  it('should return a edge function config when the command posts to supabase.co', () => {
    const command = `select net.http_post( url:='https://_.supabase.co/functions/v1/_', headers:=jsonb_build_object(), body:='', timeout_milliseconds:=5000 );`
    expect(parseCronJobCommand(command)).toMatchObject({
      edgeFunctionName: 'https://_.supabase.co/functions/v1/_',
      method: 'POST',
      httpHeaders: [],
      httpBody: '',
      timeoutMs: 5000,
      type: 'edge_function',
    })
  })

  it('should return a HTTP request config with POST method, empty headers and a body as string', () => {
    const command = `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object(), body:='hello', timeout_milliseconds:=5000 );`
    expect(parseCronJobCommand(command)).toMatchObject({
      endpoint: 'https://example.com/api/endpoint',
      method: 'POST',
      httpHeaders: [],
      httpBody: 'hello',
      timeoutMs: 5000,
      type: 'http_request',
    })
  })

  it('should return a HTTP request config with POST method, some headers and empty body', () => {
    const command = `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object('headerche', '2'), body:='', timeout_milliseconds:=1000 );`
    expect(parseCronJobCommand(command)).toMatchObject({
      endpoint: 'https://example.com/api/endpoint',
      method: 'POST',
      httpHeaders: [{ name: 'headerche', value: '2' }],
      httpBody: '',
      timeoutMs: 1000,
      type: 'http_request',
    })
  })

  it('should return a HTTP request config with GET method and empty body', () => {
    const command = `select net.http_get( url:='https://example.com/api/endpoint', headers:=jsonb_build_object(), timeout_milliseconds:=5000 );`
    expect(parseCronJobCommand(command)).toMatchObject({
      endpoint: 'https://example.com/api/endpoint',
      method: 'GET',
      httpHeaders: [],
      httpBody: '',
      timeoutMs: 5000,
      type: 'http_request',
    })
  })

  it('should return a HTTP request config with POST method and a body as JSON object', () => {
    const command = `select net.http_post( url:='https://example.com/api/endpoint', headers:=jsonb_build_object(), body:='{"key": "value"}', timeout_milliseconds:=5000 );`
    expect(parseCronJobCommand(command)).toMatchObject({
      endpoint: 'https://example.com/api/endpoint',
      method: 'POST',
      httpHeaders: [],
      httpBody: '{"key": "value"}',
      timeoutMs: 5000,
      type: 'http_request',
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
