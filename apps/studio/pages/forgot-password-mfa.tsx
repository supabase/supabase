import * as Sentry from '@sentry/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import SignInMfaForm from 'components/interfaces/SignIn/SignInMfaForm'
import ForgotPasswordLayout from 'components/layouts/SignInLayout/ForgotPasswordLayout'
import { Loading } from 'components/ui/Loading'
import useLatest from 'hooks/misc/useLatest'
import { auth, buildPathWithParams, getAccessToken, getReturnToPath } from 'lib/gotrue'
import type { NextPageWithLayout } from 'types'

const ForgotPasswordMfa: NextPageWithLayout = () => {
  const router = useRouter()

  const queryClient = useQueryClient()
  const {
    // current methods for mfa are github and sso
    method: signInMethod = 'unknown',
  } = useParams()
  const signInMethodRef = useLatest(signInMethod)

  const [loading, setLoading] = useState(true)

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
            await queryClient.resetQueries()
            router.push(getReturnToPath())
            return
          } else {
            // Show the MFA form
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
    <ForgotPasswordLayout
      heading="Complete two-factor authentication"
      subheading="Enter the authentication code from your two-factor authentication app before changing your password"
    >
      <SignInMfaForm />
    </ForgotPasswordLayout>
  )
}

export default ForgotPasswordMfa
