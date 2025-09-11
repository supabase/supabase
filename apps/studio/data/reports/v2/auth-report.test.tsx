import { describe, expect, it } from 'vitest'
import { defaultAuthReportFormatter } from './auth.config'

describe('defaultAuthReportFormatter', () => {
  const timestamp = new Date('2021-01-01').getTime()

  it('should format the data correctly', () => {
    const data = { result: [{ timestamp: String(timestamp), count: 1 }] }

    const attributes = [
      { attribute: 'ActiveUsers', provider: 'logs', label: 'Active Users', enabled: true },
    ]

    const result = defaultAuthReportFormatter(data, attributes)

    expect(result).toEqual({
      data: [{ timestamp: String(timestamp), ActiveUsers: 1 }],
      chartAttributes: attributes,
    })
  })

  it('should format the data correctly with multiple attributes', () => {
    const data = {
      result: [
        { timestamp: String(timestamp), count: 1 },
        { timestamp: String(timestamp + 1), count: 2 },
      ],
    }

    const attributes = [
      { attribute: 'ActiveUsers', provider: 'logs', label: 'Active Users', enabled: true },
      { attribute: 'SignInAttempts', provider: 'logs', label: 'Sign In Attempts', enabled: true },
    ]

    const result = defaultAuthReportFormatter(data, attributes)

    expect(result).toEqual({
      data: [
        { timestamp: String(timestamp), ActiveUsers: 1, SignInAttempts: 1 },
        { timestamp: String(timestamp + 1), ActiveUsers: 2, SignInAttempts: 2 },
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
