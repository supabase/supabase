import { useState } from 'react'
import { BASE_PATH } from 'lib/constants'
import { auth, getReturnToPath } from 'lib/gotrue'
import { incrementSignInClicks } from 'lib/local-storage'
import { Button, IconGitHub } from 'ui'
import * as Sentry from '@sentry/nextjs'

const SignInWithGitHub = () => {
  const [loading, setLoading] = useState(false)

  async function handleGithubSignIn() {
    setLoading(true)

    try {
      const signInClicks = incrementSignInClicks()
      if (signInClicks > 1) {
        Sentry.captureMessage('Sign in without previous sign out detected')
      }

      const { error } = await auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${
            process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
              ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
              : process.env.NEXT_PUBLIC_SITE_URL
          }${BASE_PATH}${getReturnToPath()}`,
        },
      })
      if (error) throw error
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      block
      onClick={handleGithubSignIn}
      icon={<IconGitHub width={18} height={18} />}
      size="large"
      type="default"
      loading={loading}
    >
      Continue with GitHub
    </Button>
  )
}

export default SignInWithGitHub
