import * as Sentry from '@sentry/nextjs'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { getAccessToken } from 'common'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LogoLoader } from 'ui'

import { SignInMfaForm } from '@/components/interfaces/SignIn/SignInMfaForm'
import { ForgotPasswordLayout } from '@/components/layouts/SignInLayout/ForgotPasswordLayout'
import { auth, buildPathWithParams, getReturnToPath } from '@/lib/gotrue'

export const Route = createFileRoute('/_auth/forgot-password-mfa')({
  component: ForgotPasswordMfaPage,
})

function ForgotPasswordMfaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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
            return navigate({ to: '/sign-in', search: true })
          }

          if (data.currentLevel === data.nextLevel) {
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
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col flex-1 bg-alternative h-screen items-center justify-center">
        <LogoLoader />
      </div>
    )
  }

  return (
    <ForgotPasswordLayout
      heading="Complete two-factor authentication"
      subheading="Enter the authentication code from your two-factor authentication app before changing your password"
    >
      <SignInMfaForm context="forgot-password" />
    </ForgotPasswordLayout>
  )
}
