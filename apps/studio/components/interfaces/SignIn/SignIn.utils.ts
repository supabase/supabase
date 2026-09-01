import type HCaptcha from '@hcaptcha/react-hcaptcha'
import type { RefObject } from 'react'
import { toast } from 'sonner'

import type { useTrackFunnelError } from '@/lib/telemetry/use-track-funnel-error'

type TrackFunnelError = ReturnType<typeof useTrackFunnelError>

export async function resolveCaptchaToken(
  captchaRef: RefObject<HCaptcha | null>,
  trackFunnelError: TrackFunnelError,
  toastId: string | number
): Promise<{ ok: true; token: string | null } | { ok: false }> {
  try {
    const captchaResponse = await captchaRef.current?.execute({ async: true })
    return { ok: true, token: captchaResponse?.response ?? null }
  } catch {
    toast.error('Could not complete the security check. Please try again.', { id: toastId })
    trackFunnelError(
      'signin',
      { errorCategory: 'validation', errorReason: 'captcha_failed' },
      'toast',
      toastId
    )
    return { ok: false }
  }
}
