import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { SignInWithGitHub } from 'components/interfaces/SignIn/SignInWithGitHub'
import { SignUpForm } from 'components/interfaces/SignIn/SignUpForm'
import SignInLayout from 'components/layouts/SignInLayout/SignInLayout'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const SignUpPage: NextPageWithLayout = () => {
  const router = useRouter()

  const {
    dashboardAuthSignUp: signUpEnabled,
    dashboardAuthSignInWithGithub: signInWithGithubEnabled,
  } = useIsFeatureEnabled(['dashboard_auth:sign_up', 'dashboard_auth:sign_in_with_github'])

  useEffect(() => {
    // No self-service signup for self-hosted - users must be added manually
    if (!IS_PLATFORM) {
      router.replace('/project/default')
    }
  }, [router])

  if (!signUpEnabled) {
    return <UnknownInterface fullHeight={false} urlBack="/sign-in" />
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {signInWithGithubEnabled && (
          <>
            <SignInWithGitHub />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-strong" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-studio px-2 text-sm text-foreground">or</span>
              </div>
            </div>
          </>
        )}

        <SignUpForm />
      </div>

      <div className="my-8 self-center text-sm">
        <span className="text-foreground-light">Have an account?</span>{' '}
        <Link
          href="/sign-in"
          className="underline text-foreground hover:text-foreground-light transition"
        >
          Sign in
        </Link>
      </div>
    </>
  )
}

SignUpPage.getLayout = (page) => (
  <SignInLayout heading="Get started" subheading="Create a new account">
    {page}
  </SignInLayout>
)

export default SignUpPage
