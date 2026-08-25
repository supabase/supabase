import { describe, expect, it } from 'vitest'

import { workerLogsSql } from './worker-logs-query'

describe('workerLogsSql', () => {
  it('reads one worker stream, newest first', () => {
    expect(workerLogsSql('embed', 'output')).toBe(
      "select id, timestamp, severity_text as severity, event_message as message from logs where log_attributes['worker'] = 'embed' and log_attributes['source'] = 'worker_guest_logs' order by timestamp desc limit 100"
    )
  })

  it('names the right stream for each tab', () => {
    expect(workerLogsSql('embed', 'requests')).toContain("'worker_ingress_logs'")
    expect(workerLogsSql('embed', 'builds')).toContain("'worker_api_logs'")
  })

  it('escapes a worker name rather than interpolating it raw', () => {
    expect(workerLogsSql("embed' or '1'='1", 'output')).toContain(
      "log_attributes['worker'] = 'embed'' or ''1''=''1'"
    )
  })
})
