import { useIsLoggedIn, useParams } from 'common'
import APIAuthorizationLayout from 'components/layouts/APIAuthorizationLayout'
import { Loading } from 'components/ui/Loading'
import { createCliLoginSession } from 'data/cli/login'
import { withAuth } from 'hooks/misc/withAuth'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { NextPageWithLayout } from 'types'

const CliLoginPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { session_id, public_key, token_name, success } = useParams()
  const [isSuccessfulLogin, setSuccessfulLogin] = useState(false)
  const isLoggedIn = useIsLoggedIn()

  useEffect(() => {
    if (!isLoggedIn || !router.isReady) {
      return
    }

    if (success) {
      setSuccessfulLogin(true)
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
          router.push(`/cli/login?success=true`)
        } else {
          router.push(`/404`)
        }
      } catch (error: any) {
        toast.error(`Failed to create login session: ${error.message}`)
        router.push(`/500`)
      }
    }

    createSession()
  }, [isLoggedIn, router, router.isReady, session_id, public_key, token_name, success])

  return (
    <APIAuthorizationLayout>
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
