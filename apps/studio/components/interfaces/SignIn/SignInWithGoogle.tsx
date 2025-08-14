import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'
import { toast } from 'sonner'
import { BASE_PATH } from 'lib/constants'
import { useLastSignIn } from 'hooks/misc/useLastSignIn'
import { auth, buildPathWithParams } from 'lib/gotrue'
import { Button } from 'ui'
import { LastSignInWrapper } from './LastSignInWrapper'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

const SignInWithGoogle = () => {
  const [loading, setLoading] = useState(false)
  const [_, setLastSignInUsed] = useLastSignIn()

  async function handleGoogleSignIn() {
    setLoading(true)

    try {
      // redirects to /sign-in to check if the user has MFA setup (handled in SignInLayout.tsx)
      const redirectTo = buildPathWithParams(
        `${
          process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
            ? location.origin
            : process.env.NEXT_PUBLIC_SITE_URL
        }${BASE_PATH}/sign-in-mfa?method=google`
      )

      const { error } = await auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })

      if (error) throw error
      //   TODO: uncommentThis once the google signin is provided
      //   else setLastSignInUsed('google')
    } catch (error: any) {
      toast.error(`Failed to sign in via Google: ${error.message}`)
      Sentry.captureMessage('[CRITICAL] Failed to sign in via Google: ' + error.message)
      setLoading(false)
    }
  }
  //TODO: should add a type for google
  return (
    <LastSignInWrapper type="github">
      <Button
        block
        onClick={handleGoogleSignIn}
        icon={<GoogleIcon />}
        size="large"
        type="default"
        loading={loading}
      >
        Continue with Google
      </Button>
    </LastSignInWrapper>
  )
}

export default SignInWithGoogle
