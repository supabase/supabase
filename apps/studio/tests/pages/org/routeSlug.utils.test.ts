import { buildOrgUrl } from 'components/interfaces/Organization/Organization.utils'
import { describe, expect, test } from 'vitest'

describe('buildOrgUrl', () => {
  describe('when slug is undefined (bare /org/_ route)', () => {
    test('returns the org project list url', () => {
      expect(buildOrgUrl({ slug: undefined, orgSlug: 'my-org', queryString: '' })).toBe(
        '/org/my-org'
      )
    })

    test('appends query string when present', () => {
      expect(buildOrgUrl({ slug: undefined, orgSlug: 'my-org', queryString: 'foo=bar' })).toBe(
        '/org/my-org?foo=bar'
      )
    })

    test('does not append a bare ? when query string is empty', () => {
      expect(buildOrgUrl({ slug: undefined, orgSlug: 'my-org', queryString: '' })).not.toContain(
        '?'
      )
    })
  })

  describe('when slug is a string (next.js router quirk — single segment)', () => {
    test('returns the org project list url, ignoring the string slug', () => {
      expect(buildOrgUrl({ slug: 'general', orgSlug: 'my-org', queryString: '' })).toBe(
        '/org/my-org'
      )
    })

    test('appends query string when present', () => {
      expect(buildOrgUrl({ slug: 'general', orgSlug: 'my-org', queryString: 'ref=abc' })).toBe(
        '/org/my-org?ref=abc'
      )
    })
  })

  describe('when slug is an array (sub-path route)', () => {
    test('preserves a single-segment sub-path', () => {
      expect(buildOrgUrl({ slug: ['general'], orgSlug: 'my-org', queryString: '' })).toBe(
        '/org/my-org/general'
      )
    })

    test('preserves a multi-segment sub-path', () => {
      expect(
        buildOrgUrl({ slug: ['settings', 'billing'], orgSlug: 'my-org', queryString: '' })
      ).toBe('/org/my-org/settings/billing')
    })

    test('appends query string when present', () => {
      expect(
        buildOrgUrl({ slug: ['general'], orgSlug: 'my-org', queryString: 'foo=1&bar=2' })
      ).toBe('/org/my-org/general?foo=1&bar=2')
    })

    test('does not append a bare ? when query string is empty', () => {
      expect(buildOrgUrl({ slug: ['general'], orgSlug: 'my-org', queryString: '' })).not.toContain(
        '?'
      )
    })
  })
})
