import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import * as Sentry from '@sentry/nextjs'

import { useRouter } from 'next/router'
import { useIsLoggedIn, useUser } from 'common'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Button } from 'ui'
import { get } from 'data/fetchers'
import { getDisplayName } from 'components/interfaces/Auth/Users/UserListItem.utils'

type VercelAuthState = 'invalid_code'

const SignInVercelMarketplace = () => {
  const { resolvedTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<VercelAuthState | null>(null)
  const isLoggedIn = useIsLoggedIn()
  const router = useRouter()
  const user = useUser()

  useEffect(() => {
    if (!isLoggedIn) {
      return
    }

    async function verifyVercelIdentity() {
      setLoading(true)
      // @ts-ignore Kamil: no types regenerated for this, as this is just hacking around different authentication flows
      const response = await get(`/partners/vercel/identity/verify`, {
        params: {
          query: {
            code: router.query.code,
          },
        },
      }).finally(async () => {
        // TODO: Remove this. For demo purposes only.
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setLoading(false)
      })

      // if (response.response.status === 200) {
      //   if (router.query.resource_id) {
      //     router.push(`/project/${router.query.resource_id}`)
      //   } else {
      //     router.push(`/projects`)
      //   }
      //   return
      // }

      if (response.response.status === 400) {
        setStatus('invalid_code')
      }
    }

    verifyVercelIdentity()
  }, [isLoggedIn, router])

  // Flow without invites/approvals for now.
  //
  // Is user signed in?
  // NO:
  //  - [x] if code is missing in query params, ask users to go through Vercel Dashboard;
  //  - [x] write an explanation that they need to login or sign-up;
  //  - [x] create 2 buttons that redirect to dashboard and preserve query string (it might be difficult for sign-up as it requires email confirmation);
  //  - [x] after login, redirect back to this page and perform [YES] flow;
  //  - [x] if code is missing in query params, ask users to go through Vercel Dashboard
  // YES:
  //  - send API request to validate that user has provided identity assigned to this account
  //  - if yes, we are done - redirect to dashboard using provided `resource_id` if present or projects list if not
  //  - if not, write explainer that someone is signed with an account that is not linked with this Vercel user
  //  - they need to either login to a different account or they can link this account as well(???)
  //  - if there is no identity linked yet, show prompt to confirm account linking and perform API call to link accounts if they do so
  //  - on successful linking, redirect to the dashboard using provided `resource_id` if present or projects list if not

  // TODO(kamil): Sign-up link do not preserve query strings which we need to redirect after successful sign-up.
  // This might not be needed if we won't get pop-up flow available anyway.
  async function onSignInWithVercelMarketplace() {
    if (isLoggedIn) {
      // @ts-ignore - this is
      const { response } = await get(`/partners/vercel/identity/verify`, {
        params: {
          query: {
            ...router.query,
          },
        },
      })

      console.log({ response })
    } else {
      try {
        router.push({
          pathname: 'sign-in',
          query: {
            ...router.query,
            returnTo: 'sign-in-vercel-marketplace',
          },
        })
        // router.push(vercel_resource_id ? `/project/${vercel_resource_id}` : `/projects`)
      } catch (error: any) {
        toast.error(`Failed to sign in via Vercel Marketplace: ${error.message}`)
        Sentry.captureMessage(
          '[CRITICAL] Failed to sign in via Vercel Marketplace: ' + error.message
        )
        setLoading(false)
      }
    }
  }

  return (
    <div className="relative mx-auto flex flex-1 w-full flex-col items-center justify-center space-y-6">
      <div className="absolute top-0 mx-auto w-full max-w-7xl px-8 pt-6 sm:px-6 lg:px-8">
        <nav className="relative flex items-center justify-between sm:h-10">
          <div className="flex flex-shrink-0 flex-grow items-center lg:flex-grow-0">
            <div className="flex w-full items-center justify-between md:w-auto">
              <Link href="/projects">
                <div>
                  <Image
                    src={
                      resolvedTheme?.includes('dark')
                        ? `${router.basePath}/img/supabase-dark.svg`
                        : `${router.basePath}/img/supabase-light.svg`
                    }
                    alt=""
                    height={24}
                    width={120}
                  />
                </div>
              </Link>
            </div>
          </div>
        </nav>
      </div>
      {!router.query.code && (
        <p className={'text-red-900 text-sm text-center'}>
          A SSO exchange code is required to login.
          <br />
          Go back to Vercel Marketplace and try again.
        </p>
      )}
      {router.query.code &&
        (isLoggedIn ? (
          <>
            <div className="flex w-[480px] flex-col text-center gap-2">
              <h4 className="text-lg">Logged in as {getDisplayName(user!, user!.email)}</h4>
              {loading ? (
                <p className="text-sm text-foreground-light mb-2">Verifying linked account...</p>
              ) : (
                <div className="flex flex-col items-center space-x-4 space-y-4">
                  {status === 'invalid_code' && (
                    <p className="text-red-900 text-sm text-center">
                      Invalid SSO exchange code.
                      <br />
                      Go back to Vercel Marketplace and try again.
                    </p>
                  )}
                  <Button>
                    <Link
                      href={{
                        pathname: '/sign-in',
                        query: {
                          ...router.query,
                          returnTo: 'sign-in-vercel-marketplace',
                        },
                      }}
                    >
                      Sign In
                    </Link>
                  </Button>
                </div>
              )}
              {/* CASE 1: This account is not linked anywhere, show "link account" button and redirect afterwards */}
              {/* CASE 2: This account is correctly linked and we can automatically redirect (show button for now) */}
              {/* CASE 3: This account is already linked to other account, show logout button and tell to login with different account */}
            </div>
          </>
        ) : (
          <div className="flex w-[480px] flex-col text-center gap-2">
            <h4 className="text-lg">Sign In to Continue</h4>
            <p className="text-sm text-foreground-light mb-2">
              You need to be logged in on order to continue.
              <br />
              Don't have an account?{' '}
              <Link
                href="/sign-up"
                className="underline transition text-foreground hover:text-foreground-light"
              >
                Sign Up Now
              </Link>{' '}
              and login
              <br />
              via Vercel Marketplace to link your accounts.
            </p>
            <div className="flex flex-col items-center space-x-4 space-y-4">
              <Button>
                <Link
                  href={{
                    pathname: '/sign-in',
                    query: {
                      ...router.query,
                      returnTo: 'sign-in-vercel-marketplace',
                    },
                  }}
                >
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        ))}
    </div>
  )
}

export default SignInVercelMarketplace
