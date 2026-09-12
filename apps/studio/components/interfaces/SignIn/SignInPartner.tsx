import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { InlineLink } from '@/components/ui/InlineLink'
import { getIdentityProviderConfig } from '@/lib/external-identity-providers'
import { auth } from '@/lib/gotrue'
import { classifyApiError } from '@/lib/telemetry/funnel-errors'
import { useTrack } from '@/lib/telemetry/track'
import { useTrackFunnelError } from '@/lib/telemetry/use-track-funnel-error'

export const SignInPartner = () => {
  const router = useRouter()
  const track = useTrack()
  const trackFunnelError = useTrackFunnelError()

  useEffect(() => {
    ;(async () => {
      const params = new URLSearchParams(window.location.hash.substring(1))

      const partner = params.get('partner')
      const token = params.get('id_token')

      const { data } = await auth.getSession()

      if (!data.session && partner && token) {
        // partner comes from the URL hash unauthenticated; only registry-known values may
        // enter the method vocabulary, anything else would let a crafted link poison it
        const knownPartner = getIdentityProviderConfig(partner)
        const method = knownPartner?.id ?? 'unregistered_partner'
        track('sign_in_submitted', {
          category: 'account',
          method,
        })
        try {
          const { error } = await auth.signInWithIdToken({ provider: partner, token })
          if (error) {
            trackFunnelError('signin', classifyApiError('signin', error), 'form')
          }
        } finally {
          router.replace({ pathname: '/sign-in-mfa', query: { method } })
        }
      } else {
        router.replace({ pathname: '/sign-in' })
      }
    })()
  }, [])

  return (
    <div className="relative mx-auto w-full flex flex-col items-center justify-center gap-y-6">
      <Loader2 className="animate-spin" />
      <h2 className="text-lg text-center">Signing in to Supabase Dashboard</h2>
      <p className="text-xs text-foreground-lighter text-center max-w-[220px] sm:max-w-full">
        By continuing, you agree to Supabase’s{' '}
        <InlineLink
          href="https://supabase.com/terms"
          className="text-foreground-lighter hover:text-foreground"
        >
          Terms of Service
        </InlineLink>{' '}
        and{' '}
        <InlineLink
          href="https://supabase.com/privacy"
          className="text-foreground-lighter hover:text-foreground"
        >
          Privacy Policy
        </InlineLink>
        .
      </p>
    </div>
  )
}
