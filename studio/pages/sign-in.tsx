import SignInForm from 'components/interfaces/SignIn/SignInForm'
import SignInWithGitHub from 'components/interfaces/SignIn/SignInWithGitHub'
import { SignInLayout } from 'components/layouts'
import Connecting from 'components/ui/Loading'
import { auth } from 'lib/gotrue'
import Link from 'next/link'
import { NextRouter, useRouter } from 'next/router'
import { useEffect } from 'react'
import { NextPageWithLayout } from 'types'

// detect for redirect from 3rd party service like vercel, aws...
const isRedirectFromThirdPartyService = (router: NextRouter) => router.query.next !== undefined

const SignInPage: NextPageWithLayout = () => {
  const router = useRouter()
  const autoSignIn = isRedirectFromThirdPartyService(router)

  useEffect(() => {
    if (autoSignIn) {
      const queryParams = (router.query as any) || {}
      const params = new URLSearchParams(queryParams)

      // trigger github signIn
      auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${
            process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
              ? process.env.NEXT_PUBLIC_VERCEL_URL
              : process.env.NEXT_PUBLIC_SITE_URL
          }?${params.toString()}`,
        },
      })
    }
  }, [])

  return autoSignIn ? (
    <Connecting />
  ) : (
    <>
      <div className="flex flex-col gap-5">
        <SignInWithGitHub />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-scale-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-scale-200 px-2 text-sm text-scale-1200">or</span>
          </div>
        </div>

        <SignInForm />
      </div>

      <div className="my-8 self-center text-sm">
        <div>
          <span className="text-scale-1000">Don't have an account?</span>{' '}
          <Link href="/sign-up">
            <a className="underline text-scale-1200 hover:text-scale-1100 transition">
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
