import { useIsLoggedIn, useParams } from 'common'
import APIAuthorizationLayout from 'components/layouts/APIAuthorizationLayout'
import CopyButton from 'components/ui/CopyButton'
import { createCliLoginSession } from 'data/cli/login'
import { withAuth } from 'hooks/misc/withAuth'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import type { NextPageWithLayout } from 'types'
import { InputOTP, InputOTPGroup, InputOTPSlot, LogoLoader } from 'ui'
import { Admonition } from 'ui-patterns'

const CliLoginPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { session_id, public_key, token_name, device_code } = useParams()
  const isLoggedIn = useIsLoggedIn()

  useEffect(() => {
    if (!isLoggedIn || !router.isReady || device_code) {
      return
    }

    async function createSession() {
      if (!session_id || !public_key) {
        router.push('/404')
        return
      }

      try {
        const { nonce } = await createCliLoginSession(session_id, public_key, token_name)

        if (nonce) {
          router.push(`/cli/login?device_code=${nonce.substring(0, 8)}`)
        } else {
          router.push(`/404`)
        }
      } catch (error: any) {
        toast.error(`Failed to create login session: ${error.message}`)
        router.push(`/500`)
      }
    }

    createSession()
  }, [isLoggedIn, router, router.isReady, session_id, public_key, token_name, device_code])

  return (
    <APIAuthorizationLayout>
      <div className={`flex flex-col items-center justify-center h-full`}>
        {device_code ? (
          <>
            <h2 className="py-2">Your Supabase Account is being used to login on Supabase CLI.</h2>
            <p>Enter this verification code on Supabase CLI to authorize login.</p>
            <div className="flex flex-row gap-2 py-10">
              <InputOTP maxLength={8} value={device_code} disabled>
                <InputOTPGroup>
                  {Array.from({ length: 8 }, (_, i) => (
                    <InputOTPSlot key={i} className="text-xl" index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <CopyButton iconOnly size="large" type="text" className="px-2" text={device_code} />
            </div>
            <p>After authorizing the login attempt, you can close this window.</p>
            <p>
              If you ever want to remove your new token, go to{' '}
              <Link href="/account/tokens" className="underline">
                Access Tokens
              </Link>{' '}
              page.
            </p>
            <Admonition
              type="tip"
              title="Browser login flow requires Supabase CLI version 1.219.0 and above."
              className="mt-16"
            />
          </>
        ) : (
          <LogoLoader />
        )}
      </div>
    </APIAuthorizationLayout>
  )
}

export default withAuth(CliLoginPage)
