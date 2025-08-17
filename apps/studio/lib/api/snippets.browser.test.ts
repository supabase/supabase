import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateDeterministicUuid } from './snippets.browser'

describe('snippets.utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('generateDeterministicUuid', () => {
    it('should generate the same UUID for the same input', () => {
      const input = 'test-string'
      const uuid1 = generateDeterministicUuid([input])
      const uuid2 = generateDeterministicUuid([input])

      expect(uuid1).toBe(uuid2)
      expect(uuid1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('should generate different UUIDs for different inputs', () => {
      const uuid1 = generateDeterministicUuid(['input1'])
      const uuid2 = generateDeterministicUuid(['input2'])

      expect(uuid1).not.toBe(uuid2)
    })

    it('should handle empty string input', () => {
      const uuid = generateDeterministicUuid([''])
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('should handle special characters and Unicode', () => {
      const uuid1 = generateDeterministicUuid(['test-with-émojis-🚀-and-símb0ls!'])
      const uuid2 = generateDeterministicUuid(['test-with-émojis-🚀-and-símb0ls!'])
      expect(uuid1).toBe(uuid2)
      expect(uuid1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000)
      const uuid = generateDeterministicUuid([longString])
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
  })
})
