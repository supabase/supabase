import { describe, expect, it } from 'vitest'

import { getLogDataForMetadataVisibility } from './ServiceFlowPanel'

describe('getLogDataForMetadataVisibility', () => {
  const logData = {
    id: 'worker-log',
    metadata: { source: 'worker_guest_logs', worker: 'api' },
    raw_log_data: {
      event_message: 'Worker failed',
      metadata: { request_id: 'request-id' },
    },
  }

  it('redacts top-level and nested metadata when metadata is hidden', () => {
    const visibleData = JSON.parse(JSON.stringify(getLogDataForMetadataVisibility(logData, false)))

    expect(visibleData).toEqual({
      id: 'worker-log',
      raw_log_data: { event_message: 'Worker failed' },
    })
  })

  it('preserves metadata when metadata is visible', () => {
    expect(getLogDataForMetadataVisibility(logData, true)).toBe(logData)
  })
})
