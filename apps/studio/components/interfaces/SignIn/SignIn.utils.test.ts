import type HCaptcha from '@hcaptcha/react-hcaptcha'
import type { RefObject } from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { isExpectedCaptchaError, resolveCaptchaToken } from './SignIn.utils'

const { captureCriticalError, toastError } = vi.hoisted(() => ({
  captureCriticalError: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/lib/error-reporting', () => ({ captureCriticalError }))
vi.mock('sonner', () => ({ toast: { error: toastError } }))

function captchaRefRejectingWith(reason: unknown) {
  return {
    current: { execute: vi.fn().mockRejectedValue(reason) },
  } as unknown as RefObject<HCaptcha | null>
}

describe('isExpectedCaptchaError', () => {
  test.each(['challenge-closed', 'challenge-expired', 'network-error'])(
    'treats %s as expected',
    (code) => {
      expect(isExpectedCaptchaError(code)).toBe(true)
      expect(isExpectedCaptchaError(new Error(code))).toBe(true)
    }
  )

  test.each(['challenge-error', 'invalid-data', 'rate-limited', 'something else'])(
    'treats %s as unexpected',
    (code) => {
      expect(isExpectedCaptchaError(code)).toBe(false)
    }
  )
})

describe('resolveCaptchaToken', () => {
  beforeEach(() => {
    captureCriticalError.mockClear()
    toastError.mockClear()
  })

  test('returns the token when the challenge succeeds', async () => {
    const ref = {
      current: { execute: vi.fn().mockResolvedValue({ response: 'token-123' }) },
    } as unknown as RefObject<HCaptcha | null>
    const track = vi.fn()

    await expect(resolveCaptchaToken(ref, track, 'toast')).resolves.toEqual({
      ok: true,
      token: 'token-123',
    })
    expect(track).not.toHaveBeenCalled()
    expect(captureCriticalError).not.toHaveBeenCalled()
  })

  test.each(['challenge-closed', 'challenge-expired', 'network-error'])(
    'does not report %s to Sentry but still shows a toast and tracks the error',
    async (code) => {
      const track = vi.fn()

      await expect(
        resolveCaptchaToken(captchaRefRejectingWith(code), track, 'toast')
      ).resolves.toEqual({ ok: false })
      expect(toastError).toHaveBeenCalledTimes(1)
      expect(track).toHaveBeenCalledTimes(1)
      expect(captureCriticalError).not.toHaveBeenCalled()
    }
  )

  test('reports unexpected captcha errors to Sentry', async () => {
    const track = vi.fn()

    await expect(
      resolveCaptchaToken(captchaRefRejectingWith('challenge-error'), track, 'toast')
    ).resolves.toEqual({ ok: false })
    expect(toastError).toHaveBeenCalledTimes(1)
    expect(captureCriticalError).toHaveBeenCalledWith(
      new Error('challenge-error'),
      'sign in captcha challenge'
    )
  })
})
