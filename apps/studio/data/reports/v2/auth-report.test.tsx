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
        { timestamp: String(timestamp), active_users: 1 },
        { timestamp: String(timestamp + 1), sign_in_attempts: 2 },
      ],
    }

    const attributes = [
      { attribute: 'active_users', label: 'Active Users' },
      { attribute: 'sign_in_attempts', label: 'Sign In Attempts' },
    ]

    const result = defaultAuthReportFormatter(data, attributes)

    expect(result).toEqual({
      data: [
        { timestamp: String(timestamp), active_users: 1, sign_in_attempts: 0 },
        { timestamp: String(timestamp + 1), active_users: 0, sign_in_attempts: 2 },
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
