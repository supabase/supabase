import { describe, expect, it } from 'vitest'
import { defaultAuthReportFormatter } from './auth.config'

describe('defaultAuthReportFormatter', () => {
  it('should format the data correctly', () => {
    const data = { result: [{ timestamp: '2021-01-01', count: 1 }] }
    const attributes = [
      { attribute: 'ActiveUsers', provider: 'logs', label: 'Active Users', enabled: true },
    ]
    const result = defaultAuthReportFormatter(data, attributes)
    expect(result).toEqual({
      data: [{ period_start: '2021-01-01', ActiveUsers: 1 }],
      chartAttributes: attributes,
    })
  })
})
