import { useIsLoggedIn, useParams } from 'common'
import APIAuthorizationLayout from 'components/layouts/APIAuthorizationLayout'
import CopyButton from 'components/ui/CopyButton'
import { Loading } from 'components/ui/Loading'
import { createCliLoginSession } from 'data/cli/login'
import { withAuth } from 'hooks/misc/withAuth'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { NextPageWithLayout } from 'types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

const CliLoginPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { session_id, public_key, token_name, device_code } = useParams()
  const [isSuccessfulLogin, setSuccessfulLogin] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const isLoggedIn = useIsLoggedIn()

  useEffect(() => {
    if (!isLoggedIn || !router.isReady) {
      return
    }

    if (device_code) {
      setSuccessfulLogin(true)
      setIsOpen(true)
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
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent size="xlarge">
          <DialogHeader>
            <DialogTitle>
              Your Supabase Account is being used to sign in on Supabase CLI.
            </DialogTitle>

            <DialogDescription>
              Enter this verification code on Supabase CLI to authorize access.
            </DialogDescription>
          </DialogHeader>

          <DialogSectionSeparator />

          <DialogSection>
            <p className="text-center text-4xl tracking-[.25em] text-foreground-light">
              {device_code}
              <CopyButton
                iconOnly
                size="large"
                type="outline"
                className="float-right px-2"
                text={device_code ?? ''}
              />
            </p>
          </DialogSection>
        </DialogContent>
      </Dialog>
      <div className={`flex flex-col items-center justify-center h-full`}>
        {isSuccessfulLogin ? (
          <>
            <p>Well done! Now close this window, go back to your terminal and hack away!</p>
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
