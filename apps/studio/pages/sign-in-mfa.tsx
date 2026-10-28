import * as Sentry from '@sentry/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { getAccessToken, useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useEffectEvent, useState } from 'react'
import { toast } from 'sonner'
import { Button, copyToClipboard, LogoLoader } from 'ui'

import { SignInMfaForm } from '@/components/interfaces/SignIn/SignInMfaForm'
import { SignInLayout } from '@/components/layouts/SignInLayout/SignInLayout'
import { AlertError } from '@/components/ui/AlertError'
import { useAddLoginEvent } from '@/data/misc/audit-login-mutation'
import { useLatest } from '@/hooks/misc/useLatest'
import { isAuthStorageAvailable } from '@/lib/auth-browser-support'
import { auth, getReturnToPath } from '@/lib/gotrue'
import { useTrack } from '@/lib/telemetry/track'
import type { NextPageWithLayout } from '@/types'

const SignInMfaPage: NextPageWithLayout = () => {
  const router = useRouter()

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
  const [initError, setInitError] = useState<string | null>(null)
  const [sessionMissing, setSessionMissing] = useState(false)
  const [isStorageBlocked, setIsStorageBlocked] = useState(false)

  // This useEffect redirects the user to MFA if they're already halfway signed in
  useEffect(() => {
    setIsStorageBlocked(!isAuthStorageAvailable())
    auth
      .initialize()
      .then(async ({ error }) => {
        if (error) {
          // OAuth/SSO callback failed — stay on this page and show the error instead of
          // bouncing to /sign-in. Redirecting hides the cause and reads as a login loop,
          // especially in embedded browsers that drop the session (see #50788).
          setInitError(error.message)
          setLoading(false)
          return
        }

        const token = await getAccessToken()

        if (token) {
          const { data, error } = await auth.mfa.getAuthenticatorAssuranceLevel()
          if (error) {
            // if there was a problem signing in via the url, don't redirect
            setInitError(`Failed to retrieve assurance level: ${error.message}`)
            setLoading(false)
            return
          }

          if (data.currentLevel === data.nextLevel) {
            onSignInTracked()
            addLoginEvent({})

            await queryClient.resetQueries()
            router.push(getReturnToPath())
            return
          } else {
            // Show the MFA form
            setLoading(false)
            return
          }
        } else {
          // No session (expired, lost, or blocked storage). Stay here and explain instead of
          // redirecting back to /sign-in, which otherwise looks like a login loop.
          setSessionMissing(true)
          setLoading(false)
          return
        }
      })
      .catch((error) => {
        Sentry.captureException(error)
        console.error('Auth initialization error:', error)
        setInitError('Failed to initialize authentication.')
        setLoading(false)
        return
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

  if (initError !== null || sessionMissing) {
    const subject = isStorageBlocked
      ? 'This browser blocked the sign-in session'
      : 'Sign-in session not found'
    const description = isStorageBlocked
      ? 'Embedded browsers can block storage needed for sign-in. Open this page in Chrome or Edge to continue.'
      : 'The sign-in session expired or was lost. Return to sign in and try again.'

    return (
      <SignInLayout
        heading="Sign-in did not complete"
        subheading="Your session was not saved in this browser"
        logoLinkToMarketingSite={true}
      >
        <div className="flex flex-col gap-5">
          <AlertError
            subject={subject}
            description={description}
            error={initError ? { message: initError } : undefined}
            hideContactSupport
            additionalActions={
              <>
                <Button onClick={() => router.reload()}>Try again</Button>
                <Button asChild variant="outline">
                  <Link href={{ pathname: '/sign-in', query: router.query }}>Back to sign in</Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(window.location.href, () =>
                      toast.success('Sign-in link copied')
                    )
                  }
                >
                  Copy sign-in link
                </Button>
              </>
            }
          />
        </div>
      </SignInLayout>
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

export default SignInMfaPage
