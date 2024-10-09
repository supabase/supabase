import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import SignInMfaForm from 'components/interfaces/SignIn/SignInMfaForm'
import SignInLayout from 'components/layouts/SignInLayout/SignInLayout'
import { Loading } from 'components/ui/Loading'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { auth, buildPathWithParams, getAccessToken, getReturnToPath } from 'lib/gotrue'
import type { NextPageWithLayout } from 'types'

const SignInMfaPage: NextPageWithLayout = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(true)
  const { mutate: sendEvent } = useSendEventMutation()

  // This useEffect redirects the user to MFA if they're already halfway signed in
  useEffect(() => {
    auth
      .initialize()
      .then(async ({ error }) => {
        if (error) {
          // if there was a problem signing in via the url, don't redirect
          setLoading(false)
          return
        }

        const token = await getAccessToken()

        if (token) {
          const { data, error } = await auth.mfa.getAuthenticatorAssuranceLevel()
          if (error) {
            // if there was a problem signing in via the url, don't redirect
            toast.error(
              `Failed to retrieve assurance level: ${error.message}. Please try signing in again`
            )
            setLoading(false)
            return router.push({ pathname: '/sign-in', query: router.query })
          }

          if (data.currentLevel === data.nextLevel) {
            sendEvent({ category: 'account', action: 'sign_in', label: '' })
            await queryClient.resetQueries()
            router.push(getReturnToPath())
            return
          }
          if (data.currentLevel !== data.nextLevel) {
            setLoading(false)
            return
          }
        } else {
          // if the user doesn't have a token, he needs to go back to the sign-in page
          const redirectTo = buildPathWithParams('/sign-in')
          router.replace(redirectTo)
          return
        }
      })
      .catch(() => {}) // catch all errors thrown by auth methods
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-alternative h-full items-center justify-center">
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
