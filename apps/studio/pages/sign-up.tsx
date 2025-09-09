import Link from 'next/link'

import { SignInWithGitHub } from 'components/interfaces/SignIn/SignInWithGitHub'
import { SignUpForm } from 'components/interfaces/SignIn/SignUpForm'
import SignInLayout from 'components/layouts/SignInLayout/SignInLayout'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import type { NextPageWithLayout } from 'types'

const SignUpPage: NextPageWithLayout = () => {
  const {
    dashboardAuthSignUp: signUpEnabled,
    dashboardAuthSignInWithGithub: signInWithGithubEnabled,
  } = useIsFeatureEnabled(['dashboard_auth:sign_up', 'dashboard_auth:sign_in_with_github'])

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
          Sign In Now
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
