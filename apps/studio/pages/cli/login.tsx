import { useIsLoggedIn, useParams } from 'common'
import APIAuthorizationLayout from 'components/layouts/APIAuthorizationLayout'
import CopyButton from 'components/ui/CopyButton'
import { Loading } from 'components/ui/Loading'
import { createCliLoginSession } from 'data/cli/login'
import { withAuth } from 'hooks/misc/withAuth'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { NextPageWithLayout } from 'types'
import { InputOTP, InputOTPGroup, InputOTPSlot } from 'ui'

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
        const session = await createCliLoginSession(session_id, public_key, token_name)

        if (session) {
          router.push(`/cli/login?device_code=${session.nonce.substring(0, 8)}`)
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
            <p>Your Supabase Account is being used to sign in on Supabase CLI.</p>
            <p>Enter this verification code on Supabase CLI to authorize access.</p>
            <div className="flex flex-row gap-2 py-10">
              <InputOTP maxLength={8} value={device_code} disabled>
                <InputOTPGroup>
                  {Array.from({ length: 8 }, (_, i) => (
                    <InputOTPSlot className="text-xl" index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <CopyButton iconOnly size="large" type="text" className="px-2" text={device_code} />
            </div>
            <p>Once verification completes, you can close this window.</p>
            <p>
              If you ever want to remove your new token, go to{' '}
              <Link href="/account/tokens" className="underline">
                Access Tokens
              </Link>{' '}
              page.
            </p>
          </>
        ) : (
          <Loading />
        )}
      </div>
    </APIAuthorizationLayout>
  )
}

export default withAuth(CliLoginPage)
