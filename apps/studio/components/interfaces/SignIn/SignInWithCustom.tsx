import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import { BASE_PATH } from '@/lib/constants'
import { captureCriticalError } from '@/lib/error-reporting'
import { getProviderDisplay } from '@/lib/external-identity-providers'
import { auth, buildPathWithParams } from '@/lib/gotrue'
import { classifyApiError } from '@/lib/telemetry/funnel-errors'
import { useTrack } from '@/lib/telemetry/track'
import { useTrackFunnelError } from '@/lib/telemetry/use-track-funnel-error'

interface SignInWithCustomProps {
  providerName: string
}

export const SignInWithCustom = ({ providerName }: SignInWithCustomProps) => {
  const [loading, setLoading] = useState(false)
  const displayName = getProviderDisplay(providerName).displayName
  const track = useTrack()
  const trackFunnelError = useTrackFunnelError()

  async function handleCustomSignIn() {
    setLoading(true)
    track('sign_in_submitted', { category: 'account', method: providerName.toLowerCase() })

    try {
      // redirects to /sign-in to check if the user has MFA setup (handled in SignInLayout.tsx)
      const redirectTo = buildPathWithParams(
        `${
          process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
            ? location.origin
            : process.env.NEXT_PUBLIC_SITE_URL
        }${BASE_PATH}/sign-in-mfa?method=${providerName.toLowerCase()}`
      )

      const { error } = await auth.signInWithOAuth({
        // @ts-expect-error - providerName is a string
        provider: providerName.toLowerCase(),
        options: { redirectTo, scopes: 'email' },
      })

      if (error) throw error
    } catch (error: any) {
      const toastId = toast.error(`Failed to sign in via ${displayName}: ${error.message}`)
      trackFunnelError('signin', classifyApiError('signin', error), 'toast', toastId)
      captureCriticalError(error, `sign in via ${providerName}`)
      setLoading(false)
    }
  }

  return (
    <Button block onClick={handleCustomSignIn} size="large" variant="default" loading={loading}>
      Continue with {displayName}
    </Button>
  )
}
