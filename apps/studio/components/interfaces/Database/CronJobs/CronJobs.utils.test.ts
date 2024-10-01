import { it } from 'vitest'
import { parseCronJobCommand } from './CronJobs.utils'

describe('parseCronJobCommand', () => {
  it('should return a default object when the command is null', () => {
    const command = 'some random text'
    expect(parseCronJobCommand('')).toBe({ snippet: 'some random text', type: 'sql_snippet' })
  })

  it('should return a default object when the command is random', () => {
    const command = 'some random text'
    expect(parseCronJobCommand(command)).toBe({ snippet: 'some random text', type: 'sql_snippet' })
  })

  it('should return a default object when the command is random', () => {
    const command = 'some random text'
    expect(parseCronJobCommand(command)).toBe({ snippet: 'some random text', type: 'sql_snippet' })
  })

  it('should return a default object when the command is random', () => {
    const command = `select net.http_post( url:='https://_.supabase.co/functions/v1/_', headers:=jsonb_build_object(), body:=jsonb_build_object(), timeout_milliseconds:=5000 );`
    expect(parseCronJobCommand(command)).toBe({
      edgeFunctionName: 'https://_.supabase.co/functions/v1/_',
      method: 'POST',
      httpHeaders: [],
      httpParameters: [],
      timeoutMs: 5000,
      type: 'edge_function',
    })
  })
})
