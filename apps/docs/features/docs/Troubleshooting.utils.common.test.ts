import { describe, expect, it } from 'vitest'

import {
  TROUBLESHOOTING_DIAGNOSTIC_SOURCES,
  TroubleshootingSchema,
} from './Troubleshooting.utils.common.mjs'

describe('TroubleshootingSchema', () => {
  it('accepts structured troubleshooting discovery metadata', () => {
    const result = TroubleshootingSchema.safeParse({
      title: 'Requests return 500 errors',
      topics: ['api'],
      summary: 'The API could not complete the request.',
      diagnostic_sources: ['api-logs', 'postgres-logs'],
    })

    expect(result.success).toBe(true)
  })

  it('requires discovery metadata after the corpus migration', () => {
    const result = TroubleshootingSchema.safeParse({
      title: 'Existing troubleshooting article',
      topics: ['database'],
    })

    expect(result.success).toBe(false)
  })

  it('requires at least one product topic', () => {
    const result = TroubleshootingSchema.safeParse({
      title: 'Troubleshooting article without a product',
      topics: [],
      summary: 'The article is missing a product classification.',
      diagnostic_sources: ['logs-explorer'],
    })

    expect(result.success).toBe(false)
  })

  it('rejects diagnostic source identifiers outside the shared registry', () => {
    const result = TroubleshootingSchema.safeParse({
      title: 'Requests return 500 errors',
      topics: ['api'],
      summary: 'The API could not complete the request.',
      diagnostic_sources: ['unknown-source'],
    })

    expect(result.success).toBe(false)
  })

  it('defines readable labels for every diagnostic source', () => {
    expect(Object.keys(TROUBLESHOOTING_DIAGNOSTIC_SOURCES).length).toBeGreaterThan(0)
    expect(Object.values(TROUBLESHOOTING_DIAGNOSTIC_SOURCES).every(Boolean)).toBe(true)
  })
})
