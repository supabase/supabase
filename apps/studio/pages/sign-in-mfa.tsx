import * as Sentry from '@sentry/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import SignInMfaForm from 'components/interfaces/SignIn/SignInMfaForm'
import SignInLayout from 'components/layouts/SignInLayout/SignInLayout'
import { Loading } from 'components/ui/Loading'
import { useAddLoginEvent } from 'data/misc/audit-login-mutation'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import useLatest from 'hooks/misc/useLatest'
import { auth, buildPathWithParams, getAccessToken, getReturnToPath } from 'lib/gotrue'
import type { NextPageWithLayout } from 'types'

const SignInMfaPage: NextPageWithLayout = () => {
  const router = useRouter()

  const queryClient = useQueryClient()
  const {
    // current methods for mfa are github and sso
    method: signInMethod = 'unknown',
  } = useParams()
  const signInMethodRef = useLatest(signInMethod)

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: addLoginEvent } = useAddLoginEvent()

  const [loading, setLoading] = useState(true)

  // This useEffect redirects the user to MFA if they're already halfway signed in
  useEffect(() => {
    auth
      .initialize()
      .then(async ({ error }) => {
        console.log('step 1')
        if (error) {
          // if there was a problem signing in via the url, don't redirect
          setLoading(false)
          return
        }
        console.log('step 2')

        const token = await getAccessToken()

        console.log('step 3', token)

        if (token) {
          const { data, error } = await auth.mfa.getAuthenticatorAssuranceLevel()
          console.log('step 4', data, error)
          if (error) {
            // if there was a problem signing in via the url, don't redirect
            toast.error(
              `Failed to retrieve assurance level: ${error.message}. Please try signing in again`
            )
            setLoading(false)
            return router.push({ pathname: '/sign-in', query: router.query })
          }

          console.log('step 5')

          if (data.currentLevel === data.nextLevel) {
            sendEvent({
              action: 'sign_in',
              properties: {
                category: 'account',
                method: signInMethodRef.current,
              },
            })
            addLoginEvent({})
            console.log('step 6')
            await queryClient.resetQueries()
            router.push(getReturnToPath())
            return
          }

          console.log('step 7')

          if (data.currentLevel !== data.nextLevel) {
            setLoading(false)
            return
          }

          console.log('step 8')
        } else {
          console.log('step 9 maybe')
          // if the user doesn't have a token, he needs to go back to the sign-in page
          const redirectTo = buildPathWithParams('/sign-in')
          router.replace(redirectTo)
          return
        }
      })
      .catch((error) => {
        Sentry.captureException(error)
        console.error('Auth initialization error:', error)
        toast.error('Failed to initialize authentication. Please try again.')
        setLoading(false)
        router.push({ pathname: '/sign-in', query: router.query })
      })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-alternative h-screen items-center justify-center">
        <Loading />
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

export default SignInMfaPage
