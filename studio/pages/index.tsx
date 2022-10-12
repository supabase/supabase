import LoginForm from 'components/interfaces/Login/LoginForm'
import LoginWithGitHub from 'components/interfaces/Login/LoginWithGitHub'
import { LoginLayout } from 'components/layouts'
import Connecting from 'components/ui/Loading'
import { auth } from 'lib/gotrue'
import Link from 'next/link'
import { NextRouter, useRouter } from 'next/router'
import { useEffect } from 'react'
import { NextPageWithLayout } from 'types'

// detect for redirect from 3rd party service like vercel, aws...
const isRedirectFromThirdPartyService = (router: NextRouter) => router.query.next !== undefined

const LoginPage: NextPageWithLayout = () => {
  const router = useRouter()
  const autoLogin = isRedirectFromThirdPartyService(router)

  useEffect(() => {
    if (autoLogin) {
      const queryParams = (router.query as any) || {}
      const params = new URLSearchParams(queryParams)

      // trigger github signIn
      auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}?${params.toString()}`,
        },
      })
    }
  }, [])

  return autoLogin ? (
    <Connecting />
  ) : (
    <>
      <div className="flex flex-col gap-4">
        <LoginWithGitHub />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-scale-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-scale-400 px-2">Or</span>
          </div>
        </div>

        <LoginForm />
      </div>

      <div className="w-full border-t border-scale-700 my-4" />

      <div className="mb-4">
        <div>
          <span className="text-scale-1000">Need an account?</span>{' '}
          <Link href="/register">
            <a className="underline hover:text-scale-1100">Register</a>
          </Link>
        </div>

        <div>
          <span className="text-scale-1000">Forgot your password?</span>{' '}
          <Link href="/forgot-password">
            <a className="underline hover:text-scale-1100">Reset Password</a>
          </Link>
        </div>
      </div>
    </>
  )
}

LoginPage.getLayout = (page) => (
  <LoginLayout title="Login" logoLinkToMarketingSite={true}>
    {page}
  </LoginLayout>
)

export default LoginPage
