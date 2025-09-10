import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'
import { toast } from 'sonner'

import { BASE_PATH } from 'lib/constants'
import { auth, buildPathWithParams } from 'lib/gotrue'
import { Button } from 'ui'

interface SignInWithCustomProps {
  providerName: string
}

export const SignInWithCustom = ({ providerName }: SignInWithCustomProps) => {
  const [loading, setLoading] = useState(false)

  async function handleCustomSignIn() {
    setLoading(true)

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
      toast.error(`Failed to sign in via ${providerName}: ${error.message}`)
      Sentry.captureMessage('[CRITICAL] Failed to sign in via GH: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <Button block onClick={handleCustomSignIn} size="large" type="default" loading={loading}>
      Continue with {providerName}
    </Button>
  )
}
