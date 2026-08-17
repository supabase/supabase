import { describe, expect, test } from 'vitest'

import {
  getPrimaryTroubleshootingType,
  groupTroubleshootingEntries,
  TROUBLESHOOTING_DATA_ATTRIBUTES,
  troubleshootingEntryMatchesFilter,
} from './Troubleshooting.utils.shared'

function makeEntry({
  text = 'Auth request returns 500',
  products = 'auth,database',
  keywords = 'login,server-error',
  errors = '500,500 unexpected_failure',
} = {}) {
  const attributes = {
    [TROUBLESHOOTING_DATA_ATTRIBUTES.PRODUCTS_LIST_ATTRIBUTE]: products,
    [TROUBLESHOOTING_DATA_ATTRIBUTES.KEYWORDS_LIST_ATTRIBUTE]: keywords,
    [TROUBLESHOOTING_DATA_ATTRIBUTES.ERRORS_LIST_ATTRIBUTE]: errors,
  }

  return {
    textContent: text,
    getAttribute: (name: string) => attributes[name as keyof typeof attributes] ?? null,
  }
}

describe('troubleshootingEntryMatchesFilter', () => {
  test('matches an entry when no filters are selected', () => {
    expect(troubleshootingEntryMatchesFilter(makeEntry(), [], [], [], '')).toBe(true)
  })

  test('combines product, error, tag, and case-insensitive search filters', () => {
    expect(
      troubleshootingEntryMatchesFilter(
        makeEntry(),
        ['auth'],
        ['unexpected_failure'],
        ['login'],
        'AUTH REQUEST'
      )
    ).toBe(true)
    expect(
      troubleshootingEntryMatchesFilter(makeEntry(), ['storage'], ['500'], ['login'], 'Auth')
    ).toBe(false)
  })

  test('matches product and tag identifiers exactly', () => {
    expect(
      troubleshootingEntryMatchesFilter(
        makeEntry({ products: 'oauth', keywords: 'database-api' }),
        ['auth'],
        [],
        [],
        ''
      )
    ).toBe(false)
    expect(
      troubleshootingEntryMatchesFilter(
        makeEntry({ products: 'auth', keywords: 'database-api' }),
        [],
        [],
        ['api'],
        ''
      )
    ).toBe(false)
  })
})

describe('getPrimaryTroubleshootingType', () => {
  test('maps security and performance advisors before log sources', () => {
    expect(getPrimaryTroubleshootingType(['auth-logs', 'security-advisor'])).toBe('security')
    expect(getPrimaryTroubleshootingType(['postgres-logs', 'performance-advisor'])).toBe(
      'performance'
    )
  })

  test('maps reports and metrics to usage, and remaining sources to health', () => {
    expect(getPrimaryTroubleshootingType(['reports', 'api-logs'])).toBe('usage')
    expect(getPrimaryTroubleshootingType(['postgres-logs'])).toBe('health')
  })
})

describe('groupTroubleshootingEntries', () => {
  const authGuide = {
    data: { topics: ['auth'], diagnostic_sources: ['auth-logs'] },
  }
  const rlsGuide = {
    data: { topics: ['database'], diagnostic_sources: ['security-advisor'] },
  }

  test('groups by the first product topic', () => {
    const grouped = groupTroubleshootingEntries([authGuide, rlsGuide] as never, 'product')
    expect(grouped.map(([key]) => key)).toEqual(['auth', 'database'])
  })

  test('groups by derived type in health-security-performance-usage order', () => {
    const grouped = groupTroubleshootingEntries([rlsGuide, authGuide] as never, 'type')
    expect(grouped.map(([key]) => key)).toEqual(['health', 'security'])
  })
})
