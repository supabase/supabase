import { describe, expect, it } from 'vitest'

import { workerLogsSql } from './worker-logs-query'

describe('workerLogsSql', () => {
  it('queries one worker stream, newest first', () => {
    expect(workerLogsSql('embed', 'output')).toBe(
      "select id, timestamp, severity_text as severity, event_message as message from logs where source = 'worker_guest_logs' and log_attributes['metadata.worker'] = 'embed' order by timestamp desc limit 100"
    )
  })

  it('reads each stream from its own source', () => {
    expect(workerLogsSql('embed', 'requests')).toContain("source = 'worker_ingress_logs'")
    expect(workerLogsSql('embed', 'builds')).toContain("source = 'worker_api_logs'")
  })

  it('escapes a worker name rather than interpolating it raw', () => {
    expect(workerLogsSql("embed' or '1'='1", 'output')).toContain(
      "log_attributes['metadata.worker'] = 'embed'' or ''1''=''1'"
    )
  })
})
