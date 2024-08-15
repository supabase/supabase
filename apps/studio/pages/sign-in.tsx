import { Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import SignInForm from 'components/interfaces/SignIn/SignInForm'
import SignInWithGitHub from 'components/interfaces/SignIn/SignInWithGitHub'
import SignInLayout from 'components/layouts/SignInLayout/SignInLayout'
import { IS_PLATFORM } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'

const SignInPage: NextPageWithLayout = () => {
  const router = useRouter()
  const searchParams = new URLSearchParams(router.query as Record<string, string>).toString()

  useEffect(() => {
    if (!IS_PLATFORM) {
      // on selfhosted instance just redirect to projects page
      router.replace('/project/default')
    }
  }, [router])

  return (
    <>
      <div className="flex flex-col gap-5">
        <SignInWithGitHub />
        <Button asChild block size="large" type="outline" icon={<Lock width={18} height={18} />}>
          <Link
            href={{
              pathname: '/sign-in-sso',
              query: searchParams,
            }}
          >
            Continue with SSO
          </Link>
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-strong" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-sm bg-studio text-foreground">or</span>
          </div>
        </div>

        <SignInForm />
      </div>

      <div className="self-center my-8 text-sm">
        <div>
          <span className="text-foreground-light">Don't have an account?</span>{' '}
          <Link
            href="/sign-up"
            className="underline transition text-foreground hover:text-foreground-light"
          >
            Sign Up Now
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
