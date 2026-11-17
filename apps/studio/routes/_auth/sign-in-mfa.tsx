import * as Sentry from '@sentry/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getAccessToken, useParams } from 'common'
import { useEffect, useEffectEvent, useState } from 'react'
import { toast } from 'sonner'
import { LogoLoader } from 'ui'

import { SignInMfaForm } from '@/components/interfaces/SignIn/SignInMfaForm'
import { SignInLayout } from '@/components/layouts/SignInLayout/SignInLayout'
import { useAddLoginEvent } from '@/data/misc/audit-login-mutation'
import { useLatest } from '@/hooks/misc/useLatest'
import { auth, buildPathWithParams, getReturnToPath } from '@/lib/gotrue'
import { useTrack } from '@/lib/telemetry/track'

export const Route = createFileRoute('/_auth/sign-in-mfa')({
  component: SignInMfaPage,
})

function SignInMfaPage() {
  const navigate = useNavigate()

  const queryClient = useQueryClient()
  const {
    // the external identity provider id (e.g. github) or sso used to sign in
    method: signInMethod = 'unknown',
  } = useParams()
  const signInMethodRef = useLatest(signInMethod)

  const track = useTrack()
  const onSignInTracked = useEffectEvent(() => {
    track('sign_in', {
      category: 'account',
      method: signInMethodRef.current,
    })
  })
  const { mutate: addLoginEvent } = useAddLoginEvent()

  const [loading, setLoading] = useState(true)

  // This useEffect redirects the user to MFA if they're already halfway signed in
  useEffect(() => {
    auth
      .initialize()
      .then(async ({ error: callbackError }) => {
        // A session that can't be refreshed counts as no session.
        const token = await getAccessToken().catch(() => undefined)

        // A successful password retry can create a session after initialization cached an error.
        // With no session, show the callback error on the sign-in page.
        if (callbackError && !token) {
          return navigate({ to: '/sign-in', search: true, replace: true })
        }

        if (token) {
          const { data, error } = await auth.mfa.getAuthenticatorAssuranceLevel()
          if (error) {
            // if there was a problem signing in via the url, don't redirect
            toast.error(
              `Failed to retrieve assurance level: ${error.message}. Please try signing in again`
            )
            setLoading(false)
            return navigate({ to: '/sign-in', search: true })
          }

          if (data.currentLevel === data.nextLevel) {
            // After a failed callback, this session is an existing one, not a new sign-in.
            if (!callbackError) {
              onSignInTracked()
              addLoginEvent({})
            }

            await queryClient.resetQueries()
            void navigate({ href: getReturnToPath() })
            return
          } else {
            // Show the MFA form
            setLoading(false)
            return
          }
        } else {
          // if the user doesn't have a token, he needs to go back to the sign-in page
          const redirectTo = buildPathWithParams('/sign-in')
          void navigate({ href: redirectTo, replace: true })
          return
        }
      })
      .catch((error) => {
        Sentry.captureException(error)
        console.error('Auth initialization error:', error)
        toast.error('Failed to initialize authentication. Please try again.')
        setLoading(false)
        void navigate({ to: '/sign-in', search: true })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-alternative h-screen items-center justify-center">
        <LogoLoader />
      </div>
    )
  }

  return (
    <SignInLayout
      heading="Two-factor authentication"
      subheading="Enter the authentication code from your two-factor authentication app"
      logoLinkToMarketingSite={true}
    >
      <div className="flex flex-col gap-5">
        <SignInMfaForm />
      </div>
    </SignInLayout>
  )
}
