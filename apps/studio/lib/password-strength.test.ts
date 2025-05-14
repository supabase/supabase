import { describe, it, expect, beforeEach, vi } from 'vitest'
import passwordStrength from './password-strength'
import { toast } from 'sonner'

// Hoist the post_ mock so it's available before the module is loaded
const postMock = vi.hoisted(() => vi.fn())

vi.mock('data/fetchers', () => ({
  post: postMock,
}))

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

describe('passwordStrength', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty values for message, warning and strength for empty input', async () => {
    const result = await passwordStrength('')
    expect(result).toEqual({ message: '', warning: '', strength: 0 })
    expect(postMock).not.toHaveBeenCalled()
  })

  it('returns max length message, warning, and strength 0 for password longer than 99 characters', async () => {
    const longPassword = 'a'.repeat(100)
    const result = await passwordStrength(longPassword)
    expect(result.message).toMatch(/maximum length/i)
    expect(result.warning).toMatch(/less than 100 characters/i)
    expect(result.strength).toBe(0)
    expect(postMock).not.toHaveBeenCalled()
  })

  it('returns strong score, suggestion, and empty warning for strong password', async () => {
    postMock.mockResolvedValue({
      data: {
        result: {
          score: 4,
          feedback: { suggestions: ['Successfully updated database password'] },
        },
      },
      error: null,
    })
    const result = await passwordStrength('StrongPassword123!')
    expect(result.message).toMatch(/strong/i)
    expect(result.message).toContain('Successfully updated database password')
    expect(result.warning).toBe('')
    expect(result.strength).toBe(4)
  })

  it('returns weak score, suggestion, and warning for weak password', async () => {
    postMock.mockResolvedValue({
      data: {
        result: {
          score: 2,
          feedback: {
            suggestions: ['Try a longer password'],
            warning: 'Too short',
          },
        },
      },
      error: null,
    })
    const result = await passwordStrength('weak')
    expect(result.message).toMatch(/not secure/i)
    expect(result.message).toContain('Try a longer password')
    expect(result.warning).toMatch(/too short/i)
    expect(result.warning).toMatch(/you need a stronger password/i)
    expect(result.strength).toBe(2)
  })

  it('returns empty values and shows toast error on server error', async () => {
    postMock.mockResolvedValue({ data: null, error: { message: 'Server error' } })
    const result = await passwordStrength('any')
    expect(result).toEqual({ message: '', warning: '', strength: 0 })
    expect(toast.error).toHaveBeenCalledTimes(1)
  })
})
