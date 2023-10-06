import * as Sentry from '@sentry/nextjs'
import { BASE_PATH } from 'lib/constants'
import { auth, buildPathWithParams } from 'lib/gotrue'
import { incrementSignInClicks } from 'lib/local-storage'
import { useState } from 'react'
import { Button, IconGitHub } from 'ui'

const SignInWithGitHub = () => {
  const [loading, setLoading] = useState(false)

  async function handleGithubSignIn() {
    setLoading(true)

    try {
      const signInClicks = incrementSignInClicks()
      if (signInClicks > 1) {
        Sentry.captureMessage('Sign in without previous sign out detected')
      }

      // redirects to /sign-in to check if the user has MFA setup (handled in SignInLayout.tsx)
      const redirectTo = buildPathWithParams(
        `${
          process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
            ? location.origin
            : process.env.NEXT_PUBLIC_SITE_URL
        }${BASE_PATH}/sign-in-mfa`
      )

      const { error } = await auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  return (
    <Button
      block
      onClick={handleGithubSignIn}
      // set the width to 20 so that it matches the loading spinner and don't push the text when loading
      icon={<IconGitHub width={20} height={18} />}
      size="large"
      type="default"
      loading={loading}
    >
      Continue with GitHub
    </Button>
  )
}

export default SignInWithGitHub
