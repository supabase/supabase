import { useState } from 'react'
import toast from 'react-hot-toast'
import * as Sentry from '@sentry/nextjs'

import { auth } from 'lib/gotrue'
import { useRouter } from 'next/router'
import { useIsLoggedIn } from 'common'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Button } from 'ui'

const SignInVercelMarketplace = () => {
  const { resolvedTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const isLoggedIn = useIsLoggedIn()
  const router = useRouter()
  const {
    isReady,
    query: { vercel_id_token, vercel_resource_id },
  } = router

  async function onSignInWithVercelMarketplace() {
    if (isLoggedIn) {
      await auth.signOut()
    }

    try {
      if (!vercel_id_token) {
        throw new Error('missing required id_token query param')
      }

      setLoading(true)
      const { error } = await auth.signInWithIdToken({
        token: vercel_id_token as string,
        provider: 'vercel_marketplace',
      })

      if (error) {
        throw error
      }

      setIsRedirecting(true)
      router.push(vercel_resource_id ? `/project/${vercel_resource_id}` : `/projects`)
    } catch (error: any) {
      toast.error(`Failed to sign in via Vercel Marketplace: ${error.message}`)
      Sentry.captureMessage('[CRITICAL] Failed to sign in via Vercel Marketplace: ' + error.message)
      setLoading(false)
      setIsRedirecting(false)
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
      <div className="flex w-[480px] flex-col items-center justify-center space-y-3">
        <h4 className="text-lg">Continue to Supabase Dashboard</h4>
      </div>
      {loading ? (
        <p className="text-sm">Checking your access rights...</p>
      ) : (
        <div className="flex flex-col items-center space-x-4 space-y-4">
          <Button
            onClick={onSignInWithVercelMarketplace}
            disabled={!vercel_id_token || isRedirecting}
            loading={isRedirecting}
          >
            Login with Vercel Marketplace
          </Button>
          {isReady && !vercel_id_token && (
            <p className="text-red-900 text-sm">An ID token is required to login</p>
          )}
        </div>
      )}
      <div className="sm:text-center">
        <p className="text-xs text-foreground-lighter sm:mx-auto sm:max-w-sm">
          By continuing, you agree to Supabase's{' '}
          <Link href="https://supabase.com/terms" className="underline hover:text-foreground-light">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="https://supabase.com/privacy"
            className="underline hover:text-foreground-light"
          >
            Privacy Policy
          </Link>
          , and to receive periodic emails with updates.
        </p>
      </div>
    </div>
  )
}

export default SignInVercelMarketplace
