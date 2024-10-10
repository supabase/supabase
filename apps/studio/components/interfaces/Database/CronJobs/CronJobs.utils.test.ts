import { it } from 'vitest'
import { parseCronJobCommand } from './CronJobs.utils'

describe('parseCronJobCommand', () => {
  it('should return a default object when the command is null', () => {
    expect(parseCronJobCommand('')).toStrictEqual({ snippet: '', type: 'sql_snippet' })
  })

  it('should return a default object when the command is random', () => {
    const command = 'some random text'
    expect(parseCronJobCommand(command)).toStrictEqual({
      snippet: 'some random text',
      type: 'sql_snippet',
    })
  })

  it('should return a sql function command when the command is CALL auth.jwt ()', () => {
    const command = 'CALL auth.jwt ()'
    expect(parseCronJobCommand(command)).toStrictEqual({
      type: 'sql_function',
      schema: 'auth',
      functionName: 'jwt',
    })
  })

  it('should return a edge function config when the command posts to supabase.co', () => {
    const command = `select net.http_post( url:='https://_.supabase.co/functions/v1/_', headers:=jsonb_build_object(), body:=jsonb_build_object(), timeout_milliseconds:=5000 );`
    expect(parseCronJobCommand(command)).toStrictEqual({
      edgeFunctionName: 'https://_.supabase.co/functions/v1/_',
      method: 'POST',
      httpHeaders: [],
      httpParameters: [],
      timeoutMs: 5000,
      type: 'edge_function',
    })
  })
})
