import type HCaptcha from '@hcaptcha/react-hcaptcha'
import type { RefObject } from 'react'
import { toast } from 'sonner'

import { captureCriticalError } from '@/lib/error-reporting'
import type { useTrackFunnelError } from '@/lib/telemetry/use-track-funnel-error'

type TrackFunnelError = ReturnType<typeof useTrackFunnelError>

/**
 * hCaptcha rejects `execute()` with one of these codes when the cause is on the user's side
 * (they closed or let the challenge expire) or their connection, not in Studio. They are not
 * reported to Sentry as critical errors.
 */
const EXPECTED_CAPTCHA_ERROR_CODES = ['challenge-closed', 'challenge-expired', 'network-error']

function getCaptchaErrorCode(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  return String(error)
}

export function isExpectedCaptchaError(error: unknown): boolean {
  return EXPECTED_CAPTCHA_ERROR_CODES.includes(getCaptchaErrorCode(error))
}

export async function resolveCaptchaToken(
  captchaRef: RefObject<HCaptcha | null>,
  trackFunnelError: TrackFunnelError,
  toastId: string | number
): Promise<{ ok: true; token: string | null } | { ok: false }> {
  try {
    const captchaResponse = await captchaRef.current?.execute({ async: true })
    return { ok: true, token: captchaResponse?.response ?? null }
  } catch (error) {
    const code = getCaptchaErrorCode(error)
    toast.error('Could not complete the security check. Please try again.', { id: toastId })
    trackFunnelError(
      'signin',
      { errorCategory: 'unknown', errorReason: 'captcha_challenge_failed' },
      'toast',
      toastId
    )
    if (!isExpectedCaptchaError(error)) {
      captureCriticalError(
        error instanceof Error ? error : new Error(code),
        'sign in captcha challenge'
      )
    }
    return { ok: false }
  }
}
