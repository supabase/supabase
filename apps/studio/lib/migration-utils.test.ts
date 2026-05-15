import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { describe, expect, it } from 'vitest'

import { formatMigrationVersionLabel, parseMigrationVersion } from './migration-utils'

dayjs.extend(utc)

describe('parseMigrationVersion', () => {
  it('should parse valid migration version in YYYYMMDDHHmmss format', () => {
    const result = parseMigrationVersion('20231128095400')

    expect(result).not.toBeNull()
    expect(result?.isValid()).toBe(true)
    expect(result?.year()).toBe(2023)
    expect(result?.month()).toBe(10)
    expect(result?.date()).toBe(28)
    expect(result?.hour()).toBe(9)
    expect(result?.minute()).toBe(54)
    expect(result?.second()).toBe(0)
  })

  it('should return undefined for invalid version format like "001"', () => {
    const result = parseMigrationVersion('001')

    expect(result).toBeUndefined()
  })

  it('should return undefined for invalid version format like "002"', () => {
    const result = parseMigrationVersion('002')

    expect(result).toBeUndefined()
  })

  it('should return undefined for invalid version format like "003"', () => {
    const result = parseMigrationVersion('003')

    expect(result).toBeUndefined()
  })

  it('should return undefined for empty string', () => {
    const result = parseMigrationVersion('')

    expect(result).toBeUndefined()
  })

  it('should return undefined for random string', () => {
    const result = parseMigrationVersion('not-a-date')

    expect(result).toBeUndefined()
  })

  it('should return undefined for partial date format', () => {
    const result = parseMigrationVersion('20231128')

    expect(result).toBeUndefined()
  })

  it('should handle edge case date values that dayjs can parse', () => {
    // dayjs is lenient and will wrap invalid values to valid dates
    // This is acceptable for our use case - the main goal is to reject
    // non-date formats like "001", "002", etc.
    const result = parseMigrationVersion('20231399000000')

    expect(result).not.toBeNull()
    expect(result?.isValid()).toBe(true)
  })

  it('should allow chaining dayjs methods when valid', () => {
    const result = parseMigrationVersion('20231128095400')

    expect(result?.fromNow()).toBeDefined()
    expect(result?.toISOString()).toBeDefined()
    expect(result?.format('DD MMM YYYY')).toBe('28 Nov 2023')
  })

  it('should parse version digits as UTC so the UTC time is preserved exactly', () => {
    // Migration versions are stored as UTC in the DB. Parsing without UTC mode
    // would shift the time by the viewer's local offset, showing wrong UTC values.
    const result = parseMigrationVersion('20231128095400')

    expect(result?.toISOString()).toBe('2023-11-28T09:54:00.000Z')
  })
})

describe('formatMigrationVersionLabel', () => {
  it('should format a valid version as a UTC date string', () => {
    expect(formatMigrationVersionLabel('20231128095400')).toBe('28 Nov 2023, 09:54:00')
  })

  it('should return Unknown for an invalid version', () => {
    expect(formatMigrationVersionLabel('001')).toBe('Unknown')
    expect(formatMigrationVersionLabel(null)).toBe('Unknown')
    expect(formatMigrationVersionLabel(undefined)).toBe('Unknown')
  })
})
