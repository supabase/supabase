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

  it('should format the data correctly with multiple attributes', () => {
    const data = {
      result: [
        { timestamp: '2021-01-01', count: 1 },
        { timestamp: '2021-01-02', count: 2 },
      ],
    }

    const attributes = [
      { attribute: 'ActiveUsers', provider: 'logs', label: 'Active Users', enabled: true },
    ]

    const result = defaultAuthReportFormatter(data, attributes)

    expect(result).toEqual({
      data: [
        { period_start: '2021-01-01', ActiveUsers: 1 },
        { period_start: '2021-01-02', ActiveUsers: 2 },
      ],
      chartAttributes: attributes,
    })
  })

  it('should handle empty data', () => {
    const data = { result: [] }

    const attributes = [
      { attribute: 'ActiveUsers', provider: 'logs', label: 'Active Users', enabled: true },
    ]

    const result = defaultAuthReportFormatter(data, attributes)

    expect(result).toEqual({
      data: [],
      chartAttributes: attributes,
    })
  })
})
