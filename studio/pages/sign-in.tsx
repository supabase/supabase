import Link from 'next/link'

import { NextPageWithLayout } from 'types'
import SignInForm from 'components/interfaces/SignIn/SignInForm'
import SignInWithGitHub from 'components/interfaces/SignIn/SignInWithGitHub'
import SignInWithSSO from 'components/interfaces/SignIn/SignInWithSSO'
import { SignInLayout } from 'components/layouts'
import { useEffect } from 'react'
import { IS_PLATFORM } from 'lib/constants'
import { useRouter } from 'next/router'

const SignInPage: NextPageWithLayout = () => {
  const router = useRouter()
  useEffect(() => {
    // if the dashboard is running locally, redirect straight to the projects page
    if (!IS_PLATFORM) {
      router.replace('/projects')
    }
  }, [])

  return (
    <>
      <div className="flex flex-col gap-5">
        <SignInWithGitHub />
        <SignInWithSSO />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-scale-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-sm bg-scale-200 text-scale-1200">or</span>
          </div>
        </div>

        <SignInForm />
      </div>

      <div className="self-center my-8 text-sm">
        <div>
          <span className="text-scale-1000">Don't have an account?</span>{' '}
          <Link href="/sign-up">
            <a className="underline transition text-scale-1200 hover:text-scale-1100">
              Sign Up Now
            </a>
          </Link>
        </div>
      </div>
    </>
  )
}

SignInPage.getLayout = (page) => (
  <SignInLayout
    heading="Welcome back"
    subheading="Sign in to your account"
    logoLinkToMarketingSite={true}
  >
    {page}
  </SignInLayout>
)

export default SignInPage
