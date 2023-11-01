import { NextPage } from 'next'
import APIAuthorizationLayout from 'components/layouts/APIAuthorizationLayout'
import { createCliLoginSession } from 'data/cli/login'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { withAuth } from 'hooks'
import Connecting from 'components/ui/Loading/Loading'
import { useEffect, useState } from 'react'

const CliLoginPage: NextPage = () => {
  const router = useRouter()
  const { session_id, public_key, token_name, success } = useParams()
  const [isSuccessfulLogin, setSuccessfulLogin] = useState(false)

  useEffect(() => {
    if (!router.isReady) {
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

      const session = await createCliLoginSession(session_id, public_key, token_name)

      if (session) {
        router.push(`/cli/login?success=true`)
      } else {
        router.push(`/404`)
      }
    }

    createSession()
  }, [router, router.isReady, session_id, public_key, token_name, success])

  return (
    <APIAuthorizationLayout>
      <div>
        <div className={`flex items-center justify-center h-full`}>
          {isSuccessfulLogin ? 'Well done! Now close this window, go back to your terminal and hack away!' : <Connecting /> }
        </div>
      </div>
    </APIAuthorizationLayout>
  )
}

export default withAuth(CliLoginPage)
